import { Inject, Injectable } from '@nestjs/common';
import type { MedicalProvider } from '../../domain/entities/medical-provider.entity';
import type {
  IMedicalProviderRepository,
  FindAllMedicalProvidersFilters,
} from '../../domain/interfaces/medical-provider.repository.interface';

export interface FindAllMedicalProvidersQueryPayload {
  filters?: FindAllMedicalProvidersFilters;
}

@Injectable()
export class FindAllMedicalProvidersQuery {
  constructor(
    @Inject('IMedicalProviderRepository')
    private readonly medicalProviderRepository: IMedicalProviderRepository,
  ) {}

  async execute(
    payload: FindAllMedicalProvidersQueryPayload = {},
  ): Promise<MedicalProvider[]> {
    return this.medicalProviderRepository.findAll(payload.filters);
  }
}

