import {
  IsString,
  IsEmail,
  IsOptional,
  IsIn,
  ValidateIf,
} from 'class-validator';

/**
 * DTO for creating a subscription
 */
export class CreateSubscriptionDto {
  @IsEmail()
  mailboxId: string; // Email address of the mailbox

  @IsString()
  @IsOptional()
  @IsIn(['inbox', 'spam', 'custom'])
  folder?: string; // 'inbox', 'spam', or 'custom'

  @IsString()
  @ValidateIf((o) => o.folder === 'custom')
  resource?: string; // Custom resource path (required if folder is 'custom')
}
