import { IsNotEmpty, IsString, MaxLength, Matches } from "class-validator";

/**
 * DTO for creating a new domain
 */
export class CreateDomainDto {
  @IsString({ message: "Domain must be a string" })
  @IsNotEmpty({ message: "Domain is required" })
  @MaxLength(255, { message: "Domain must not exceed 255 characters" })
  @Matches(/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/, {
    message: "Domain must be a valid domain name (e.g., example.com)",
  })
  domain: string;

  @IsString({ message: "Name must be a string" })
  @IsNotEmpty({ message: "Name is required" })
  @MaxLength(255, { message: "Name must not exceed 255 characters" })
  name: string;
}
