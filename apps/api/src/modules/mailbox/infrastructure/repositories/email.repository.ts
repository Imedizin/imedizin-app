import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../../../../shared/common/database/database.module';
import type { Database } from '../../../../shared/common/database/database.module';
import { emails, emailParticipants, emailAttachments } from '../schema';
import { Email, EmailParticipant } from '../../domain/entities/email.entity';
import type {
  IEmailRepository,
  CreateEmailData,
  PaginationOptions,
  PaginatedResult,
  EmailSearchOptions,
  ThreadSummary,
  ThreadSearchOptions,
} from '../../domain/interfaces/email.repository.interface';
import type { EmailAttachmentRecord } from '../../domain/interfaces/email-attachment.repository.interface';
import {
  eq,
  desc,
  count,
  or,
  ilike,
  and,
  sql,
  asc,
  inArray,
} from 'drizzle-orm';

/**
 * Email repository implementation
 * Handles data persistence using Drizzle ORM
 */
@Injectable()
export class EmailRepository implements IEmailRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database,
  ) {}

  /**
   * Find email by ID
   */
  async findById(id: string): Promise<Email | null> {
    const result = await this.db
      .select()
      .from(emails)
      .where(eq(emails.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const participants = await this.getParticipants(id);
    return this.toDomainEntity(result[0], participants);
  }

  /**
   * Find email by Microsoft Message ID
   */
  async findByMessageId(messageId: string): Promise<Email | null> {
    const result = await this.db
      .select()
      .from(emails)
      .where(eq(emails.messageId, messageId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const participants = await this.getParticipants(result[0].id);
    return this.toDomainEntity(result[0], participants);
  }

  /**
   * Find all emails for a mailbox with pagination
   */
  async findByMailboxId(
    mailboxId: string,
    options: PaginationOptions = { page: 1, limit: 50 },
  ): Promise<PaginatedResult<Email>> {
    const { page, limit } = options;
    const offset = (page - 1) * limit;

    // Get total count
    const totalResult = await this.db
      .select({ count: count() })
      .from(emails)
      .where(eq(emails.mailboxId, mailboxId));
    const total = totalResult[0]?.count || 0;

    // Get paginated results
    const result = await this.db
      .select()
      .from(emails)
      .where(eq(emails.mailboxId, mailboxId))
      .orderBy(desc(emails.receivedAt))
      .limit(limit)
      .offset(offset);

    const emailsWithParticipants = await Promise.all(
      result.map(async (row) => {
        const participants = await this.getParticipants(row.id);
        return this.toDomainEntity(row, participants);
      }),
    );

    return {
      data: emailsWithParticipants,
      total,
      page,
      limit,
    };
  }

  /**
   * Find all emails with pagination
   */
  async findAll(
    options: PaginationOptions = { page: 1, limit: 50 },
  ): Promise<PaginatedResult<Email>> {
    const { page, limit } = options;
    const offset = (page - 1) * limit;

    // Get total count
    const totalResult = await this.db.select({ count: count() }).from(emails);
    const total = totalResult[0]?.count || 0;

    // Get paginated results
    const result = await this.db
      .select()
      .from(emails)
      .orderBy(desc(emails.receivedAt))
      .limit(limit)
      .offset(offset);

    const emailsWithParticipants = await Promise.all(
      result.map(async (row) => {
        const participants = await this.getParticipants(row.id);
        return this.toDomainEntity(row, participants);
      }),
    );

    return {
      data: emailsWithParticipants,
      total,
      page,
      limit,
    };
  }

  /**
   * Search emails by subject or body
   */
  async search(options: EmailSearchOptions): Promise<PaginatedResult<Email>> {
    const { query, mailboxId, page, limit } = options;
    const offset = (page - 1) * limit;
    const searchPattern = `%${query}%`;

    // Build where conditions
    const searchCondition = or(
      ilike(emails.subject, searchPattern),
      ilike(emails.bodyText, searchPattern),
      ilike(emails.bodyHtml, searchPattern),
    );

    const whereCondition = mailboxId
      ? and(eq(emails.mailboxId, mailboxId), searchCondition)
      : searchCondition;

    // Get total count
    const totalResult = await this.db
      .select({ count: count() })
      .from(emails)
      .where(whereCondition);
    const total = totalResult[0]?.count || 0;

    // Get paginated results
    const result = await this.db
      .select()
      .from(emails)
      .where(whereCondition)
      .orderBy(desc(emails.receivedAt))
      .limit(limit)
      .offset(offset);

    const emailsWithParticipants = await Promise.all(
      result.map(async (row) => {
        const participants = await this.getParticipants(row.id);
        return this.toDomainEntity(row, participants);
      }),
    );

    return {
      data: emailsWithParticipants,
      total,
      page,
      limit,
    };
  }

  /**
   * Count emails for a mailbox
   */
  async countByMailboxId(mailboxId: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(emails)
      .where(eq(emails.mailboxId, mailboxId));

    return result[0]?.count || 0;
  }

  /**
   * Create a new email with participants
   */
  async create(
    email: CreateEmailData,
    participants: EmailParticipant[],
  ): Promise<Email> {
    // Insert email
    const emailResult = await this.db
      .insert(emails)
      .values({
        mailboxId: email.mailboxId,
        messageId: email.messageId,
        threadId: email.threadId,
        inReplyTo: email.inReplyTo,
        references: email.references,
        subject: email.subject,
        bodyText: email.bodyText,
        bodyHtml: email.bodyHtml,
        rawSource: email.rawSource,
        direction: email.direction,
        sentAt: email.sentAt,
        receivedAt: email.receivedAt,
      })
      .returning();

    const createdEmail = emailResult[0];

    // Insert participants
    if (participants.length > 0) {
      await this.db.insert(emailParticipants).values(
        participants.map((p) => ({
          emailId: createdEmail.id,
          emailAddress: p.emailAddress,
          displayName: p.displayName,
          type: p.type,
        })),
      );
    }

    const savedParticipants = await this.getParticipants(createdEmail.id);
    return this.toDomainEntity(createdEmail, savedParticipants);
  }

  /**
   * Check if email exists by message ID
   */
  async existsByMessageId(messageId: string): Promise<boolean> {
    const result = await this.db
      .select({ id: emails.id })
      .from(emails)
      .where(eq(emails.messageId, messageId))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Get participants for an email
   */
  private async getParticipants(emailId: string): Promise<EmailParticipant[]> {
    const result = await this.db
      .select()
      .from(emailParticipants)
      .where(eq(emailParticipants.emailId, emailId));

    return result.map((row) => ({
      emailAddress: row.emailAddress,
      displayName: row.displayName,
      type: row.type as EmailParticipant['type'],
    }));
  }

  /**
   * Get participants for multiple emails in one query
   */
  private async getParticipantsForEmailIds(
    emailIds: string[],
  ): Promise<Map<string, EmailParticipant[]>> {
    if (emailIds.length === 0) return new Map();
    const result = await this.db
      .select()
      .from(emailParticipants)
      .where(inArray(emailParticipants.emailId, emailIds));
    const map = new Map<string, EmailParticipant[]>();
    for (const row of result) {
      const p: EmailParticipant = {
        emailAddress: row.emailAddress,
        displayName: row.displayName,
        type: row.type,
      };
      const list = map.get(row.emailId) ?? [];
      list.push(p);
      map.set(row.emailId, list);
    }
    return map;
  }

  /**
   * Find all emails in a thread (with attachments; GROUP BY + json_agg + one participants query)
   * Order by COALESCE(sentAt, receivedAt) so both incoming and outgoing sort chronologically.
   */
  async findByThreadId(
    threadId: string,
  ): Promise<Array<{ email: Email; attachments: EmailAttachmentRecord[] }>> {
    const rows = await this.db
      .select({
        email: emails,
        attachments: sql<string>`
          COALESCE(
            json_agg(
              json_build_object(
                'id', ${emailAttachments.id},
                'emailId', ${emailAttachments.emailId},
                'filename', ${emailAttachments.filename},
                'mimeType', ${emailAttachments.mimeType},
                'size', ${emailAttachments.size},
                'fileUrl', ${emailAttachments.fileUrl},
                'isInline', ${emailAttachments.isInline},
                'createdAt', ${emailAttachments.createdAt}
              )
            ) FILTER (WHERE ${emailAttachments.id} IS NOT NULL),
            '[]'::json
          )
        `.as('attachments'),
      })
      .from(emails)
      .leftJoin(emailAttachments, eq(emailAttachments.emailId, emails.id))
      .where(eq(emails.threadId, threadId))
      .groupBy(emails.id)
      .orderBy(asc(sql`COALESCE(${emails.sentAt}, ${emails.receivedAt})`));

    if (rows.length === 0) return [];

    const orderedEmailIds = rows.map((r) => r.email.id);
    const participantsMap =
      await this.getParticipantsForEmailIds(orderedEmailIds);

    return rows.map((row) => {
      const attachments = this.parseAttachmentsJson(row.attachments);
      const participants = participantsMap.get(row.email.id) ?? [];
      return {
        email: this.toDomainEntity(row.email, participants),
        attachments,
      };
    });
  }

  private parseAttachmentsJson(
    attachmentsValue: string | unknown,
  ): EmailAttachmentRecord[] {
    const parsed: unknown =
      typeof attachmentsValue === 'string'
        ? JSON.parse(attachmentsValue)
        : attachmentsValue;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => {
      const o = item as Record<string, unknown>;
      return {
        id: o.id as string,
        emailId: o.emailId as string,
        filename: o.filename as string,
        mimeType: o.mimeType as string,
        size: o.size as number,
        fileUrl: o.fileUrl as string,
        isInline: o.isInline as boolean,
        createdAt: new Date((o.createdAt as string) ?? 0),
      };
    });
  }

  private attachmentRowToRecord(
    row: typeof emailAttachments.$inferSelect,
  ): EmailAttachmentRecord {
    return {
      id: row.id,
      emailId: row.emailId,
      filename: row.filename,
      mimeType: row.mimeType,
      size: row.size,
      fileUrl: row.fileUrl,
      isInline: row.isInline,
      createdAt: row.createdAt,
    };
  }

  /**
   * Get thread summaries with pagination (for thread list view)
   * When options.query is set, only returns threads that have at least one email matching subject/body.
   */
  async getThreads(
    options: ThreadSearchOptions,
  ): Promise<PaginatedResult<ThreadSummary>> {
    const { page, limit, mailboxId, query } = options;
    const offset = (page - 1) * limit;

    const searchPattern = query?.trim() ? `%${query.trim()}%` : null;
    const hasSearch = searchPattern != null;

    // Build where: mailboxId (optional) and, when searching, subject/body match and threadId not null
    let whereCondition:
      | ReturnType<typeof and>
      | ReturnType<typeof eq>
      | undefined;
    if (mailboxId && hasSearch) {
      whereCondition = and(
        eq(emails.mailboxId, mailboxId),
        or(
          ilike(emails.subject, searchPattern),
          ilike(emails.bodyText, searchPattern),
          ilike(emails.bodyHtml, searchPattern),
        ),
        sql`${emails.threadId} IS NOT NULL`,
      );
    } else if (mailboxId) {
      whereCondition = eq(emails.mailboxId, mailboxId);
    } else if (hasSearch) {
      whereCondition = and(
        or(
          ilike(emails.subject, searchPattern),
          ilike(emails.bodyText, searchPattern),
          ilike(emails.bodyHtml, searchPattern),
        ),
        sql`${emails.threadId} IS NOT NULL`,
      );
    } else {
      whereCondition = undefined;
    }

    // Get thread summaries with aggregation
    const threadsQuery = this.db
      .select({
        threadId: emails.threadId,
        messageCount: count(emails.id),
        latestDate: sql<Date>`MAX(${emails.receivedAt})`.as('latest_date'),
      })
      .from(emails)
      .where(whereCondition)
      .groupBy(emails.threadId)
      .orderBy(desc(sql`MAX(${emails.receivedAt})`))
      .limit(limit)
      .offset(offset);

    const threads = await threadsQuery;

    // Get total count of unique threads (same filter)
    const totalQuery = this.db
      .select({
        count: sql<number>`COUNT(DISTINCT ${emails.threadId})`.as(
          'thread_count',
        ),
      })
      .from(emails)
      .where(whereCondition);

    const totalResult = await totalQuery;
    const total = Number(totalResult[0]?.count) || 0;

    // For each thread, get the latest email details and participants
    const threadSummaries = await Promise.all(
      threads.map(async (thread): Promise<ThreadSummary | null> => {
        if (!thread.threadId) {
          // Handle emails without threadId (shouldn't happen, but be safe)
          return null;
        }

        // Get the latest email in this thread
        const latestEmail = await this.db
          .select()
          .from(emails)
          .where(eq(emails.threadId, thread.threadId))
          .orderBy(desc(emails.receivedAt))
          .limit(1);

        if (latestEmail.length === 0) {
          return null;
        }

        const latest = latestEmail[0];

        // Get all unique participants in the thread
        const participantsResult = await this.db
          .selectDistinct({ emailAddress: emailParticipants.emailAddress })
          .from(emailParticipants)
          .innerJoin(emails, eq(emailParticipants.emailId, emails.id))
          .where(eq(emails.threadId, thread.threadId));

        const participants = participantsResult.map((p) => p.emailAddress);

        // Create snippet from body
        const snippet = latest.bodyText
          ? latest.bodyText.substring(0, 150).trim()
          : null;

        return {
          threadId: thread.threadId,
          subject: latest.subject,
          messageCount: Number(thread.messageCount),
          participants,
          latestMessageId: latest.id,
          latestDate: thread.latestDate,
          snippet,
        };
      }),
    );

    // Filter out nulls
    const validSummaries = threadSummaries.filter(
      (s): s is ThreadSummary => s !== null,
    );

    return {
      data: validSummaries,
      total,
      page,
      limit,
    };
  }

  /**
   * Update thread ID for an email (used when merging threads)
   */
  async updateThreadId(emailId: string, threadId: string): Promise<void> {
    await this.db
      .update(emails)
      .set({ threadId })
      .where(eq(emails.id, emailId));
  }

  /**
   * Convert database model to domain entity
   */
  private toDomainEntity(
    model: typeof emails.$inferSelect,
    participants: EmailParticipant[],
  ): Email {
    return new Email(
      model.id,
      model.mailboxId,
      model.messageId,
      model.threadId,
      model.inReplyTo,
      model.references,
      model.subject,
      model.bodyText,
      model.bodyHtml,
      model.rawSource,
      model.direction,
      model.sentAt,
      model.receivedAt,
      model.createdAt,
      participants,
    );
  }
}
