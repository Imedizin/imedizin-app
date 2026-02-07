import { Inject, Injectable, Logger } from "@nestjs/common";
import type { MedicalProvider } from "../../domain/entities/medical-provider.entity";
import type { IMedicalProviderRepository } from "../../domain/interfaces/medical-provider.repository.interface";

export interface CreateMedicalProviderCommandPayload {
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
}

@Injectable()
export class CreateMedicalProviderCommand {
  private readonly logger = new Logger(CreateMedicalProviderCommand.name);

  constructor(
    @Inject("IMedicalProviderRepository")
    private readonly medicalProviderRepository: IMedicalProviderRepository,
  ) {}

  async execute(
    payload: CreateMedicalProviderCommandPayload,
  ): Promise<MedicalProvider> {
    this.logger.log(`Creating medical provider: ${payload.legalName}`);
    return this.medicalProviderRepository.create(payload);
  }
}
