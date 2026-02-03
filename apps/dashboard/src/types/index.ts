/**
 * Type definitions index
 *
 * Re-exports all types for convenient importing:
 * ```typescript
 * import type { Domain, Mailbox, EmailListItem } from "@/types";
 * ```
 */

// API response types
export type { ApiResponse, ListResponse, PaginatedResponse } from "./api";

// Domain types
export type {
  Domain,
  CreateDomainDto,
  UpdateDomainDto,
  DomainFormData,
} from "./domain";

// Mailbox types
export type {
  Mailbox,
  AddMailboxDto,
  UpdateMailboxDto,
  MailboxFormData,
} from "./mailbox";

// Email types
export type {
  EmailParticipant,
  EmailListItem,
  EmailDetail,
  EmailListResponse,
  SyncResult,
} from "./email";
