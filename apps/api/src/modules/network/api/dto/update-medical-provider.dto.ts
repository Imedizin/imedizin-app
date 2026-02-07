import {
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { ALL_MEDICAL_SPECIALTIES } from "../../constants/medical-specialties";

export class UpdateMedicalProviderDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;

  @IsOptional()
  @IsString()
  providerType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

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

  /** Only these values are stored; use for filtering (e.g. WHERE specialty = ANY(specialties)). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(ALL_MEDICAL_SPECIALTIES as unknown as string[], { each: true })
  specialties?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @IsOptional()
  @IsString()
  businessHours?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  onboardedAt?: string;
}
