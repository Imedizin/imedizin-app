export type CaseProviderType = "internal" | "external" | "TPA";
export type ProviderStatus = "active" | "inactive";

export class CaseProvider {
  constructor(
    public id: string,
    public companyName: string,
    public providerType: CaseProviderType,
    public operatingRegions: string[],
    public primaryEmail: string,
    public primaryPhone: string,
    public status: ProviderStatus = "active",
    public contractStartDate?: Date | null,
    public contractEndDate?: Date | null,
    public pricingModel?: string | null,
    public slaTier?: string | null,
    public tags: string[] = [],
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}
}
