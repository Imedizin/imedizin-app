import { Inject, Injectable, Logger } from "@nestjs/common";
import type { CaseProvider } from "../../domain/entities/case-provider.entity";
import type { ICaseProviderRepository } from "../../domain/interfaces/case-provider.repository.interface";

export interface CreateCaseProviderCommandPayload {
  companyName: string;
  providerType: string;
  operatingRegions: string[];
  primaryEmail: string;
  primaryPhone: string;
  status?: string;
  contractStartDate?: Date | null;
  contractEndDate?: Date | null;
  pricingModel?: string | null;
  slaTier?: string | null;
  tags?: string[];
}

@Injectable()
export class CreateCaseProviderCommand {
  private readonly logger = new Logger(CreateCaseProviderCommand.name);

  constructor(
    @Inject("ICaseProviderRepository")
    private readonly caseProviderRepository: ICaseProviderRepository,
  ) {}

  async execute(
    payload: CreateCaseProviderCommandPayload,
  ): Promise<CaseProvider> {
    this.logger.log(`Creating case provider: ${payload.companyName}`);
    return this.caseProviderRepository.create(payload);
  }
}
