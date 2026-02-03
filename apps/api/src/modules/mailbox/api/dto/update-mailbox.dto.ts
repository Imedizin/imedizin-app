import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for updating a mailbox
 */
export class UpdateMailboxDto {
  @IsEmail({}, { message: 'Address must be a valid email address' })
  @IsOptional()
  @MaxLength(255, { message: 'Address must not exceed 255 characters' })
  address?: string;

  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name?: string;
}
