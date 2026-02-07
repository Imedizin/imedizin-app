import { Inject, Injectable } from "@nestjs/common";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { DRIZZLE } from "../../../../shared/common/database/database.module";
import type { Database } from "../../../../shared/common/database/database.module";
import { medicalProviders } from "../schema";
import {
  MedicalProvider,
  type MedicalProviderType,
  type ProviderStatus,
} from "../../domain/entities/medical-provider.entity";
import type {
  IMedicalProviderRepository,
  FindAllMedicalProvidersFilters,
} from "../../domain/interfaces/medical-provider.repository.interface";

@Injectable()
export class MedicalProviderRepository implements IMedicalProviderRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database,
  ) {}

  async findAll(
    filters?: FindAllMedicalProvidersFilters,
  ): Promise<MedicalProvider[]> {
    const conditions: ReturnType<typeof sql>[] = [];

    if (filters?.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(medicalProviders.legalName, term),
          ilike(medicalProviders.primaryEmail, term),
          ilike(medicalProviders.primaryPhone, term),
          ilike(medicalProviders.country, term),
        )!,
      );
    }
    if (filters?.providerType?.trim()) {
      conditions.push(
        eq(medicalProviders.providerType, filters.providerType.trim()),
      );
    }
    if (filters?.country?.trim()) {
      conditions.push(eq(medicalProviders.country, filters.country.trim()));
    }
    if (filters?.status?.trim()) {
      conditions.push(eq(medicalProviders.status, filters.status.trim()));
    }
    if (filters?.specialty?.trim()) {
      conditions.push(
        sql`${filters.specialty.trim()} = ANY(${medicalProviders.specialties})`,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await this.db
      .select()
      .from(medicalProviders)
      .where(whereClause);
    return rows.map((r) => this.toDomainEntity(r));
  }

  async findById(id: string): Promise<MedicalProvider | null> {
    const rows = await this.db
      .select()
      .from(medicalProviders)
      .where(eq(medicalProviders.id, id))
      .limit(1);
    return rows.length ? this.toDomainEntity(rows[0]) : null;
  }

  async create(data: {
    legalName: string;
    providerType: string;
    country: string;
    primaryEmail: string;
    primaryPhone: string;
    status?: string;
    specialties?: string[];
    services?: string[];
    businessHours?: string | null;
    licenseNumber?: string | null;
    tags?: string[];
    onboardedAt?: Date | null;
  }): Promise<MedicalProvider> {
    const result = await this.db
      .insert(medicalProviders)
      .values({
        legalName: data.legalName,
        providerType: data.providerType,
        country: data.country,
        primaryEmail: data.primaryEmail,
        primaryPhone: data.primaryPhone,
        status: data.status ?? "active",
        specialties: data.specialties ?? [],
        services: data.services ?? [],
        businessHours: data.businessHours ?? null,
        licenseNumber: data.licenseNumber ?? null,
        tags: data.tags ?? [],
        onboardedAt: data.onboardedAt ?? null,
        updatedAt: new Date(),
      })
      .returning();

    return this.toDomainEntity(result[0]);
  }

  async update(
    id: string,
    data: Partial<{
      legalName: string;
      providerType: string;
      country: string;
      primaryEmail: string;
      primaryPhone: string;
      status: string;
      specialties: string[];
      services: string[];
      businessHours: string | null;
      licenseNumber: string | null;
      tags: string[];
      onboardedAt: Date | null;
    }>,
  ): Promise<MedicalProvider> {
    const updateData: Partial<(typeof medicalProviders)["$inferInsert"]> & {
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.legalName !== undefined) updateData.legalName = data.legalName;
    if (data.providerType !== undefined)
      updateData.providerType = data.providerType;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.primaryEmail !== undefined)
      updateData.primaryEmail = data.primaryEmail;
    if (data.primaryPhone !== undefined)
      updateData.primaryPhone = data.primaryPhone;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.specialties !== undefined)
      updateData.specialties = data.specialties;
    if (data.services !== undefined) updateData.services = data.services;
    if (data.businessHours !== undefined)
      updateData.businessHours = data.businessHours;
    if (data.licenseNumber !== undefined)
      updateData.licenseNumber = data.licenseNumber;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.onboardedAt !== undefined)
      updateData.onboardedAt = data.onboardedAt;

    const result = await this.db
      .update(medicalProviders)
      .set(updateData)
      .where(eq(medicalProviders.id, id))
      .returning();

    if (!result.length) {
      throw new Error(`Medical provider with id ${id} not found`);
    }

    return this.toDomainEntity(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(medicalProviders).where(eq(medicalProviders.id, id));
  }

  private toDomainEntity(
    row: (typeof medicalProviders)["$inferSelect"],
  ): MedicalProvider {
    return new MedicalProvider(
      row.id,
      row.legalName,
      row.providerType as MedicalProviderType,
      row.country,
      row.primaryEmail,
      row.primaryPhone,
      row.status as ProviderStatus,
      row.specialties ?? [],
      row.services ?? [],
      row.businessHours ?? null,
      row.licenseNumber ?? null,
      row.tags ?? [],
      row.onboardedAt ?? null,
      row.createdAt,
      row.updatedAt,
    );
  }
}
