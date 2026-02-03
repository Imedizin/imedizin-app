import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import type { IMailboxRepository } from '../../domain/interfaces/mailbox.repository.interface';
import { Mailbox } from '../../domain/entities/mailbox.entity';

/**
 * Query to find a mailbox by ID
 */
export interface FindMailboxByIdQueryPayload {
  id: string;
}

@Injectable()
export class FindMailboxByIdQuery {
  private readonly logger = new Logger(FindMailboxByIdQuery.name);

  constructor(
    @Inject('IMailboxRepository')
    private readonly mailboxRepository: IMailboxRepository,
  ) {}

  /**
   * Execute the query to find a mailbox by ID
   */
  async execute(payload: FindMailboxByIdQueryPayload): Promise<Mailbox> {
    this.logger.log(`Fetching mailbox with id: ${payload.id}`);
    const mailbox = await this.mailboxRepository.findById(payload.id);

    if (!mailbox) {
      throw new NotFoundException(`Mailbox with id ${payload.id} not found`);
    }

    return mailbox;
  }
}
