import { Inject, Injectable } from '@nestjs/common';
import type { CaseProvider } from '../../domain/entities/case-provider.entity';
import type { ICaseProviderRepository } from '../../domain/interfaces/case-provider.repository.interface';

export interface FindCaseProviderByIdQueryPayload {
  id: string;
}

@Injectable()
export class FindCaseProviderByIdQuery {
  constructor(
    @Inject('ICaseProviderRepository')
    private readonly caseProviderRepository: ICaseProviderRepository,
  ) {}

  async execute(
    payload: FindCaseProviderByIdQueryPayload,
  ): Promise<CaseProvider> {
    const provider = await this.caseProviderRepository.findById(payload.id);
    if (!provider) {
      throw new Error(`Case provider with id ${payload.id} not found`);
    }
    return provider;
  }
}

