import { Inject, Injectable, Logger } from "@nestjs/common";
import { NotFoundException } from "@nestjs/common";
import type { IDomainRepository } from "../../domain/interfaces/domain.repository.interface";

/**
 * Command to delete a domain
 */
export interface DeleteDomainCommandPayload {
  id: string;
}

@Injectable()
export class DeleteDomainCommand {
  private readonly logger = new Logger(DeleteDomainCommand.name);

  constructor(
    @Inject("IDomainRepository")
    private readonly domainRepository: IDomainRepository,
  ) {}

  /**
   * Execute the command to delete a domain
   */
  async execute(payload: DeleteDomainCommandPayload): Promise<void> {
    this.logger.log(`Deleting domain with id: ${payload.id}`);

    const existing = await this.domainRepository.findById(payload.id);
    if (!existing) {
      throw new NotFoundException(`Domain with id ${payload.id} not found`);
    }

    // TODO: Check if domain has mailboxes before deletion
    // For now, we'll allow deletion but this should be handled in the future

    await this.domainRepository.delete(payload.id);
    this.logger.log(`Successfully deleted domain ${existing.domain}`);
  }
}
