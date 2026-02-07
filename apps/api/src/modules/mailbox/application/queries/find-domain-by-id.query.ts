import { Inject, Injectable, Logger } from "@nestjs/common";
import { NotFoundException } from "@nestjs/common";
import type { IDomainRepository } from "../../domain/interfaces/domain.repository.interface";
import { Domain } from "../../domain/entities/domain.entity";

/**
 * Query to find a domain by ID
 */
export interface FindDomainByIdQueryPayload {
  id: string;
}

@Injectable()
export class FindDomainByIdQuery {
  private readonly logger = new Logger(FindDomainByIdQuery.name);

  constructor(
    @Inject("IDomainRepository")
    private readonly domainRepository: IDomainRepository,
  ) {}

  /**
   * Execute the query to find a domain by ID
   */
  async execute(payload: FindDomainByIdQueryPayload): Promise<Domain> {
    this.logger.log(`Fetching domain with id: ${payload.id}`);
    const domain = await this.domainRepository.findById(payload.id);

    if (!domain) {
      throw new NotFoundException(`Domain with id ${payload.id} not found`);
    }

    return domain;
  }
}
