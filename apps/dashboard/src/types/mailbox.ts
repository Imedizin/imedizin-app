/**
 * Mailbox entity types
 */

/**
 * Mailbox entity - represents an email inbox like support@ourdomain.com
 */
export interface Mailbox {
  id: string;
  address: string;
  name: string;
  createdAt: string;
}

/**
 * DTO for adding a new mailbox
 */
export interface AddMailboxDto {
  address: string;
  name: string;
}

/**
 * DTO for updating a mailbox
 */
export interface UpdateMailboxDto {
  address?: string;
  name?: string;
}

/**
 * Form data for mailbox forms
 */
export interface MailboxFormData {
  address: string;
  name: string;
}
