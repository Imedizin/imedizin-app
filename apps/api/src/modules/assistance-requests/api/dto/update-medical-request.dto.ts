import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateMedicalRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  requestNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  priority?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  providerReferenceNumber?: string;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @IsOptional()
  @IsUUID()
  caseProviderId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  patientFullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  patientBirthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  patientNationalityCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  caseProviderReferenceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  admissionDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  dischargeDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsUUID()
  medicalProviderId?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;
}
