/** Query params for listing medical providers (search & filters). */
export interface MedicalProviderListParams {
  search?: string;
  providerType?: string;
  country?: string;
  status?: string;
  specialty?: string;
}

/**
 * Medical Provider – matches API response (camelCase).
 */
export interface MedicalProvider {
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
  onboardedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalProviderDto {
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
  onboardedAt?: string | null;
}

export interface UpdateMedicalProviderDto {
  legalName?: string;
  providerType?: string;
  country?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  status?: string;
  specialties?: string[];
  services?: string[];
  businessHours?: string | null;
  licenseNumber?: string | null;
  tags?: string[];
  onboardedAt?: string | null;
}
