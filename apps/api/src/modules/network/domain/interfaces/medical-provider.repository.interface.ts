import type { MedicalProvider } from '../entities/medical-provider.entity';

export interface FindAllMedicalProvidersFilters {
  search?: string;
  providerType?: string;
  country?: string;
  status?: string;
  specialty?: string;
}

export interface IMedicalProviderRepository {
  findAll(filters?: FindAllMedicalProvidersFilters): Promise<MedicalProvider[]>;
  findById(id: string): Promise<MedicalProvider | null>;
  create(data: {
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
  }): Promise<MedicalProvider>;
  update(
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
  ): Promise<MedicalProvider>;
  delete(id: string): Promise<void>;
}

