import {
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { OPERATING_REGIONS } from '../../constants/operating-regions';

export class UpdateCaseProviderDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @IsString()
  providerType?: string;

  /** Only these values are stored; use for filtering (e.g. WHERE region = ANY(operating_regions)). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(OPERATING_REGIONS as unknown as string[], { each: true })
  operatingRegions?: string[];

  @IsOptional()
  @IsEmail()
  primaryEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  primaryPhone?: string;

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

