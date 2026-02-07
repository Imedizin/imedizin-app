import type {
  AssistanceRequest,
  MedicalDetails,
  TransportDetails,
} from '../entities/assistance-request.entity';

export interface FindAllAssistanceRequestsFilters {
  serviceType?: 'TRANSPORT' | 'MEDICAL';
  status?: string;
}

export interface CreateTransportPayload {
  requestNumber: string;
  status: string;
  priority?: string | null;
  providerReferenceNumber?: string | null;
  receivedAt: Date;
  caseProviderId?: string | null;
  patientFullName: string;
  patientBirthDate?: string | null;
  patientNationalityCode?: string | null;
  pickupPoint: string;
  dropoffPoint: string;
  requestedTransportAt?: Date | null;
  modeOfTransport?: 'lemozen' | 'als' | 'bls' | null;
  medicalCrewRequired?: boolean;
  hasCompanion?: boolean;
  estimatedPickupTime?: Date | null;
  estimatedDropoffTime?: Date | null;
  diagnosis?: string | null;
}

export interface CreateMedicalPayload {
  requestNumber: string;
  status: string;
  priority?: string | null;
  providerReferenceNumber?: string | null;
  receivedAt: Date;
  caseProviderId?: string | null;
  patientFullName: string;
  patientBirthDate?: string | null;
  patientNationalityCode?: string | null;
  caseProviderReferenceNumber?: string | null;
  admissionDate?: string | null;
  dischargeDate?: string | null;
  country?: string | null;
  city?: string | null;
  medicalProviderId?: string | null;
  diagnosis?: string | null;
}

export interface IAssistanceRequestRepository {
  findAll(filters?: FindAllAssistanceRequestsFilters): Promise<AssistanceRequest[]>;
  findById(id: string): Promise<AssistanceRequest | null>;
  createTransport(data: CreateTransportPayload): Promise<AssistanceRequest>;
  createMedical(data: CreateMedicalPayload): Promise<AssistanceRequest>;
  getThreadIdsForRequest(requestId: string): Promise<string[]>;
  addThread(requestId: string, threadId: string): Promise<void>;
  removeThread(requestId: string, threadId: string): Promise<void>;
}
