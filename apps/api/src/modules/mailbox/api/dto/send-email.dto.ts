import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';

/**
 * Email recipient DTO
 */
export class EmailRecipientDto {
  @IsEmail()
  @IsNotEmpty()
  emailAddress: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

/**
 * Send email request DTO
 */
export class SendEmailRequestDto {
  @IsNotEmpty()
  @IsString()
  mailboxId: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsArray()
  to: EmailRecipientDto[];

  @IsOptional()
  @IsArray()
  cc?: EmailRecipientDto[];

  @IsOptional()
  @IsArray()
  bcc?: EmailRecipientDto[];

  @IsOptional()
  @IsString()
  bodyText?: string;

  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @IsOptional()
  @IsString()
  inReplyTo?: string; // Message-ID of the email being replied to

  @IsOptional()
  @IsString()
  references?: string; // Space-separated Message-IDs for threading
}

/**
 * Send email response DTO
 */
export class SendEmailResponseDto {
  id: string;
  mailboxId: string;
  messageId: string;
  threadId: string | null;
  subject: string;
  sentAt: Date;
  direction: 'outgoing';
}
