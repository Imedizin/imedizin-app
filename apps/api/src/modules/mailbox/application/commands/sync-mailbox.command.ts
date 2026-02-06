import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GraphService, GraphMessage } from '../services/graph.service';
import { ThreadingService } from '../services/threading.service';
import {
  EMAIL_RECEIVED_EVENT,
  EmailReceivedEvent,
} from '../../domain/events/email-received.event';
import type { IMailboxRepository } from '../../domain/interfaces/mailbox.repository.interface';
import type { IEmailRepository } from '../../domain/interfaces/email.repository.interface';
import type { EmailParticipant } from '../../domain/entities/email.entity';
import { Mailbox } from '../../domain/entities/mailbox.entity';

/**
 * Result of a mailbox sync operation
 */
export interface SyncResult {
  mailboxId: string;
  mailboxAddress: string;
  messagesProcessed: number;
  messagesCreated: number;
  messagesSkipped: number;
  deltaLink: string;
}

/**
 * Result of processing a single message
 */
interface ProcessMessageResult {
  created: boolean;
  emailId?: string;
  subject?: string;
  from?: { emailAddress: string; displayName: string | null };
  receivedAt?: string | null;
}

@Injectable()
export class SyncMailboxCommand {
  private readonly logger = new Logger(SyncMailboxCommand.name);

  constructor(
    private readonly graphService: GraphService,
    private readonly threadingService: ThreadingService,
    private readonly eventEmitter: EventEmitter2,
    @Inject('IMailboxRepository')
    private readonly mailboxRepository: IMailboxRepository,
    @Inject('IEmailRepository')
    private readonly emailRepository: IEmailRepository,
  ) {}

  /**
   * Sync a mailbox using delta query
   * @param mailboxId - Mailbox ID to sync
   */
  async execute(mailboxId: string): Promise<SyncResult> {
    const mailbox = await this.mailboxRepository.findById(mailboxId);

    if (!mailbox) {
      throw new Error(`Mailbox ${mailboxId} not found`);
    }

    return this.syncMailbox(mailbox);
  }

  /**
   * Sync a mailbox by email address
   * @param mailboxAddress - Mailbox email address to sync
   */
  async executeByAddress(mailboxAddress: string): Promise<SyncResult> {
    const mailbox = await this.mailboxRepository.findByAddress(mailboxAddress);

    if (!mailbox) {
      throw new Error(`Mailbox ${mailboxAddress} not found`);
    }

    return this.syncMailbox(mailbox);
  }

  /**
   * Perform the actual sync operation
   */
  private async syncMailbox(mailbox: Mailbox): Promise<SyncResult> {
    this.logger.log(
      `Starting delta sync for mailbox ${mailbox.address} (ID: ${mailbox.id})`,
    );

    const result: SyncResult = {
      mailboxId: mailbox.id,
      mailboxAddress: mailbox.address,
      messagesProcessed: 0,
      messagesCreated: 0,
      messagesSkipped: 0,
      deltaLink: '',
    };

    try {
      // First sync (no delta link): bootstrap a "from-now" delta link without ingesting history
      if (!mailbox.deltaLink) {
        this.logger.log(
          `No delta link for ${mailbox.address}, bootstrapping (no history)`,
        );
        const { deltaLink } = await this.graphService.bootstrapDeltaLink(
          mailbox.address,
        );
        await this.mailboxRepository.updateDeltaLink(mailbox.id, deltaLink);
        result.deltaLink = deltaLink;
        this.logger.log(
          `Delta link bootstrapped for ${mailbox.address}, future syncs will be incremental`,
        );
        return result;
      }

      // Get messages using delta query (incremental)
      const { messages, deltaLink } = await this.graphService.getMessagesDelta(
        mailbox.address,
        mailbox.deltaLink,
      );

      result.messagesProcessed = messages.length;

      // Process each message
      for (const message of messages) {
        try {
          const processResult = await this.processMessage(mailbox, message);
          if (processResult.created) {
            result.messagesCreated++;

            // Domain event: handlers (e.g. realtime notification) react to it
            if (processResult.emailId && processResult.from) {
              this.eventEmitter.emit(
                EMAIL_RECEIVED_EVENT,
                new EmailReceivedEvent(
                  mailbox.id,
                  processResult.emailId,
                  processResult.subject || '(No Subject)',
                  processResult.from,
                  processResult.receivedAt || null,
                ),
              );
            }
          } else {
            result.messagesSkipped++;
          }
        } catch (error: any) {
          this.logger.error(
            `Failed to process message ${message.id}: ${error.message}`,
          );
          result.messagesSkipped++;
        }
      }

      // Update delta link in database
      await this.mailboxRepository.updateDeltaLink(mailbox.id, deltaLink);
      result.deltaLink = deltaLink;

      this.logger.log(
        `Delta sync complete for ${mailbox.address}: ` +
          `${result.messagesCreated} created, ${result.messagesSkipped} skipped`,
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Delta sync failed for ${mailbox.address}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Process a single message from delta response
   * @returns ProcessMessageResult with created status and email details
   */
  private async processMessage(
    mailbox: Mailbox,
    message: GraphMessage,
  ): Promise<ProcessMessageResult> {
    // Resolve message ID and content source: delta sometimes omits internetMessageId or returns minimal fields; use full fetch when needed
    let messageIdForStorage: string =
      message.internetMessageId || `graph:${message.id}`;
    let messageForContent: GraphMessage = message;
    const needsFullMessage =
      !message.internetMessageId ||
      !message.from?.emailAddress ||
      (message.subject == null && message.body?.content == null);
    if (needsFullMessage) {
      try {
        const fullMessage = await this.graphService.getMessage(
          mailbox.address,
          message.id,
        );
        if (fullMessage) {
          messageForContent = fullMessage;
          if (fullMessage.internetMessageId) {
            messageIdForStorage = fullMessage.internetMessageId;
          }
        }
      } catch (error: any) {
        this.logger.debug(
          `Could not fetch full message ${message.id}: ${error.message}`,
        );
      }
      if (messageIdForStorage === `graph:${message.id}`) {
        this.logger.debug(
          `Message ${message.id} has no internetMessageId, using fallback: ${messageIdForStorage}`,
        );
      }
    }

    const exists =
      await this.emailRepository.existsByMessageId(messageIdForStorage);

    if (exists) {
      this.logger.debug(
        `Message ${messageIdForStorage} already exists, skipping`,
      );
      return { created: false };
    }

    // Fetch raw MIME content
    let rawSource = '';
    try {
      rawSource = await this.graphService.getMessageRawContent(
        mailbox.address,
        message.id,
      );
    } catch (error: any) {
      this.logger.warn(
        `Could not fetch raw content for message ${message.id}: ${error.message}`,
      );
      // Continue without raw source
    }

    // Build participants list from the message we use for content (full message when delta had minimal data)
    const participants: EmailParticipant[] = [];

    // From
    let fromParticipant:
      | { emailAddress: string; displayName: string | null }
      | undefined;
    if (messageForContent.from?.emailAddress) {
      fromParticipant = {
        emailAddress: messageForContent.from.emailAddress.address,
        displayName: messageForContent.from.emailAddress.name || null,
      };
      participants.push({
        ...fromParticipant,
        type: 'from',
      });
    }

    // To recipients
    for (const recipient of messageForContent.toRecipients || []) {
      participants.push({
        emailAddress: recipient.emailAddress.address,
        displayName: recipient.emailAddress.name || null,
        type: 'to',
      });
    }

    // CC recipients
    for (const recipient of messageForContent.ccRecipients || []) {
      participants.push({
        emailAddress: recipient.emailAddress.address,
        displayName: recipient.emailAddress.name || null,
        type: 'cc',
      });
    }

    // BCC recipients
    for (const recipient of messageForContent.bccRecipients || []) {
      participants.push({
        emailAddress: recipient.emailAddress.address,
        displayName: recipient.emailAddress.name || null,
        type: 'bcc',
      });
    }

    // Reply-To
    for (const recipient of messageForContent.replyTo || []) {
      participants.push({
        emailAddress: recipient.emailAddress.address,
        displayName: recipient.emailAddress.name || null,
        type: 'reply_to',
      });
    }

    // Compute thread ID using internal threading (RFC headers + Microsoft fallback)
    const threadingResult = await this.threadingService.computeThreadId(
      messageIdForStorage,
      rawSource,
      messageForContent.conversationId || null,
    );

    this.logger.debug(
      `Threading result for ${messageIdForStorage}: threadId=${threadingResult.threadId}, inReplyTo=${threadingResult.inReplyTo}`,
    );

    // Create email data from the message we use for content
    const emailData = {
      mailboxId: mailbox.id,
      messageId: messageIdForStorage,
      threadId: threadingResult.threadId,
      inReplyTo: threadingResult.inReplyTo,
      references: threadingResult.references,
      subject: messageForContent.subject || '(No Subject)',
      bodyText:
        messageForContent.body?.contentType === 'text'
          ? messageForContent.body.content
          : null,
      bodyHtml:
        messageForContent.body?.contentType === 'html'
          ? messageForContent.body.content
          : null,
      rawSource: rawSource,
      direction: 'incoming' as const,
      sentAt: messageForContent.sentDateTime
        ? new Date(messageForContent.sentDateTime)
        : null,
      receivedAt: messageForContent.receivedDateTime
        ? new Date(messageForContent.receivedDateTime)
        : null,
    };

    // Save to database
    const savedEmail = await this.emailRepository.create(
      emailData,
      participants,
    );

    this.logger.log(
      `Saved email: ${savedEmail.id} - Subject: "${savedEmail.subject}"`,
    );

    return {
      created: true,
      emailId: savedEmail.id,
      subject: savedEmail.subject,
      from: fromParticipant,
      receivedAt: messageForContent.receivedDateTime || null,
    };
  }
}
