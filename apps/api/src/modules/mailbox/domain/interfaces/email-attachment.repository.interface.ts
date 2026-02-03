/**
 * Data required to create an email attachment record
 */
export interface CreateAttachmentData {
  emailId: string;
  filename: string;
  mimeType: string;
  size: number;
  fileUrl: string; // Direct public URL (bucket-style)
  isInline: boolean;
}

/**
 * Email attachment domain record (after create)
 */
export interface EmailAttachmentRecord {
  id: string;
  emailId: string;
  filename: string;
  mimeType: string;
  size: number;
  fileUrl: string;
  isInline: boolean;
  createdAt: Date;
}

/**
 * Email attachment repository interface
 */
export interface IEmailAttachmentRepository {
  create(data: CreateAttachmentData): Promise<EmailAttachmentRecord>;
  findById(id: string): Promise<EmailAttachmentRecord | null>;
  findByEmailId(emailId: string): Promise<EmailAttachmentRecord[]>;
}
