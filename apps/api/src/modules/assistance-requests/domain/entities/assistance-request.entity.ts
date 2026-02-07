export type ServiceType = 'TRANSPORT' | 'MEDICAL';
export type ModeOfTransport = 'lemozen' | 'als' | 'bls';

/** Transport-specific data (child) */
export interface TransportDetails {
  pickupPoint: string;
  dropoffPoint: string;
  requestedTransportAt: Date | null;
  modeOfTransport: ModeOfTransport | null;
  medicalCrewRequired: boolean;
  hasCompanion: boolean;
  estimatedPickupTime: Date | null;
  estimatedDropoffTime: Date | null;
  diagnosis: string | null;
}

/** Medical-case-specific data (child) */
export interface MedicalDetails {
  caseProviderReferenceNumber: string | null;
  admissionDate: string | null;
  dischargeDate: string | null;
  country: string | null;
  city: string | null;
  medicalProviderId: string | null;
  diagnosis: string | null;
}

/**
 * Assistance request (parent + one child).
 * Either transportDetails or medicalDetails is set depending on serviceType.
 * threadIds: mail thread IDs linked to this request (opaque strings; mailbox module owns threads).
 */
export class AssistanceRequest {
  constructor(
    public id: string,
    public requestNumber: string,
    public serviceType: ServiceType,
    public status: string,
    public priority: string | null,
    public providerReferenceNumber: string | null,
    public receivedAt: Date,
    public caseProviderId: string | null,
    public patientFullName: string,
    public patientBirthDate: string | null,
    public patientNationalityCode: string | null,
    public createdAt: Date,
    public updatedAt: Date,
    public transportDetails: TransportDetails | null,
    public medicalDetails: MedicalDetails | null,
    public threadIds: string[] = [],
  ) {}
}
