import type { CaseProvider } from '../entities/case-provider.entity';

export interface FindAllCaseProvidersFilters {
  search?: string;
  providerType?: string;
  operatingRegion?: string;
  status?: string;
}

export interface ICaseProviderRepository {
  findAll(filters?: FindAllCaseProvidersFilters): Promise<CaseProvider[]>;
  findById(id: string): Promise<CaseProvider | null>;
  create(data: {
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
  }): Promise<CaseProvider>;
  update(
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
  ): Promise<CaseProvider>;
  delete(id: string): Promise<void>;
}

