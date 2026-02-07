import { IsString, MinLength } from 'class-validator';

export class LinkThreadDto {
  @IsString()
  @MinLength(1, { message: 'threadId is required' })
  threadId: string;
}
