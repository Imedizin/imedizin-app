import type { MedicalProvider } from "../../domain/entities/medical-provider.entity";

export class MedicalProviderResponseDto {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;

  constructor(provider: MedicalProvider) {
    this.id = provider.id;
    this.legalName = provider.legalName;
    this.providerType = provider.providerType;
    this.country = provider.country;
    this.primaryEmail = provider.primaryEmail;
    this.primaryPhone = provider.primaryPhone;
    this.status = provider.status;
    this.specialties = provider.specialties ?? [];
    this.services = provider.services ?? [];
    this.businessHours = provider.businessHours ?? null;
    this.licenseNumber = provider.licenseNumber ?? null;
    this.tags = provider.tags ?? [];
    this.onboardedAt = provider.onboardedAt ?? null;
    this.createdAt = provider.createdAt || new Date();
    this.updatedAt = provider.updatedAt || new Date();
  }
}
