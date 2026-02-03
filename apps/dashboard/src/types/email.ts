/**
 * Email entity types
 */

/**
 * Email participant - represents a sender or recipient
 */
export interface EmailParticipant {
  emailAddress: string;
  displayName: string | null;
  type: "from" | "to" | "cc" | "bcc" | "reply_to";
}

/**
 * Email list item - minimal data for list views
 */
export interface EmailListItem {
  id: string;
  mailboxId: string;
  threadId: string | null;
  subject: string;
  from: EmailParticipant | null;
  receivedAt: string | null;
  sentAt: string | null;
  direction: "incoming" | "outgoing";
  hasBody: boolean;
}

/**
 * Email attachment - metadata and download URL
 */
export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  fileUrl: string;
  isInline: boolean;
}

/**
 * Email detail - full email data including body, participants, and attachments
 */
export interface EmailDetail {
  id: string;
  mailboxId: string;
  messageId: string;
  threadId: string | null;
  inReplyTo: string | null;
  references: string | null;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  direction: "incoming" | "outgoing";
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  participants: EmailParticipant[];
  attachments?: EmailAttachment[];
}

/**
 * Email list response with pagination
 */
export interface EmailListResponse {
  data: EmailListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Thread summary - for thread list view
 */
export interface ThreadSummary {
  threadId: string;
  subject: string;
  messageCount: number;
  participants: string[]; // Unique email addresses
  latestMessageId: string;
  latestDate: string | null;
  snippet: string | null; // Preview text
}

/**
 * Thread list response with pagination
 */
export interface ThreadListResponse {
  data: ThreadSummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Thread detail - all emails in a thread
 */
export interface ThreadDetail {
  threadId: string;
  subject: string;
  messageCount: number;
  messages: EmailDetail[]; // Oldest first
}

/**
 * Sync operation result
 */
export interface SyncResult {
  mailboxId: string;
  mailboxAddress: string;
  messagesProcessed: number;
  messagesCreated: number;
  messagesSkipped: number;
  syncedAt: string;
}
