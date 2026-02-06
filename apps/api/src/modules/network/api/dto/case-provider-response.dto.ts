import type { CaseProvider } from '../../domain/entities/case-provider.entity';

export class CaseProviderResponseDto {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;

  constructor(provider: CaseProvider) {
    this.id = provider.id;
    this.companyName = provider.companyName;
    this.providerType = provider.providerType;
    this.operatingRegions = provider.operatingRegions ?? [];
    this.primaryEmail = provider.primaryEmail;
    this.primaryPhone = provider.primaryPhone;
    this.status = provider.status;
    this.contractStartDate = provider.contractStartDate ?? null;
    this.contractEndDate = provider.contractEndDate ?? null;
    this.pricingModel = provider.pricingModel ?? null;
    this.slaTier = provider.slaTier ?? null;
    this.tags = provider.tags ?? [];
    this.createdAt = provider.createdAt || new Date();
    this.updatedAt = provider.updatedAt || new Date();
  }
}

