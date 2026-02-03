/**
 * Email participant response DTO
 */
export class EmailParticipantResponseDto {
  emailAddress: string;
  displayName: string | null;
  type: 'from' | 'to' | 'cc' | 'bcc' | 'reply_to';
}

/**
 * Email response DTO for list view (minimal data)
 */
export class EmailListItemDto {
  id: string;
  mailboxId: string;
  threadId: string | null;
  subject: string;
  from: EmailParticipantResponseDto | null;
  receivedAt: Date | null;
  sentAt: Date | null;
  direction: 'incoming' | 'outgoing';
  hasBody: boolean;
}

/**
 * Email attachment DTO for detail view
 */
export class EmailAttachmentDto {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  fileUrl: string;
  isInline: boolean;
}

/**
 * Email response DTO for detail view (full data)
 */
export class EmailDetailDto {
  id: string;
  mailboxId: string;
  messageId: string;
  threadId: string | null;
  inReplyTo: string | null;
  references: string | null;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  direction: 'incoming' | 'outgoing';
  sentAt: Date | null;
  receivedAt: Date | null;
  createdAt: Date;
  participants: EmailParticipantResponseDto[];
  attachments: EmailAttachmentDto[];
}

/**
 * Paginated email list response
 */
export class EmailListResponseDto {
  data: EmailListItemDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Thread summary DTO for thread list view
 */
export class ThreadSummaryDto {
  threadId: string;
  subject: string;
  messageCount: number;
  participants: string[]; // Unique email addresses in thread
  latestMessageId: string;
  latestDate: Date | null;
  snippet: string | null; // Preview text from latest message
}

/**
 * Paginated thread list response
 */
export class ThreadListResponseDto {
  data: ThreadSummaryDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Thread detail response - contains all emails in a thread
 */
export class ThreadDetailDto {
  threadId: string;
  subject: string;
  messageCount: number;
  messages: EmailDetailDto[]; // All emails in the thread, oldest first
}

/**
 * Sync result response DTO
 */
export class SyncResultDto {
  mailboxId: string;
  mailboxAddress: string;
  messagesProcessed: number;
  messagesCreated: number;
  messagesSkipped: number;
  syncedAt: Date;
}
