import { IsNotEmpty, IsUUID } from "class-validator";

export class ExtractFromEmailRequestDto {
  @IsUUID()
  @IsNotEmpty()
  emailId: string;
}

/**
 * Extracted data from email for pre-filling the new assistance request form.
 * Matches shared form shape + optional requestType inferred from content.
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
}
