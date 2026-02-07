import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, inArray, sql } from "drizzle-orm";
import { DRIZZLE } from "../../../../shared/common/database/database.module";
import type { Database } from "../../../../shared/common/database/database.module";
import {
  assistanceRequestThreads,
  assistanceRequests,
  medicalRequests,
  transportRequests,
} from "../schema";
import {
  AssistanceRequest,
  type MedicalDetails,
  type TransportDetails,
} from "../../domain/entities/assistance-request.entity";
import type {
  IAssistanceRequestRepository,
  CreateMedicalPayload,
  CreateTransportPayload,
  FindAllAssistanceRequestsFilters,
  UpdateMedicalPayload,
  UpdateTransportPayload,
} from "../../domain/interfaces/assistance-request.repository.interface";

type AssistanceRequestRow = typeof assistanceRequests.$inferSelect;
type TransportRow = typeof transportRequests.$inferSelect;
type MedicalRow = typeof medicalRequests.$inferSelect;

@Injectable()
export class AssistanceRequestRepository implements IAssistanceRequestRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database
  ) {}

  async findAll(
    filters?: FindAllAssistanceRequestsFilters
  ): Promise<AssistanceRequest[]> {
    const conditions: ReturnType<typeof sql>[] = [];
    if (filters?.serviceType) {
      conditions.push(eq(assistanceRequests.serviceType, filters.serviceType));
    }
    if (filters?.status?.trim()) {
      conditions.push(eq(assistanceRequests.status, filters.status.trim()));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(assistanceRequests)
      .where(whereClause)
      .orderBy(assistanceRequests.createdAt);

    const requestIds = rows.map((r) => r.id);
    const threadLinks =
      requestIds.length > 0
        ? await this.db
            .select()
            .from(assistanceRequestThreads)
            .where(
              inArray(assistanceRequestThreads.assistanceRequestId, requestIds)
            )
        : [];
    const threadIdsByRequestId = new Map<string, string[]>();
    for (const link of threadLinks) {
      const arr = threadIdsByRequestId.get(link.assistanceRequestId) ?? [];
      arr.push(link.threadId);
      threadIdsByRequestId.set(link.assistanceRequestId, arr);
    }

    const result: AssistanceRequest[] = [];
    for (const row of rows) {
      const transport =
        row.serviceType === "TRANSPORT"
          ? await this.db
              .select()
              .from(transportRequests)
              .where(eq(transportRequests.requestId, row.id))
              .limit(1)
          : [];
      const medical =
        row.serviceType === "MEDICAL"
          ? await this.db
              .select()
              .from(medicalRequests)
              .where(eq(medicalRequests.requestId, row.id))
              .limit(1)
          : [];
      const threadIds = threadIdsByRequestId.get(row.id) ?? [];
      result.push(
        this.toDomain(row, transport[0] ?? null, medical[0] ?? null, threadIds)
      );
    }
    return result;
  }

  async findById(id: string): Promise<AssistanceRequest | null> {
    const rows = await this.db
      .select()
      .from(assistanceRequests)
      .where(eq(assistanceRequests.id, id))
      .limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    const transport = await this.db
      .select()
      .from(transportRequests)
      .where(eq(transportRequests.requestId, id))
      .limit(1);
    const medical = await this.db
      .select()
      .from(medicalRequests)
      .where(eq(medicalRequests.requestId, id))
      .limit(1);
    const threadIds = await this.getThreadIdsForRequest(id);
    return this.toDomain(
      row,
      transport[0] ?? null,
      medical[0] ?? null,
      threadIds
    );
  }

  async getThreadIdsForRequest(requestId: string): Promise<string[]> {
    const rows = await this.db
      .select({ threadId: assistanceRequestThreads.threadId })
      .from(assistanceRequestThreads)
      .where(eq(assistanceRequestThreads.assistanceRequestId, requestId));
    return rows.map((r) => r.threadId);
  }

  async addThread(requestId: string, threadId: string): Promise<void> {
    await this.db
      .insert(assistanceRequestThreads)
      .values({
        assistanceRequestId: requestId,
        threadId,
      })
      .onConflictDoNothing({
        target: [
          assistanceRequestThreads.assistanceRequestId,
          assistanceRequestThreads.threadId,
        ],
      });
  }

  async removeThread(requestId: string, threadId: string): Promise<void> {
    await this.db
      .delete(assistanceRequestThreads)
      .where(
        and(
          eq(assistanceRequestThreads.assistanceRequestId, requestId),
          eq(assistanceRequestThreads.threadId, threadId)
        )
      );
  }

  async createTransport(
    data: CreateTransportPayload
  ): Promise<AssistanceRequest> {
    const now = new Date();
    const [parent] = await this.db
      .insert(assistanceRequests)
      .values({
        requestNumber: data.requestNumber,
        serviceType: "TRANSPORT",
        status: data.status ?? "NEW",
        priority: data.priority ?? null,
        providerReferenceNumber: data.providerReferenceNumber ?? null,
        receivedAt: data.receivedAt,
        caseProviderId: data.caseProviderId ?? null,
        patientFullName: data.patientFullName,
        patientBirthDate: data.patientBirthDate ?? null,
        patientNationalityCode: data.patientNationalityCode ?? null,
        updatedAt: now,
      })
      .returning();

    await this.db.insert(transportRequests).values({
      requestId: parent.id,
      pickupPoint: data.pickupPoint,
      dropoffPoint: data.dropoffPoint,
      requestedTransportAt: data.requestedTransportAt ?? null,
      modeOfTransport: data.modeOfTransport ?? null,
      medicalCrewRequired: data.medicalCrewRequired ?? false,
      hasCompanion: data.hasCompanion ?? false,
      estimatedPickupTime: data.estimatedPickupTime ?? null,
      estimatedDropoffTime: data.estimatedDropoffTime ?? null,
      diagnosis: data.diagnosis ?? null,
    });

    const created = await this.findById(parent.id);
    if (!created) throw new Error("Failed to load created transport request");
    return created;
  }

  async createMedical(data: CreateMedicalPayload): Promise<AssistanceRequest> {
    const now = new Date();
    const [parent] = await this.db
      .insert(assistanceRequests)
      .values({
        requestNumber: data.requestNumber,
        serviceType: "MEDICAL",
        status: data.status ?? "NEW",
        priority: data.priority ?? null,
        providerReferenceNumber: data.providerReferenceNumber ?? null,
        receivedAt: data.receivedAt,
        caseProviderId: data.caseProviderId ?? null,
        patientFullName: data.patientFullName,
        patientBirthDate: data.patientBirthDate ?? null,
        patientNationalityCode: data.patientNationalityCode ?? null,
        updatedAt: now,
      })
      .returning();

    await this.db.insert(medicalRequests).values({
      requestId: parent.id,
      caseProviderReferenceNumber: data.caseProviderReferenceNumber ?? null,
      admissionDate: data.admissionDate ?? null,
      dischargeDate: data.dischargeDate ?? null,
      country: data.country ?? null,
      city: data.city ?? null,
      medicalProviderId: data.medicalProviderId ?? null,
      diagnosis: data.diagnosis ?? null,
    });

    const created = await this.findById(parent.id);
    if (!created) throw new Error("Failed to load created medical request");
    return created;
  }

  async updateTransport(
    id: string,
    data: UpdateTransportPayload
  ): Promise<AssistanceRequest> {
    const existing = await this.findById(id);
    if (!existing || existing.serviceType !== "TRANSPORT")
      throw new NotFoundException("Transport request not found");
    const now = new Date();
    const parentPayload: Record<string, unknown> = {
      updatedAt: now,
    };
    if (data.requestNumber !== undefined) parentPayload.requestNumber = data.requestNumber;
    if (data.status !== undefined) parentPayload.status = data.status;
    if (data.priority !== undefined) parentPayload.priority = data.priority;
    if (data.providerReferenceNumber !== undefined)
      parentPayload.providerReferenceNumber = data.providerReferenceNumber;
    if (data.receivedAt !== undefined) parentPayload.receivedAt = data.receivedAt;
    if (data.caseProviderId !== undefined) parentPayload.caseProviderId = data.caseProviderId;
    if (data.patientFullName !== undefined) parentPayload.patientFullName = data.patientFullName;
    if (data.patientBirthDate !== undefined) parentPayload.patientBirthDate = data.patientBirthDate;
    if (data.patientNationalityCode !== undefined)
      parentPayload.patientNationalityCode = data.patientNationalityCode;

    if (Object.keys(parentPayload).length > 1) {
      await this.db
        .update(assistanceRequests)
        .set(parentPayload as Record<string, unknown>)
        .where(eq(assistanceRequests.id, id));
    }

    const transportPayload: Record<string, unknown> = {};
    if (data.pickupPoint !== undefined) transportPayload.pickupPoint = data.pickupPoint;
    if (data.dropoffPoint !== undefined) transportPayload.dropoffPoint = data.dropoffPoint;
    if (data.requestedTransportAt !== undefined)
      transportPayload.requestedTransportAt = data.requestedTransportAt;
    if (data.modeOfTransport !== undefined) transportPayload.modeOfTransport = data.modeOfTransport;
    if (data.medicalCrewRequired !== undefined)
      transportPayload.medicalCrewRequired = data.medicalCrewRequired;
    if (data.hasCompanion !== undefined) transportPayload.hasCompanion = data.hasCompanion;
    if (data.estimatedPickupTime !== undefined)
      transportPayload.estimatedPickupTime = data.estimatedPickupTime;
    if (data.estimatedDropoffTime !== undefined)
      transportPayload.estimatedDropoffTime = data.estimatedDropoffTime;
    if (data.diagnosis !== undefined) transportPayload.diagnosis = data.diagnosis;

    if (Object.keys(transportPayload).length > 0) {
      await this.db
        .update(transportRequests)
        .set(transportPayload as Record<string, unknown>)
        .where(eq(transportRequests.requestId, id));
    }

    const updated = await this.findById(id);
    if (!updated) throw new Error("Failed to load updated transport request");
    return updated;
  }

  async updateMedical(
    id: string,
    data: UpdateMedicalPayload
  ): Promise<AssistanceRequest> {
    const existing = await this.findById(id);
    if (!existing || existing.serviceType !== "MEDICAL")
      throw new NotFoundException("Medical request not found");
    const now = new Date();
    const parentPayload: Record<string, unknown> = {
      updatedAt: now,
    };
    if (data.requestNumber !== undefined) parentPayload.requestNumber = data.requestNumber;
    if (data.status !== undefined) parentPayload.status = data.status;
    if (data.priority !== undefined) parentPayload.priority = data.priority;
    if (data.providerReferenceNumber !== undefined)
      parentPayload.providerReferenceNumber = data.providerReferenceNumber;
    if (data.receivedAt !== undefined) parentPayload.receivedAt = data.receivedAt;
    if (data.caseProviderId !== undefined) parentPayload.caseProviderId = data.caseProviderId;
    if (data.patientFullName !== undefined) parentPayload.patientFullName = data.patientFullName;
    if (data.patientBirthDate !== undefined) parentPayload.patientBirthDate = data.patientBirthDate;
    if (data.patientNationalityCode !== undefined)
      parentPayload.patientNationalityCode = data.patientNationalityCode;

    if (Object.keys(parentPayload).length > 1) {
      await this.db
        .update(assistanceRequests)
        .set(parentPayload as Record<string, unknown>)
        .where(eq(assistanceRequests.id, id));
    }

    const medicalPayload: Record<string, unknown> = {};
    if (data.caseProviderReferenceNumber !== undefined)
      medicalPayload.caseProviderReferenceNumber = data.caseProviderReferenceNumber;
    if (data.admissionDate !== undefined) medicalPayload.admissionDate = data.admissionDate;
    if (data.dischargeDate !== undefined) medicalPayload.dischargeDate = data.dischargeDate;
    if (data.country !== undefined) medicalPayload.country = data.country;
    if (data.city !== undefined) medicalPayload.city = data.city;
    if (data.medicalProviderId !== undefined)
      medicalPayload.medicalProviderId = data.medicalProviderId;
    if (data.diagnosis !== undefined) medicalPayload.diagnosis = data.diagnosis;

    if (Object.keys(medicalPayload).length > 0) {
      await this.db
        .update(medicalRequests)
        .set(medicalPayload as Record<string, unknown>)
        .where(eq(medicalRequests.requestId, id));
    }

    const updated = await this.findById(id);
    if (!updated) throw new Error("Failed to load updated medical request");
    return updated;
  }

  private toDomain(
    row: AssistanceRequestRow,
    transport: TransportRow | null,
    medical: MedicalRow | null,
    threadIds: string[] = []
  ): AssistanceRequest {
    const transportDetails: TransportDetails | null = transport
      ? {
          pickupPoint: transport.pickupPoint,
          dropoffPoint: transport.dropoffPoint,
          requestedTransportAt: transport.requestedTransportAt,
          modeOfTransport: transport.modeOfTransport,
          medicalCrewRequired: transport.medicalCrewRequired ?? false,
          hasCompanion: transport.hasCompanion ?? false,
          estimatedPickupTime: transport.estimatedPickupTime,
          estimatedDropoffTime: transport.estimatedDropoffTime,
          diagnosis: transport.diagnosis ?? null,
        }
      : null;

    const medicalDetails: MedicalDetails | null = medical
      ? {
          caseProviderReferenceNumber:
            medical.caseProviderReferenceNumber ?? null,
          admissionDate: medical.admissionDate ?? null,
          dischargeDate: medical.dischargeDate ?? null,
          country: medical.country ?? null,
          city: medical.city ?? null,
          medicalProviderId: medical.medicalProviderId ?? null,
          diagnosis: medical.diagnosis ?? null,
        }
      : null;

    return new AssistanceRequest(
      row.id,
      row.requestNumber,
      row.serviceType as "TRANSPORT" | "MEDICAL",
      row.status,
      row.priority ?? null,
      row.providerReferenceNumber ?? null,
      row.receivedAt,
      row.caseProviderId ?? null,
      row.patientFullName,
      row.patientBirthDate ?? null,
      row.patientNationalityCode ?? null,
      row.createdAt,
      row.updatedAt,
      transportDetails,
      medicalDetails,
      threadIds
    );
  }
}
