import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO for adding a new mailbox
 */
export class AddMailboxDto {
  @IsEmail({}, { message: 'Address must be a valid email address' })
  @IsNotEmpty({ message: 'Address is required' })
  @MaxLength(255, { message: 'Address must not exceed 255 characters' })
  address: string;

  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name: string;
}
