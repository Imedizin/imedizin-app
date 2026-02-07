import { Inject, Injectable, Logger } from "@nestjs/common";
import type { IMailboxRepository } from "../../domain/interfaces/mailbox.repository.interface";
import { Mailbox } from "../../domain/entities/mailbox.entity";

/**
 * Query to find all mailboxes
 */
@Injectable()
export class FindAllMailboxesQuery {
  private readonly logger = new Logger(FindAllMailboxesQuery.name);

  constructor(
    @Inject("IMailboxRepository")
    private readonly mailboxRepository: IMailboxRepository,
  ) {}

  /**
   * Execute the query to find all mailboxes
   */
  async execute(): Promise<Mailbox[]> {
    this.logger.log("Fetching all mailboxes");
    return await this.mailboxRepository.findAll();
  }
}
