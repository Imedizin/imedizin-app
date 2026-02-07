import { IsIn, IsNotEmpty, IsOptional, IsUUID } from "class-validator";

export class ExtractFromEmailRequestDto {
  @IsUUID()
  @IsNotEmpty()
  emailId: string;

  /** When set, extraction uses a type-specific prompt (transport or medical_case). */
  @IsOptional()
  @IsIn(["transport", "medical_case"])
  type?: "transport" | "medical_case";
}

/**
 * Extracted data from email for pre-filling the new assistance request form.
 * Matches shared form shape + optional requestType inferred from content.
 * Transport fields are used when requestType is "transport".
 */
export class ExtractFromEmailResponseDto {
  requestNumber?: string;
  receivedAt?: string;
  insuranceCompanyReferenceNumber?: string;
  patientName?: string;
  patientBirthdate?: string;
  patientNationality?: string;
  diagnosis?: string;
  notes?: string;
  /** Inferred from email content: "transport" or "medical_case" */
  requestType?: "transport" | "medical_case";

  /** Transportation details (for transport requests) */
  pickupPoint?: string;
  dropoffPoint?: string;
  dateOfRequestedTransportation?: string;
  estimatedPickupTime?: string;
  estimatedDropoffTime?: string;
  modeOfTransport?: "lemozen" | "als" | "bls";
  medicalCrewRequired?: boolean;
  hasCompanion?: boolean;

  /** Medical case details (for medical_case requests) */
  caseProviderReferenceNumber?: string;
  admissionDate?: string;
  dischargeDate?: string;
  country?: string;
  city?: string;
  medicalProviderName?: string;
  motherInsuranceCompany?: string;
}
