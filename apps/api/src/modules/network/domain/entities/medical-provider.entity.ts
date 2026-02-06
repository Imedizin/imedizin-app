export type MedicalProviderType =
  | 'hospital'
  | 'clinic'
  | 'lab'
  | 'pharmacy'
  | 'doctor';

export type ProviderStatus = 'active' | 'inactive';

export class MedicalProvider {
  constructor(
    public id: string,
    public legalName: string,
    public providerType: MedicalProviderType,
    public country: string,
    public primaryEmail: string,
    public primaryPhone: string,
    public status: ProviderStatus = 'active',
    public specialties: string[] = [],
    public services: string[] = [],
    public businessHours?: string | null,
    public licenseNumber?: string | null,
    public tags: string[] = [],
    public onboardedAt?: Date | null,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}
}

