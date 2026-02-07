import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { OPERATING_REGIONS } from "../../constants/operating-regions";

export class CreateCaseProviderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  companyName: string;

  @IsString()
  @IsNotEmpty()
  providerType: string;

  /** Only these values are stored; use for filtering (e.g. WHERE region = ANY(operating_regions)). */
  @IsArray()
  @IsString({ each: true })
  @IsIn(OPERATING_REGIONS as unknown as string[], { each: true })
  operatingRegions: string[];

  @IsEmail()
  @IsNotEmpty()
  primaryEmail: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  primaryPhone: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  contractStartDate?: string;

  @IsOptional()
  @IsString()
  contractEndDate?: string;

  @IsOptional()
  @IsString()
  pricingModel?: string;

  @IsOptional()
  @IsString()
  slaTier?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
