import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotFoundException, ConflictException } from '@nestjs/common';
import type { IDomainRepository } from '../../domain/interfaces/domain.repository.interface';
import { Domain } from '../../domain/entities/domain.entity';
import { GraphService } from '../services/graph.service';

/**
 * Command to update a domain
 */
export interface UpdateDomainCommandPayload {
  domain?: string;
  name?: string;
}

@Injectable()
export class UpdateDomainCommand {
  private readonly logger = new Logger(UpdateDomainCommand.name);

  constructor(
    @Inject('IDomainRepository')
    private readonly domainRepository: IDomainRepository,
    private readonly graphService: GraphService,
  ) {}

  async execute(
    payload: UpdateDomainCommandPayload & { id: string },
  ): Promise<Domain> {
    this.logger.log(`Updating domain: ${payload.id}`);

    const existing = await this.domainRepository.findById(payload.id);
    if (!existing) {
      throw new NotFoundException(`Domain with id ${payload.id} not found`);
    }

    // Check if domain name is being changed and if it conflicts
    if (payload.domain && payload.domain !== existing.domain) {
      const domainExists = await this.domainRepository.findByDomain(
        payload.domain,
      );
      if (domainExists) {
        throw new ConflictException(`Domain ${payload.domain} already exists`);
      }

      // Verify that the new domain exists in Microsoft 365 tenant
      // This will throw BadRequestException if domain doesn't exist
      await this.graphService.verifyDomainExists(payload.domain);
    }

    const domain = await this.domainRepository.update(payload.id, {
      domain: payload.domain,
      name: payload.name,
    });

    this.logger.log(`Domain updated successfully: ${payload.id}`);

    return domain;
  }
}
