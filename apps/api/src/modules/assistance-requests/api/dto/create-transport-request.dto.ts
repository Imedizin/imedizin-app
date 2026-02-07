import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export enum ModeOfTransportDto {
  lemozen = "lemozen",
  als = "als",
  bls = "bls",
}

export class CreateTransportRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  requestNumber: string;

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

  @IsDateString()
  receivedAt: string;

  @IsOptional()
  @IsUUID()
  caseProviderId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  patientFullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  patientBirthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  patientNationalityCode?: string;

  @IsString()
  @MinLength(1)
  pickupPoint: string;

  @IsString()
  @MinLength(1)
  dropoffPoint: string;

  @IsOptional()
  @IsDateString()
  requestedTransportAt?: string;

  @IsOptional()
  @IsEnum(ModeOfTransportDto)
  modeOfTransport?: ModeOfTransportDto;

  @IsOptional()
  @IsBoolean()
  medicalCrewRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  hasCompanion?: boolean;

  @IsOptional()
  @IsDateString()
  estimatedPickupTime?: string;

  @IsOptional()
  @IsDateString()
  estimatedDropoffTime?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;
}
