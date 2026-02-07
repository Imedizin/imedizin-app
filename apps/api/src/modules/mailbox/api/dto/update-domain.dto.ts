import { IsOptional, IsString, MaxLength, Matches } from "class-validator";

/**
 * DTO for updating a domain
 */
export class UpdateDomainDto {
  @IsOptional()
  @IsString({ message: "Domain must be a string" })
  @MaxLength(255, { message: "Domain must not exceed 255 characters" })
  @Matches(/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/, {
    message: "Domain must be a valid domain name (e.g., example.com)",
  })
  domain?: string;

  @IsOptional()
  @IsString({ message: "Name must be a string" })
  @MaxLength(255, { message: "Name must not exceed 255 characters" })
  name?: string;
}
