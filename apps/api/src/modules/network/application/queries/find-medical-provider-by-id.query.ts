import { Inject, Injectable } from '@nestjs/common';
import type { MedicalProvider } from '../../domain/entities/medical-provider.entity';
import type { IMedicalProviderRepository } from '../../domain/interfaces/medical-provider.repository.interface';

export interface FindMedicalProviderByIdQueryPayload {
  id: string;
}

@Injectable()
export class FindMedicalProviderByIdQuery {
  constructor(
    @Inject('IMedicalProviderRepository')
    private readonly medicalProviderRepository: IMedicalProviderRepository,
  ) {}

  async execute(
    payload: FindMedicalProviderByIdQueryPayload,
  ): Promise<MedicalProvider> {
    const provider = await this.medicalProviderRepository.findById(payload.id);
    if (!provider) {
      throw new Error(`Medical provider with id ${payload.id} not found`);
    }
    return provider;
  }
}

