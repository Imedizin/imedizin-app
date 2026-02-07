import { Inject, Injectable, Logger } from "@nestjs/common";
import type { MedicalProvider } from "../../domain/entities/medical-provider.entity";
import type { IMedicalProviderRepository } from "../../domain/interfaces/medical-provider.repository.interface";

export interface UpdateMedicalProviderCommandPayload {
  id: string;
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
  onboardedAt?: Date | null;
}

@Injectable()
export class UpdateMedicalProviderCommand {
  private readonly logger = new Logger(UpdateMedicalProviderCommand.name);

  constructor(
    @Inject("IMedicalProviderRepository")
    private readonly medicalProviderRepository: IMedicalProviderRepository,
  ) {}

  async execute(
    payload: UpdateMedicalProviderCommandPayload,
  ): Promise<MedicalProvider> {
    this.logger.log(`Updating medical provider: ${payload.id}`);
    const { id, ...data } = payload;
    return this.medicalProviderRepository.update(id, data);
  }
}
