import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConflictException } from "@nestjs/common";
import type { IMailboxRepository } from "../../domain/interfaces/mailbox.repository.interface";
import { GraphService } from "../services/graph.service";
import { Mailbox } from "../../domain/entities/mailbox.entity";

/**
 * Command to add a new mailbox
 */
export interface AddMailboxCommandPayload {
  address: string;
  name: string;
}

@Injectable()
export class AddMailboxCommand {
  private readonly logger = new Logger(AddMailboxCommand.name);

  constructor(
    @Inject("IMailboxRepository")
    private readonly mailboxRepository: IMailboxRepository,
    private readonly graphService: GraphService,
  ) {}

  async execute(payload: AddMailboxCommandPayload): Promise<Mailbox> {
    this.logger.log(`Adding mailbox with address: ${payload.address}`);

    const existing = await this.mailboxRepository.findByAddress(
      payload.address,
    );
    if (existing) {
      throw new ConflictException(
        `Mailbox with address ${payload.address} already exists`,
      );
    }

    await this.graphService.verifyMailboxExists(payload.address);

    const mailbox = await this.mailboxRepository.create({
      address: payload.address,
      name: payload.name,
    });

    try {
      const subscriptions: {
        inboxSubscriptionId: string | null;
        spamSubscriptionId: string | null;
      } = await this.graphService.createSubscriptionsForMailbox(
        payload.address,
      );
      this.logger.log(
        `Created subscriptions for mailbox ${payload.address}. Inbox: ${subscriptions.inboxSubscriptionId}, Spam: ${subscriptions.spamSubscriptionId}`,
      );
      // Bootstrap delta link for inbox so first webhook/sync is already incremental (no history)
      if (subscriptions.inboxSubscriptionId) {
        try {
          const { deltaLink } = await this.graphService.bootstrapDeltaLink(
            mailbox.address,
          );
          await this.mailboxRepository.updateDeltaLink(mailbox.id, deltaLink);
          this.logger.log(
            `Delta link bootstrapped for mailbox ${mailbox.address} during add mailbox`,
          );
        } catch (bootstrapError) {
          const msg =
            bootstrapError instanceof Error
              ? bootstrapError.message
              : "Unknown error";
          this.logger.warn(
            `Could not bootstrap delta link for ${mailbox.address}: ${msg}. First sync will bootstrap.`,
          );
        }
      }
    } catch (error) {
      // Log error but don't fail mailbox creation
      // Subscriptions can be created later via the cron job or manually
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to create subscriptions for mailbox ${payload.address}: ${errorMessage}`,
      );
    }

    return mailbox;
  }
}
