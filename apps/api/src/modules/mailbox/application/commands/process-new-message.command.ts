import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import {
  GraphService,
  GraphMessage,
  GraphAttachmentMeta,
} from '../services/graph.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ThreadingService } from '../services/threading.service';
import {
  EMAIL_RECEIVED_EVENT,
  EmailReceivedEvent,
} from '../../domain/events/email-received.event';
import type { IMailboxRepository } from '../../domain/interfaces/mailbox.repository.interface';
import type { IEmailRepository } from '../../domain/interfaces/email.repository.interface';
import type { IEmailAttachmentRepository } from '../../domain/interfaces/email-attachment.repository.interface';
import type { EmailParticipant } from '../../domain/entities/email.entity';
import type { Mailbox } from '../../domain/entities/mailbox.entity';

/**
 * Payload for a single new-message job (Stage 1: one job per messageId).
 */
export interface NewMessageJobPayload {
  mailboxId: string;
  messageId: string; // Graph API message ID (resourceData.id)
}

@Injectable()
export class ProcessNewMessageCommand {
  private readonly logger = new Logger(ProcessNewMessageCommand.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly graphService: GraphService,
    private readonly threadingService: ThreadingService,
    private readonly eventEmitter: EventEmitter2,
    @Inject('IMailboxRepository')
    private readonly mailboxRepository: IMailboxRepository,
    @Inject('IEmailRepository')
    private readonly emailRepository: IEmailRepository,
    @Inject('IEmailAttachmentRepository')
    private readonly attachmentRepository: IEmailAttachmentRepository,
  ) {}

  /**
   * Resolve mailbox by id (UUID) or by address (email).
   * Subscriptions store mailboxId as email address. Try by address first when
   * it looks like an email to avoid passing a non-UUID to findById (Postgres throws).
   */
  private async resolveMailbox(mailboxId: string): Promise<Mailbox | null> {
    if (mailboxId.includes('@')) {
      const byAddress = await this.mailboxRepository.findByAddress(mailboxId);
      if (byAddress) return byAddress;
    }
    return this.mailboxRepository.findById(mailboxId);
  }

  /**
   * Process a single new message: fetch from Graph and store subject/from/date in DB.
   */
  async execute(payload: NewMessageJobPayload): Promise<void> {
    const { mailboxId, messageId: graphMessageId } = payload;

    this.logger.log(
      `Processing new message: mailboxId=${mailboxId}, messageId=${graphMessageId}`,
    );

    const mailbox = await this.resolveMailbox(mailboxId);
    if (!mailbox) {
      throw new Error(`Mailbox ${mailboxId} not found`);
    }

    const message = await this.graphService.getMessage(
      mailbox.address,
      graphMessageId,
    );

    const messageIdForStorage =
      message.internetMessageId ?? `graph:${message.id}`;

    const exists =
      await this.emailRepository.existsByMessageId(messageIdForStorage);
    if (exists) {
      this.logger.debug(
        `Message ${messageIdForStorage} already exists, skipped`,
      );
      return;
    }

    let rawSource = '';
    try {
      rawSource = await this.graphService.getMessageRawContent(
        mailbox.address,
        graphMessageId,
      );
    } catch (err) {
      this.logger.warn(
        `Could not fetch raw content for message ${graphMessageId}: ${(err as Error).message}`,
      );
    }

    const participants = this.buildParticipants(message);

    const threadingResult = await this.threadingService.computeThreadId(
      messageIdForStorage,
      rawSource,
      message.conversationId ?? null,
    );

    const emailData = {
      mailboxId: mailbox.id,
      messageId: messageIdForStorage,
      threadId: threadingResult.threadId,
      inReplyTo: threadingResult.inReplyTo,
      references: threadingResult.references,
      subject: message.subject ?? '(No Subject)',
      bodyText:
        message.body?.contentType === 'text' ? message.body.content : null,
      bodyHtml:
        message.body?.contentType === 'html' ? message.body.content : null,
      rawSource,
      direction: 'incoming' as const,
      sentAt: message.sentDateTime ? new Date(message.sentDateTime) : null,
      receivedAt: message.receivedDateTime
        ? new Date(message.receivedDateTime)
        : null,
    };

    const savedEmail = await this.emailRepository.create(
      emailData,
      participants,
    );

    this.logger.log(
      `Saved email: ${savedEmail.id} - Subject: "${savedEmail.subject}"`,
    );

    if (message.hasAttachments) {
      await this.downloadAndSaveAttachments(
        mailbox.address,
        graphMessageId,
        mailbox.id,
        savedEmail.id,
      );
    }

    // Domain event: handlers (e.g. SSE notification) react to it
    const from = message.from?.emailAddress
      ? {
          emailAddress: message.from.emailAddress.address,
          displayName: message.from.emailAddress.name ?? null,
        }
      : { emailAddress: '', displayName: null };
    this.eventEmitter.emit(
      EMAIL_RECEIVED_EVENT,
      new EmailReceivedEvent(
        mailbox.id,
        savedEmail.id,
        savedEmail.subject,
        from,
        message.receivedDateTime ?? null,
        mailbox.address,
      ),
    );
  }

  /**
   * List attachments from Graph, download file attachments, save to disk, store link in DB.
   * Path format: attachments/{mailboxId}/{emailId}/{attachmentId}-{filename} (S3-ready later).
   */
  private async downloadAndSaveAttachments(
    mailboxAddress: string,
    graphMessageId: string,
    mailboxId: string,
    emailId: string,
  ): Promise<void> {
    const basePath = this.configService.get<string>(
      'ATTACHMENTS_PATH',
      './data/attachments',
    );

    let list: GraphAttachmentMeta[];
    try {
      list = await this.graphService.listMessageAttachments(
        mailboxAddress,
        graphMessageId,
      );
    } catch (err) {
      this.logger.warn(
        `Could not list attachments for message ${graphMessageId}: ${(err as Error).message}`,
      );
      return;
    }

    const fileAttachments = list.filter((a) =>
      (a['@odata.type'] ?? '').toLowerCase().endsWith('fileattachment'),
    );

    for (const att of fileAttachments) {
      try {
        const content = await this.graphService.getAttachmentContent(
          mailboxAddress,
          graphMessageId,
          att.id,
        );
        const sanitized = this.sanitizeFilename(att.name || att.id);
        const relativePath = `${mailboxId}/${emailId}/${att.id}-${sanitized}`;
        const fullPath = path.join(basePath, relativePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);

        const baseUrl =
          this.configService
            .get<string>('APP_PUBLIC_URL', '')
            .replace(/\/$/, '') || 'http://localhost:3000';
        const fileUrl = `${baseUrl}/attachments/${relativePath}`;

        await this.attachmentRepository.create({
          emailId,
          filename: att.name || att.id,
          mimeType: att.contentType || 'application/octet-stream',
          size: att.size,
          fileUrl,
          isInline: att.isInline ?? false,
        });

        this.logger.log(
          `Saved attachment: ${att.name} -> ${relativePath} (${att.size} bytes), link: ${fileUrl}`,
        );
      } catch (err) {
        const e = err as Error & { cause?: unknown; code?: string };
        const detail =
          e.cause != null
            ? String(e.cause)
            : e.code != null
              ? `${e.message} (code: ${e.code})`
              : e.message;
        this.logger.warn(
          `Could not save attachment ${att.id} (${att.name}): ${detail}`,
        );
      }
    }
  }

  private sanitizeFilename(name: string): string {
    const safe = name.replace(/[/\\:*?"<>|]/g, '_');
    return safe.length > 200 ? safe.slice(0, 200) : safe;
  }

  private buildParticipants(message: GraphMessage): EmailParticipant[] {
    const participants: EmailParticipant[] = [];

    if (message.from?.emailAddress) {
      participants.push({
        emailAddress: message.from.emailAddress.address,
        displayName: message.from.emailAddress.name ?? null,
        type: 'from',
      });
    }

    for (const r of message.toRecipients ?? []) {
      participants.push({
        emailAddress: r.emailAddress.address,
        displayName: r.emailAddress.name ?? null,
        type: 'to',
      });
    }
    for (const r of message.ccRecipients ?? []) {
      participants.push({
        emailAddress: r.emailAddress.address,
        displayName: r.emailAddress.name ?? null,
        type: 'cc',
      });
    }
    for (const r of message.bccRecipients ?? []) {
      participants.push({
        emailAddress: r.emailAddress.address,
        displayName: r.emailAddress.name ?? null,
        type: 'bcc',
      });
    }
    for (const r of message.replyTo ?? []) {
      participants.push({
        emailAddress: r.emailAddress.address,
        displayName: r.emailAddress.name ?? null,
        type: 'reply_to',
      });
    }

    return participants;
  }
}
