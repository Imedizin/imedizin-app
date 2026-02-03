import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import type { IDomainRepository } from '../../domain/interfaces/domain.repository.interface';
import { Domain } from '../../domain/entities/domain.entity';
import { GraphService } from '../services/graph.service';

/**
 * Command to create a new domain
 */
export interface CreateDomainCommandPayload {
  domain: string;
  name: string;
}

@Injectable()
export class CreateDomainCommand {
  private readonly logger = new Logger(CreateDomainCommand.name);

  constructor(
    @Inject('IDomainRepository')
    private readonly domainRepository: IDomainRepository,
    private readonly graphService: GraphService,
  ) {}

  async execute(payload: CreateDomainCommandPayload): Promise<Domain> {
    this.logger.log(`Creating domain: ${payload.domain}`);

    const existing = await this.domainRepository.findByDomain(payload.domain);
    if (existing) {
      throw new ConflictException(`Domain ${payload.domain} already exists`);
    }

    // Verify that the domain exists in Microsoft 365 tenant
    // This will throw BadRequestException if domain doesn't exist
    await this.graphService.verifyDomainExists(payload.domain);

    const domain = await this.domainRepository.create({
      domain: payload.domain,
      name: payload.name,
    });

    this.logger.log(`Domain created successfully: ${domain.id}`);

    return domain;
  }
}
