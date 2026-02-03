import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating a new transportation request
 */
export class CreateTransportationRequestDto {
  @IsString({ message: 'Pickup address must be a string' })
  @IsNotEmpty({ message: 'Pickup address is required' })
  @MaxLength(500, { message: 'Pickup address must not exceed 500 characters' })
  pickupAddress: string;

  @IsString({ message: 'Dropoff address must be a string' })
  @IsNotEmpty({ message: 'Dropoff address is required' })
  @MaxLength(500, {
    message: 'Dropoff address must not exceed 500 characters',
  })
  dropoffAddress: string;

  @IsOptional()
  @IsArray({ message: 'Thread IDs must be an array' })
  @IsString({ each: true, message: 'Each thread ID must be a string' })
  threadIds?: string[];
}
