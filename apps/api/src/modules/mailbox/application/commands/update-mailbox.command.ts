import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { IMailboxRepository } from '../../domain/interfaces/mailbox.repository.interface';
import { GraphService } from '../services/graph.service';
import { Mailbox } from '../../domain/entities/mailbox.entity';

/**
 * Command to update a mailbox
 */
export interface UpdateMailboxCommandPayload {
  id: string;
  address?: string;
  name?: string;
}

@Injectable()
export class UpdateMailboxCommand {
  private readonly logger = new Logger(UpdateMailboxCommand.name);

  constructor(
    @Inject('IMailboxRepository')
    private readonly mailboxRepository: IMailboxRepository,
    private readonly graphService: GraphService,
  ) {}

  /**
   * Execute the command to update a mailbox
   */
  async execute(payload: UpdateMailboxCommandPayload): Promise<Mailbox> {
    this.logger.log(`Updating mailbox with id: ${payload.id}`);

    // Check if mailbox exists
    const existing = await this.mailboxRepository.findById(payload.id);
    if (!existing) {
      throw new NotFoundException(`Mailbox with id ${payload.id} not found`);
    }

    // If updating address, check if new address already exists and verify it in Graph
    if (payload.address && payload.address !== existing.address) {
      const addressExists = await this.mailboxRepository.findByAddress(
        payload.address,
      );
      if (addressExists) {
        throw new ConflictException(
          `Mailbox with address ${payload.address} already exists`,
        );
      }

      // Verify that the new mailbox address exists in Microsoft Graph
      // This will throw BadRequestException if mailbox doesn't exist
      await this.graphService.verifyMailboxExists(payload.address);
    }

    const mailbox = await this.mailboxRepository.update(payload.id, {
      address: payload.address,
      name: payload.name,
    });

    return mailbox;
  }
}
