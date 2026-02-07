/**
 * Unified Assistance Request types.
 * Design: shared base fields + type-specific fields for medical case vs transport.
 */

export type AssistanceRequestType = "transport" | "medical_case";

// ---------------------------------------------------------------------------
// SHARED FIELDS (base for all assistance requests)
// ---------------------------------------------------------------------------

/** Patient info shared by both medical case and transport requests */
export interface AssistanceRequestPatient {
  patientName: string;
  patientBirthdate: string; // ISO date
  patientNationality: string;
}

/** Linked thread display (subject/latestDate from mailbox when available) */
export interface LinkedThreadItem {
  threadId: string;
  subject: string | null;
  latestDate: string | null;
}

/** Base fields shared by ALL assistance requests (medical + transport) */
export interface AssistanceRequestBase {
  id: string;
  requestNumber: string;
  type: AssistanceRequestType;
  status: string;
  threadIds: string[];
  linkedThreads: LinkedThreadItem[];
  createdAt: string;
  updatedAt: string;

  // Shared: timing
  receivedAt: string; // ISO datetime – when request was received

  // Shared: case provider (insurer / TPA)
  caseProviderId: string | null;

  // Shared: insurance reference (for matching with insurer)
  insuranceCompanyReferenceNumber: string | null;

  // Shared: patient (both types need patient identity)
  patient: AssistanceRequestPatient;

  // Shared: clinical (both can have diagnosis context)
  diagnosis: string | null;

  // Shared: free-text notes
  notes: string | null;
}

// ---------------------------------------------------------------------------
// MEDICAL CASE – specific fields only
// ---------------------------------------------------------------------------

export type MedicalCaseStatus =
  | "canceled"
  | "closed"
  | "done"
  | "gop_sent"
  | "no_gop"
  | "investigation"
  | "hold";

export interface MedicalCaseAssistanceRequest extends AssistanceRequestBase {
  type: "medical_case";
  status: MedicalCaseStatus;

  // References (medical case)
  caseProviderReferenceNumber: string | null;

  // Dates (medical case)
  admissionDate: string | null; // ISO date
  dischargeDate: string | null; // ISO date

  // Location (treatment)
  country: string | null;
  city: string | null;

  // Treating facility / provider
  medicalProviderId: string | null; // or name if no entity
  medicalProviderName: string | null;

  // Insurance (medical case – payer label)
  motherInsuranceCompany: string | null; // or insurerName
}

// ---------------------------------------------------------------------------
// TRANSPORT – specific fields only
// ---------------------------------------------------------------------------

export type TransportStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ModeOfTransportation = "lemozen" | "als" | "bls" | string;

export interface TransportAssistanceRequest extends AssistanceRequestBase {
  type: "transport";
  status: TransportStatus;

  // Pickup / drop-off
  pickupPoint: string;
  dropOffPoint: string;

  // Request timing
  dateOfRequestedTransportation: string | null; // ISO date
  estimatedPickupTime: string | null; // ISO datetime
  estimatedDropOffTime: string | null; // ISO datetime

  // Mode and crew
  modeOfTransportation: ModeOfTransportation | null; // lemozen, als, bls
  withEscortingMedicalCrew: boolean;
  hasCompanion: boolean;
}

// ---------------------------------------------------------------------------
// Union and guards
// ---------------------------------------------------------------------------

export type AssistanceRequest =
  | MedicalCaseAssistanceRequest
  | TransportAssistanceRequest;

export function isMedicalCaseRequest(
  r: AssistanceRequest
): r is MedicalCaseAssistanceRequest {
  return r.type === "medical_case";
}

export function isTransportRequest(
  r: AssistanceRequest
): r is TransportAssistanceRequest {
  return r.type === "transport";
}
