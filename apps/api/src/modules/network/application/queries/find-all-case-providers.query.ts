import { Inject, Injectable } from "@nestjs/common";
import type { CaseProvider } from "../../domain/entities/case-provider.entity";
import type {
  ICaseProviderRepository,
  FindAllCaseProvidersFilters,
} from "../../domain/interfaces/case-provider.repository.interface";

export interface FindAllCaseProvidersQueryPayload {
  filters?: FindAllCaseProvidersFilters;
}

@Injectable()
export class FindAllCaseProvidersQuery {
  constructor(
    @Inject("ICaseProviderRepository")
    private readonly caseProviderRepository: ICaseProviderRepository,
  ) {}

  async execute(
    payload: FindAllCaseProvidersQueryPayload = {},
  ): Promise<CaseProvider[]> {
    return this.caseProviderRepository.findAll(payload.filters);
  }
}
