import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import type { IEmailRepository } from '../../domain/interfaces/email.repository.interface';
import type { IMailboxRepository } from '../../domain/interfaces/mailbox.repository.interface';
import type { IEmailAttachmentRepository } from '../../domain/interfaces/email-attachment.repository.interface';
import type { EmailAttachmentRecord } from '../../domain/interfaces/email-attachment.repository.interface';
import { SyncMailboxCommand } from '../../application/commands/sync-mailbox.command';
import { SendEmailCommand } from '../../application/commands/send-email.command';
import {
  EmailListItemDto,
  EmailDetailDto,
  EmailAttachmentDto,
  EmailListResponseDto,
  EmailParticipantResponseDto,
  SyncResultDto,
  ThreadSummaryDto,
  ThreadListResponseDto,
  ThreadDetailDto,
} from '../dto/email-response.dto';
import {
  SendEmailRequestDto,
  SendEmailResponseDto,
} from '../dto/send-email.dto';
import { Email } from '../../domain/entities/email.entity';

@Controller('api/emails')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    @Inject('IEmailRepository')
    private readonly emailRepository: IEmailRepository,
    @Inject('IMailboxRepository')
    private readonly mailboxRepository: IMailboxRepository,
    @Inject('IEmailAttachmentRepository')
    private readonly attachmentRepository: IEmailAttachmentRepository,
    private readonly syncMailboxCommand: SyncMailboxCommand,
    private readonly sendEmailCommand: SendEmailCommand,
  ) {}

  /**
   * List all emails with pagination
   * GET /api/emails?page=1&limit=20
   */
  @Get()
  async listEmails(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<EmailListResponseDto> {
    this.logger.log(`Listing emails: page=${page}, limit=${limit}`);

    const result = await this.emailRepository.findAll({ page, limit });

    return {
      data: result.data.map((email) => this.toListItemDto(email)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.page * result.limit < result.total,
    };
  }

  /**
   * List threads with pagination
   * GET /api/emails/threads?mailboxId=xxx&page=1&limit=20&q=search
   */
  @Get('threads')
  async listThreads(
    @Query('mailboxId') mailboxId?: string,
    @Query('q') query?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<ThreadListResponseDto> {
    this.logger.log(
      `Listing threads: mailboxId=${mailboxId}, q=${query ?? ''}, page=${page}, limit=${limit}`,
    );

    const result = await this.emailRepository.getThreads({
      mailboxId,
      query: query?.trim() || undefined,
      page: page || 1,
      limit: limit || 20,
    });

    return {
      data: result.data.map(
        (thread): ThreadSummaryDto => ({
          threadId: thread.threadId,
          subject: thread.subject,
          messageCount: thread.messageCount,
          participants: thread.participants,
          latestMessageId: thread.latestMessageId,
          latestDate: thread.latestDate,
          snippet: thread.snippet,
        }),
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.page * result.limit < result.total,
    };
  }

  /**
   * Get all emails in a thread
   * GET /api/emails/thread/:threadId
   */
  @Get('thread/:threadId')
  async getThread(
    @Param('threadId') threadId: string,
  ): Promise<ThreadDetailDto> {
    this.logger.log(`Getting thread: ${threadId}`);

    const emailsWithAttachments =
      await this.emailRepository.findByThreadId(threadId);

    if (emailsWithAttachments.length === 0) {
      throw new NotFoundException(`Thread with ID ${threadId} not found`);
    }

    const subject = emailsWithAttachments[0].email.subject;
    return {
      threadId,
      subject,
      messageCount: emailsWithAttachments.length,
      messages: emailsWithAttachments.map(({ email, attachments }) =>
        this.toDetailDto(email, attachments),
      ),
    };
  }

  /**
   * Search emails
   * GET /api/emails/search?q=query&mailboxId=xxx&page=1&limit=20
   */
  @Get('search')
  async searchEmails(
    @Query('q') query: string,
    @Query('mailboxId') mailboxId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<EmailListResponseDto> {
    if (!query || query.trim().length === 0) {
      return {
        data: [],
        total: 0,
        page: page || 1,
        limit: limit || 20,
        hasMore: false,
      };
    }

    this.logger.log(
      `Searching emails: q="${query}", mailboxId=${mailboxId}, page=${page}, limit=${limit}`,
    );

    const result = await this.emailRepository.search({
      query: query.trim(),
      mailboxId,
      page: page || 1,
      limit: limit || 20,
    });

    return {
      data: result.data.map((email) => this.toListItemDto(email)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.page * result.limit < result.total,
    };
  }

  /**
   * Get single email by ID
   * GET /api/emails/:id
   */
  @Get(':id')
  async getEmail(@Param('id') id: string): Promise<EmailDetailDto> {
    this.logger.log(`Getting email: ${id}`);

    const email = await this.emailRepository.findById(id);

    if (!email) {
      throw new NotFoundException(`Email with ID ${id} not found`);
    }

    const attachments = await this.attachmentRepository.findByEmailId(email.id);
    return this.toDetailDto(email, attachments);
  }

  /**
   * List emails for a specific mailbox
   * GET /api/mailboxes/:mailboxId/emails?page=1&limit=20
   */
  @Get('/mailbox/:mailboxId')
  async listMailboxEmails(
    @Param('mailboxId') mailboxId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<EmailListResponseDto> {
    this.logger.log(
      `Listing emails for mailbox ${mailboxId}: page=${page}, limit=${limit}`,
    );

    // Verify mailbox exists
    const mailbox = await this.mailboxRepository.findById(mailboxId);
    if (!mailbox) {
      throw new NotFoundException(`Mailbox with ID ${mailboxId} not found`);
    }

    const result = await this.emailRepository.findByMailboxId(mailboxId, {
      page,
      limit,
    });

    return {
      data: result.data.map((email) => this.toListItemDto(email)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.page * result.limit < result.total,
    };
  }

  /**
   * Manually trigger sync for a mailbox
   * POST /api/mailboxes/:mailboxId/sync
   */
  @Post('/mailbox/:mailboxId/sync')
  async syncMailbox(
    @Param('mailboxId') mailboxId: string,
  ): Promise<SyncResultDto> {
    this.logger.log(`Manual sync triggered for mailbox ${mailboxId}`);

    // Verify mailbox exists
    const mailbox = await this.mailboxRepository.findById(mailboxId);
    if (!mailbox) {
      throw new NotFoundException(`Mailbox with ID ${mailboxId} not found`);
    }

    const result = await this.syncMailboxCommand.execute(mailboxId);

    return {
      mailboxId: result.mailboxId,
      mailboxAddress: result.mailboxAddress,
      messagesProcessed: result.messagesProcessed,
      messagesCreated: result.messagesCreated,
      messagesSkipped: result.messagesSkipped,
      syncedAt: new Date(),
    };
  }

  /**
   * Send an email
   * POST /api/emails/send
   */
  @Post('send')
  async sendEmail(
    @Body() request: SendEmailRequestDto,
  ): Promise<SendEmailResponseDto> {
    this.logger.log(
      `Sending email from mailbox ${request.mailboxId} to ${request.to.length} recipient(s)`,
    );

    try {
      const result = await this.sendEmailCommand.execute(request);

      return {
        id: result.email.id,
        mailboxId: result.email.mailboxId,
        messageId: result.messageId,
        threadId: result.email.threadId,
        subject: result.email.subject,
        sentAt: result.email.sentAt || new Date(),
        direction: 'outgoing',
      };
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);

      // Return a more descriptive error response
      const statusCode = error.statusCode || error.status || 500;
      const message = error.message || 'Failed to send email';

      throw new BadRequestException({
        statusCode,
        message,
        error:
          error.originalError ||
          error.response?.data ||
          'Internal server error',
      });
    }
  }

  /**
   * Convert Email entity to list item DTO
   */
  private toListItemDto(email: Email): EmailListItemDto {
    const from = email.getFrom();

    return {
      id: email.id,
      mailboxId: email.mailboxId,
      threadId: email.threadId,
      subject: email.subject,
      from: from
        ? {
            emailAddress: from.emailAddress,
            displayName: from.displayName,
            type: from.type,
          }
        : null,
      receivedAt: email.receivedAt,
      sentAt: email.sentAt,
      direction: email.direction,
      hasBody: !!(email.bodyText || email.bodyHtml),
    };
  }

  /**
   * Convert Email entity to detail DTO
   */
  private toDetailDto(
    email: Email,
    attachments: EmailAttachmentRecord[] = [],
  ): EmailDetailDto {
    return {
      id: email.id,
      mailboxId: email.mailboxId,
      messageId: email.messageId,
      threadId: email.threadId,
      inReplyTo: email.inReplyTo,
      references: email.references,
      subject: email.subject,
      bodyText: email.bodyText,
      bodyHtml: email.bodyHtml,
      direction: email.direction,
      sentAt: email.sentAt,
      receivedAt: email.receivedAt,
      createdAt: email.createdAt,
      participants: email.participants.map(
        (p): EmailParticipantResponseDto => ({
          emailAddress: p.emailAddress,
          displayName: p.displayName,
          type: p.type,
        }),
      ),
      attachments: attachments.map(
        (a): EmailAttachmentDto => ({
          id: a.id,
          filename: a.filename,
          mimeType: a.mimeType,
          size: a.size,
          fileUrl: a.fileUrl,
          isInline: a.isInline,
        }),
      ),
    };
  }
}
