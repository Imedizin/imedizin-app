import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for updating a transportation request
 */
export class UpdateTransportationRequestDto {
  @IsOptional()
  @IsString({ message: 'Pickup address must be a string' })
  @MaxLength(500, { message: 'Pickup address must not exceed 500 characters' })
  pickupAddress?: string;

  @IsOptional()
  @IsString({ message: 'Dropoff address must be a string' })
  @MaxLength(500, {
    message: 'Dropoff address must not exceed 500 characters',
  })
  dropoffAddress?: string;

  @IsOptional()
  @IsArray({ message: 'Thread IDs must be an array' })
  @IsString({ each: true, message: 'Each thread ID must be a string' })
  threadIds?: string[];

  @IsOptional()
  @IsString({ message: 'Status must be a string' })
  status?: string;
}
