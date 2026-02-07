import type { AssistanceRequest } from "../../domain/entities/assistance-request.entity";

export interface LinkedThreadDto {
  threadId: string;
  subject: string | null;
  latestDate: string | null;
}

/** Unified response: parent + transport or medical details */
export class AssistanceRequestResponseDto {
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
  linkedThreads: LinkedThreadDto[];

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

  constructor(
    req: AssistanceRequest,
    linkedThreadsInput?: Array<{
      threadId: string;
      subject: string;
      latestDate: Date | null;
    }>,
  ) {
    this.id = req.id;
    this.requestNumber = req.requestNumber;
    this.serviceType = req.serviceType;
    this.status = req.status;
    this.priority = req.priority;
    this.providerReferenceNumber = req.providerReferenceNumber;
    this.receivedAt = req.receivedAt.toISOString();
    this.caseProviderId = req.caseProviderId;
    this.patientFullName = req.patientFullName;
    this.patientBirthDate = req.patientBirthDate;
    this.patientNationalityCode = req.patientNationalityCode;
    this.createdAt = req.createdAt.toISOString();
    this.updatedAt = req.updatedAt.toISOString();
    this.linkedThreads = this.buildLinkedThreads(
      req.threadIds ?? [],
      linkedThreadsInput,
    );

    if (req.transportDetails) {
      this.transport = {
        pickupPoint: req.transportDetails.pickupPoint,
        dropoffPoint: req.transportDetails.dropoffPoint,
        requestedTransportAt: req.transportDetails.requestedTransportAt
          ? req.transportDetails.requestedTransportAt.toISOString()
          : null,
        modeOfTransport: req.transportDetails.modeOfTransport,
        medicalCrewRequired: req.transportDetails.medicalCrewRequired,
        hasCompanion: req.transportDetails.hasCompanion,
        estimatedPickupTime: req.transportDetails.estimatedPickupTime
          ? req.transportDetails.estimatedPickupTime.toISOString()
          : null,
        estimatedDropoffTime: req.transportDetails.estimatedDropoffTime
          ? req.transportDetails.estimatedDropoffTime.toISOString()
          : null,
        diagnosis: req.transportDetails.diagnosis,
      };
    }

    if (req.medicalDetails) {
      this.medical = {
        caseProviderReferenceNumber:
          req.medicalDetails.caseProviderReferenceNumber,
        admissionDate: req.medicalDetails.admissionDate,
        dischargeDate: req.medicalDetails.dischargeDate,
        country: req.medicalDetails.country,
        city: req.medicalDetails.city,
        medicalProviderId: req.medicalDetails.medicalProviderId,
        diagnosis: req.medicalDetails.diagnosis,
      };
    }
  }

  private buildLinkedThreads(
    threadIds: string[],
    summaries?: Array<{
      threadId: string;
      subject: string;
      latestDate: Date | null;
    }>,
  ): LinkedThreadDto[] {
    const map = new Map(
      (summaries ?? []).map((s) => [
        s.threadId,
        {
          subject: s.subject,
          latestDate: s.latestDate ? s.latestDate.toISOString() : null,
        },
      ]),
    );
    return threadIds.map((threadId) => {
      const s = map.get(threadId);
      return {
        threadId,
        subject: s?.subject ?? null,
        latestDate: s?.latestDate ?? null,
      };
    });
  }
}
