import { Email, EmailParticipant } from '../entities/email.entity';
import type { EmailAttachmentRecord } from './email-attachment.repository.interface';

/**
 * Data required to create a new email
 */
export interface CreateEmailData {
  mailboxId: string;
  messageId: string;
  threadId: string | null;
  inReplyTo: string | null; // RFC In-Reply-To header - parent Message-ID
  references: string | null; // RFC References header - ancestor Message-IDs
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  rawSource: string;
  direction: 'incoming' | 'outgoing';
  sentAt: Date | null;
  receivedAt: Date | null;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Email search options
 */
export interface EmailSearchOptions extends PaginationOptions {
  query: string;
  mailboxId?: string;
}

/**
 * Thread summary for list view
 */
export interface ThreadSummary {
  threadId: string;
  subject: string;
  messageCount: number;
  participants: string[]; // Unique email addresses in thread
  latestMessageId: string;
  latestDate: Date | null;
  snippet: string | null; // Preview text from latest message
}

/**
 * Minimal thread info for external modules (e.g. assistance-requests linked threads)
 */
export interface ThreadSummaryByIdsItem {
  threadId: string;
  subject: string;
  latestDate: Date | null;
}

/**
 * Thread search options
 */
export interface ThreadSearchOptions extends PaginationOptions {
  mailboxId?: string;
  /** Optional search query; matches threads that have at least one email matching subject/body */
  query?: string;
}

/**
 * Email repository interface
 * Defined in domain layer to maintain dependency inversion
 */
export interface IEmailRepository {
  /**
   * Find email by ID
   */
  findById(id: string): Promise<Email | null>;

  /**
   * Find email by RFC Message-ID header
   */
  findByMessageId(messageId: string): Promise<Email | null>;

  /**
   * Find all emails for a mailbox with pagination
   */
  findByMailboxId(
    mailboxId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Email>>;

  /**
   * Find all emails with pagination
   */
  findAll(options?: PaginationOptions): Promise<PaginatedResult<Email>>;

  /**
   * Search emails by subject or body
   */
  search(options: EmailSearchOptions): Promise<PaginatedResult<Email>>;

  /**
   * Create a new email with participants
   */
  create(
    email: CreateEmailData,
    participants: EmailParticipant[],
  ): Promise<Email>;

  /**
   * Check if email exists by message ID
   */
  existsByMessageId(messageId: string): Promise<boolean>;

  /**
   * Count emails for a mailbox
   */
  countByMailboxId(mailboxId: string): Promise<number>;

  /**
   * Find all emails in a thread (with attachments; GROUP BY + json_agg)
   */
  findByThreadId(
    threadId: string,
  ): Promise<Array<{ email: Email; attachments: EmailAttachmentRecord[] }>>;

  /**
   * Get thread summaries with pagination (for thread list view)
   */
  getThreads(
    options: ThreadSearchOptions,
  ): Promise<PaginatedResult<ThreadSummary>>;

  /**
   * Get minimal thread summaries for a list of thread IDs (for enrichment in other modules)
   */
  getThreadSummariesByThreadIds(
    threadIds: string[],
  ): Promise<ThreadSummaryByIdsItem[]>;

  /**
   * Update thread ID for an email (used when merging threads)
   */
  updateThreadId(emailId: string, threadId: string): Promise<void>;
}
