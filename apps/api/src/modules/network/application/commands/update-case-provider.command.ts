import { Inject, Injectable, Logger } from '@nestjs/common';
import type { CaseProvider } from '../../domain/entities/case-provider.entity';
import type { ICaseProviderRepository } from '../../domain/interfaces/case-provider.repository.interface';

export interface UpdateCaseProviderCommandPayload {
  id: string;
  companyName?: string;
  providerType?: string;
  operatingRegions?: string[];
  primaryEmail?: string;
  primaryPhone?: string;
  status?: string;
  contractStartDate?: Date | null;
  contractEndDate?: Date | null;
  pricingModel?: string | null;
  slaTier?: string | null;
  tags?: string[];
}

@Injectable()
export class UpdateCaseProviderCommand {
  private readonly logger = new Logger(UpdateCaseProviderCommand.name);

  constructor(
    @Inject('ICaseProviderRepository')
    private readonly caseProviderRepository: ICaseProviderRepository,
  ) {}

  async execute(payload: UpdateCaseProviderCommandPayload): Promise<CaseProvider> {
    this.logger.log(`Updating case provider: ${payload.id}`);
    const { id, ...data } = payload;
    return this.caseProviderRepository.update(id, data);
  }
}

