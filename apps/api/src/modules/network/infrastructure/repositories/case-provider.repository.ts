import { Inject, Injectable } from "@nestjs/common";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { DRIZZLE } from "../../../../shared/common/database/database.module";
import type { Database } from "../../../../shared/common/database/database.module";
import { caseProviders } from "../schema";
import {
  CaseProvider,
  type CaseProviderType,
  type ProviderStatus,
} from "../../domain/entities/case-provider.entity";
import type {
  ICaseProviderRepository,
  FindAllCaseProvidersFilters,
} from "../../domain/interfaces/case-provider.repository.interface";

@Injectable()
export class CaseProviderRepository implements ICaseProviderRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database,
  ) {}

  async findAll(
    filters?: FindAllCaseProvidersFilters,
  ): Promise<CaseProvider[]> {
    const conditions: ReturnType<typeof sql>[] = [];

    if (filters?.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(caseProviders.companyName, term),
          ilike(caseProviders.primaryEmail, term),
          ilike(caseProviders.primaryPhone, term),
        )!,
      );
    }
    if (filters?.providerType?.trim()) {
      conditions.push(
        eq(caseProviders.providerType, filters.providerType.trim()),
      );
    }
    if (filters?.operatingRegion?.trim()) {
      conditions.push(
        sql`${filters.operatingRegion.trim()} = ANY(${caseProviders.operatingRegions})`,
      );
    }
    if (filters?.status?.trim()) {
      conditions.push(eq(caseProviders.status, filters.status.trim()));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await this.db.select().from(caseProviders).where(whereClause);
    return rows.map((r) => this.toDomainEntity(r));
  }

  async findById(id: string): Promise<CaseProvider | null> {
    const rows = await this.db
      .select()
      .from(caseProviders)
      .where(eq(caseProviders.id, id))
      .limit(1);
    return rows.length ? this.toDomainEntity(rows[0]) : null;
  }

  async create(data: {
    companyName: string;
    providerType: string;
    operatingRegions: string[];
    primaryEmail: string;
    primaryPhone: string;
    status?: string;
    contractStartDate?: Date | null;
    contractEndDate?: Date | null;
    pricingModel?: string | null;
    slaTier?: string | null;
    tags?: string[];
  }): Promise<CaseProvider> {
    const result = await this.db
      .insert(caseProviders)
      .values({
        companyName: data.companyName,
        providerType: data.providerType,
        operatingRegions: data.operatingRegions ?? [],
        primaryEmail: data.primaryEmail,
        primaryPhone: data.primaryPhone,
        status: data.status ?? "active",
        contractStartDate: data.contractStartDate ?? null,
        contractEndDate: data.contractEndDate ?? null,
        pricingModel: data.pricingModel ?? null,
        slaTier: data.slaTier ?? null,
        tags: data.tags ?? [],
        updatedAt: new Date(),
      })
      .returning();

    return this.toDomainEntity(result[0]);
  }

  async update(
    id: string,
    data: Partial<{
      companyName: string;
      providerType: string;
      operatingRegions: string[];
      primaryEmail: string;
      primaryPhone: string;
      status: string;
      contractStartDate: Date | null;
      contractEndDate: Date | null;
      pricingModel: string | null;
      slaTier: string | null;
      tags: string[];
    }>,
  ): Promise<CaseProvider> {
    const updateData: Partial<(typeof caseProviders)["$inferInsert"]> & {
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.companyName !== undefined)
      updateData.companyName = data.companyName;
    if (data.providerType !== undefined)
      updateData.providerType = data.providerType;
    if (data.operatingRegions !== undefined)
      updateData.operatingRegions = data.operatingRegions;
    if (data.primaryEmail !== undefined)
      updateData.primaryEmail = data.primaryEmail;
    if (data.primaryPhone !== undefined)
      updateData.primaryPhone = data.primaryPhone;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.contractStartDate !== undefined)
      updateData.contractStartDate = data.contractStartDate;
    if (data.contractEndDate !== undefined)
      updateData.contractEndDate = data.contractEndDate;
    if (data.pricingModel !== undefined)
      updateData.pricingModel = data.pricingModel;
    if (data.slaTier !== undefined) updateData.slaTier = data.slaTier;
    if (data.tags !== undefined) updateData.tags = data.tags;

    const result = await this.db
      .update(caseProviders)
      .set(updateData)
      .where(eq(caseProviders.id, id))
      .returning();

    if (!result.length) {
      throw new Error(`Case provider with id ${id} not found`);
    }

    return this.toDomainEntity(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(caseProviders).where(eq(caseProviders.id, id));
  }

  private toDomainEntity(
    row: (typeof caseProviders)["$inferSelect"],
  ): CaseProvider {
    return new CaseProvider(
      row.id,
      row.companyName,
      row.providerType as CaseProviderType,
      row.operatingRegions ?? [],
      row.primaryEmail,
      row.primaryPhone,
      row.status as ProviderStatus,
      row.contractStartDate ?? null,
      row.contractEndDate ?? null,
      row.pricingModel ?? null,
      row.slaTier ?? null,
      row.tags ?? [],
      row.createdAt,
      row.updatedAt,
    );
  }
}
