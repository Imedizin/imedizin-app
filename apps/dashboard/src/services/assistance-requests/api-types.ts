import type {
  AssistanceRequest,
  MedicalCaseStatus,
  TransportStatus,
} from "@/types/assistance-request";

/** Linked thread summary from API (subject may be null if thread not found in mailbox). */
export interface LinkedThreadApiItem {
  threadId: string;
  subject: string | null;
  latestDate: string | null;
}

/**
 * API response shape for assistance-requests module (mirrors backend DTOs).
 */
export interface AssistanceRequestApiResponse {
  id: string;
  requestNumber: string;
  serviceType: "TRANSPORT" | "MEDICAL";
  status: string;
  priority: string | null;
  providerReferenceNumber: string | null;
  receivedAt: string;
  caseProviderId: string | null;
  patientFullName: string;
  patientBirthDate: string | null;
  patientNationalityCode: string | null;
  createdAt: string;
  updatedAt: string;
  linkedThreads?: LinkedThreadApiItem[];

  transport?: {
    pickupPoint: string;
    dropoffPoint: string;
    requestedTransportAt: string | null;
    modeOfTransport: string | null;
    medicalCrewRequired: boolean;
    hasCompanion: boolean;
    estimatedPickupTime: string | null;
    estimatedDropoffTime: string | null;
    diagnosis: string | null;
  };

  medical?: {
    caseProviderReferenceNumber: string | null;
    admissionDate: string | null;
    dischargeDate: string | null;
    country: string | null;
    city: string | null;
    medicalProviderId: string | null;
    diagnosis: string | null;
  };
}

/**
 * Map a single API response to the frontend AssistanceRequest union type.
 */
export function mapApiToAssistanceRequest(
  api: AssistanceRequestApiResponse
): AssistanceRequest {
  const base = {
    id: api.id,
    requestNumber: api.requestNumber,
    receivedAt: api.receivedAt,
    status: api.status,
    threadIds: (api.linkedThreads ?? []).map((t) => t.threadId),
    linkedThreads: api.linkedThreads ?? [],
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    caseProviderId: api.caseProviderId,
    insuranceCompanyReferenceNumber: api.providerReferenceNumber,
    patient: {
      patientName: api.patientFullName,
      patientBirthdate: api.patientBirthDate ?? "",
      patientNationality: api.patientNationalityCode ?? "",
    },
    diagnosis: api.transport?.diagnosis ?? api.medical?.diagnosis ?? null,
    notes: null as string | null,
  };

  if (api.serviceType === "TRANSPORT" && api.transport) {
    return {
      ...base,
      type: "transport",
      status: api.status as TransportStatus,
      pickupPoint: api.transport.pickupPoint,
      dropOffPoint: api.transport.dropoffPoint,
      dateOfRequestedTransportation: api.transport.requestedTransportAt,
      estimatedPickupTime: api.transport.estimatedPickupTime,
      estimatedDropOffTime: api.transport.estimatedDropoffTime,
      modeOfTransportation: (api.transport.modeOfTransport as "lemozen" | "als" | "bls" | null) ?? null,
      withEscortingMedicalCrew: api.transport.medicalCrewRequired,
      hasCompanion: api.transport.hasCompanion,
    };
  }

  if (api.serviceType === "MEDICAL" && api.medical) {
    return {
      ...base,
      type: "medical_case",
      status: api.status as MedicalCaseStatus,
      caseProviderReferenceNumber: api.medical.caseProviderReferenceNumber,
      admissionDate: api.medical.admissionDate,
      dischargeDate: api.medical.dischargeDate,
      country: api.medical.country,
      city: api.medical.city,
      medicalProviderId: api.medical.medicalProviderId,
      medicalProviderName: null,
      motherInsuranceCompany: null,
    };
  }

  // Fallback for incomplete API response
  return {
    ...base,
    type: "transport",
    status: "pending",
    pickupPoint: "",
    dropOffPoint: "",
    dateOfRequestedTransportation: null,
    estimatedPickupTime: null,
    estimatedDropOffTime: null,
    modeOfTransportation: null,
    withEscortingMedicalCrew: false,
    hasCompanion: false,
  };
}
