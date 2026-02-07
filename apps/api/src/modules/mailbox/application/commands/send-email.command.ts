import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import type { IMailboxRepository } from "../../domain/interfaces/mailbox.repository.interface";
import type { IEmailRepository } from "../../domain/interfaces/email.repository.interface";
import { GraphService, type GraphMessage } from "../services/graph.service";
import { ThreadingService } from "../services/threading.service";
import { Email, EmailParticipant } from "../../domain/entities/email.entity";
import type { SendEmailRequestDto } from "../../api/dto/send-email.dto";

/**
 * Result of sending an email
 */
export interface SendEmailResult {
  email: Email;
  messageId: string;
}

/**
 * Command to send an email via Microsoft Graph API and store it in the database
 * Flow: Send → Fetch from sentitems → Get raw content → Store in DB
 */
@Injectable()
export class SendEmailCommand {
  private readonly logger = new Logger(SendEmailCommand.name);

  constructor(
    @Inject("IMailboxRepository")
    private readonly mailboxRepository: IMailboxRepository,
    @Inject("IEmailRepository")
    private readonly emailRepository: IEmailRepository,
    private readonly graphService: GraphService,
    private readonly threadingService: ThreadingService,
  ) {}

  /**
   * Execute the send email command
   */
  async execute(request: SendEmailRequestDto): Promise<SendEmailResult> {
    this.logger.log(
      `Sending email from mailbox ${request.mailboxId} to ${request.to.length} recipient(s)`,
    );

    // Verify mailbox exists
    const mailbox = await this.mailboxRepository.findById(request.mailboxId);
    if (!mailbox) {
      throw new NotFoundException(
        `Mailbox with ID ${request.mailboxId} not found`,
      );
    }

    // Validate that we have either bodyText or bodyHtml
    if (!request.bodyText && !request.bodyHtml) {
      throw new BadRequestException(
        "Either bodyText or bodyHtml must be provided",
      );
    }

    // Validate that we have at least one recipient
    if (!request.to || request.to.length === 0) {
      throw new BadRequestException("At least one recipient (to) is required");
    }

    // Step 1: Send email via Microsoft Graph API
    this.logger.log(`Sending email via Graph API from ${mailbox.address}`);
    const internetMessageId = await this.graphService.sendEmail(
      mailbox.address,
      request.to,
      request.subject,
      request.bodyText,
      request.bodyHtml,
      request.cc,
      request.bcc,
      request.inReplyTo,
      request.references,
    );

    // Step 2: Wait a bit more and fetch the sent message from sentitems
    // Retry logic in case the message hasn't appeared yet
    let sentMessage: GraphMessage | null = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!sentMessage && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // If we have a valid internetMessageId, try to find by it
      if (internetMessageId !== "pending") {
        sentMessage = await this.graphService.getSentMessageByInternetMessageId(
          mailbox.address,
          internetMessageId,
        );
      }

      // If still not found, try getting the most recent messages and match by subject
      if (!sentMessage) {
        try {
          const recentMessages = await this.graphService.getRecentSentMessages(
            mailbox.address,
            10,
          );
          // Find the most recent message with matching subject
          // If we have internetMessageId, also match that; otherwise just match subject
          const matchingMessage = recentMessages.find((msg) => {
            const subjectMatch = msg.subject === request.subject;
            if (internetMessageId !== "pending") {
              return (
                subjectMatch && msg.internetMessageId === internetMessageId
              );
            }
            // For 'pending' case, just match subject and ensure it's very recent (within last minute)
            if (subjectMatch && msg.sentDateTime) {
              const sentTime = new Date(msg.sentDateTime);
              const now = new Date();
              const diffSeconds = (now.getTime() - sentTime.getTime()) / 1000;
              return diffSeconds < 60; // Within last 60 seconds
            }
            return false;
          });
          if (matchingMessage) {
            sentMessage = matchingMessage;
            break;
          }
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Fallback search failed: ${msg}`);
        }
      } else {
        // Found the message, break out of loop
        break;
      }

      attempts++;
    }

    if (!sentMessage) {
      throw new Error(
        `Could not retrieve sent message from sentitems after ${maxAttempts} attempts`,
      );
    }

    this.logger.log(
      `Retrieved sent message: ${sentMessage.id} (internetMessageId: ${sentMessage.internetMessageId})`,
    );

    // Step 3: Get raw RFC email source
    let rawSource = "";
    try {
      rawSource = await this.graphService.getMessageRawContent(
        mailbox.address,
        sentMessage.id,
      );
      this.logger.log(`Retrieved raw email source (${rawSource.length} bytes)`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Could not fetch raw content for sent message ${sentMessage.id}: ${msg}`,
      );
      // Continue without raw source - we'll create a minimal one
      rawSource = this.createMinimalRawSource(sentMessage, request);
    }

    // Step 4: Build participants list
    const participants: EmailParticipant[] = [];

    // From (the mailbox)
    participants.push({
      emailAddress: mailbox.address,
      displayName: mailbox.name || null,
      type: "from",
    });

    // To recipients
    for (const recipient of request.to) {
      participants.push({
        emailAddress: recipient.emailAddress,
        displayName: recipient.displayName || null,
        type: "to",
      });
    }

    // CC recipients
    if (request.cc) {
      for (const recipient of request.cc) {
        participants.push({
          emailAddress: recipient.emailAddress,
          displayName: recipient.displayName || null,
          type: "cc",
        });
      }
    }

    // BCC recipients (note: BCC won't appear in the sent message, but we store what was requested)
    if (request.bcc) {
      for (const recipient of request.bcc) {
        participants.push({
          emailAddress: recipient.emailAddress,
          displayName: recipient.displayName || null,
          type: "bcc",
        });
      }
    }

    // Step 5: Compute thread ID using threading service
    const threadingResult = await this.threadingService.computeThreadId(
      sentMessage.internetMessageId || sentMessage.id,
      rawSource,
      sentMessage.conversationId || null,
    );

    // Override with explicit inReplyTo if provided
    if (request.inReplyTo) {
      threadingResult.inReplyTo = request.inReplyTo;
      // If replying, try to find the parent thread
      const parentEmail = await this.emailRepository.findByMessageId(
        request.inReplyTo,
      );
      if (parentEmail) {
        threadingResult.threadId =
          parentEmail.threadId || parentEmail.messageId;
      }
    }

    // Override references if provided
    if (request.references) {
      threadingResult.references = request.references;
    }

    this.logger.debug(
      `Threading result: threadId=${threadingResult.threadId}, inReplyTo=${threadingResult.inReplyTo}`,
    );

    // Step 6: Check for duplicates
    const messageId = sentMessage.internetMessageId || sentMessage.id;
    const exists = await this.emailRepository.existsByMessageId(messageId);
    if (exists) {
      this.logger.warn(
        `Email with messageId ${messageId} already exists, returning existing email`,
      );
      const existingEmail =
        await this.emailRepository.findByMessageId(messageId);
      if (existingEmail) {
        return {
          email: existingEmail,
          messageId: messageId,
        };
      }
    }

    // Step 7: Create email data and store in database
    const emailData = {
      mailboxId: mailbox.id,
      messageId: messageId,
      threadId: threadingResult.threadId,
      inReplyTo: threadingResult.inReplyTo,
      references: threadingResult.references,
      subject: sentMessage.subject || request.subject || "(No Subject)",
      bodyText:
        sentMessage.body?.contentType === "text"
          ? sentMessage.body.content
          : request.bodyText || null,
      bodyHtml:
        sentMessage.body?.contentType === "html"
          ? sentMessage.body.content
          : request.bodyHtml || null,
      rawSource: rawSource,
      direction: "outgoing" as const,
      sentAt: sentMessage.sentDateTime
        ? new Date(sentMessage.sentDateTime)
        : new Date(),
      receivedAt: null,
    };

    const savedEmail = await this.emailRepository.create(
      emailData,
      participants,
    );

    this.logger.log(
      `Email sent and stored: ${savedEmail.id} - Subject: "${savedEmail.subject}"`,
    );

    return {
      email: savedEmail,
      messageId: messageId,
    };
  }

  /**
   * Create a minimal raw email source if we can't fetch it from Graph API
   * This is a fallback to ensure we always have rawSource stored
   */
  private createMinimalRawSource(
    message: { internetMessageId?: string; id: string },
    request: SendEmailRequestDto,
  ): string {
    const lines: string[] = [];
    lines.push(`Message-ID: <${message.internetMessageId ?? message.id}>`);
    lines.push(`From: ${request.to[0]?.emailAddress || "unknown"}`);
    lines.push(`To: ${request.to.map((r) => r.emailAddress).join(", ")}`);
    if (request.cc && request.cc.length > 0) {
      lines.push(`Cc: ${request.cc.map((r) => r.emailAddress).join(", ")}`);
    }
    lines.push(`Subject: ${request.subject}`);
    if (request.inReplyTo) {
      lines.push(`In-Reply-To: ${request.inReplyTo}`);
    }
    if (request.references) {
      lines.push(`References: ${request.references}`);
    }
    lines.push(`Date: ${new Date().toUTCString()}`);
    lines.push(
      `Content-Type: ${request.bodyHtml ? "text/html" : "text/plain"}`,
    );
    lines.push("");
    lines.push(request.bodyHtml || request.bodyText || "");
    return lines.join("\r\n");
  }
}
