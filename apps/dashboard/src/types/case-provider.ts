/** Query params for listing case providers (search & filters). */
export interface CaseProviderListParams {
  search?: string;
  providerType?: string;
  operatingRegion?: string;
  status?: string;
}

/**
 * Case Provider (insurer / TPA) – matches API response (camelCase).
 */
export interface CaseProvider {
  id: string;
  companyName: string;
  providerType: string;
  operatingRegions: string[];
  primaryEmail: string;
  primaryPhone: string;
  status: string;
  contractStartDate: string | null;
  contractEndDate: string | null;
  pricingModel: string | null;
  slaTier: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCaseProviderDto {
  companyName: string;
  providerType: string;
  operatingRegions: string[];
  primaryEmail: string;
  primaryPhone: string;
  status?: string;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  pricingModel?: string | null;
  slaTier?: string | null;
  tags?: string[];
}

export interface UpdateCaseProviderDto {
  companyName?: string;
  providerType?: string;
  operatingRegions?: string[];
  primaryEmail?: string;
  primaryPhone?: string;
  status?: string;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  pricingModel?: string | null;
  slaTier?: string | null;
  tags?: string[];
}
