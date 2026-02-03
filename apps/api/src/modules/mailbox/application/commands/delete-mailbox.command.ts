import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import type { IMailboxRepository } from '../../domain/interfaces/mailbox.repository.interface';
import type { IMailboxSubscriptionRepository } from '../../domain/interfaces/mailbox-subscription.repository.interface';
import { GraphService } from '../services/graph.service';

/**
 * Command to delete a mailbox
 */
export interface DeleteMailboxCommandPayload {
  id: string;
}

@Injectable()
export class DeleteMailboxCommand {
  private readonly logger = new Logger(DeleteMailboxCommand.name);

  constructor(
    @Inject('IMailboxRepository')
    private readonly mailboxRepository: IMailboxRepository,
    @Inject('IMailboxSubscriptionRepository')
    private readonly subscriptionRepository: IMailboxSubscriptionRepository,
    private readonly graphService: GraphService,
  ) {}

  /**
   * Execute the command to delete a mailbox
   */
  async execute(payload: DeleteMailboxCommandPayload): Promise<void> {
    this.logger.log(`Deleting mailbox with id: ${payload.id}`);

    const existing = await this.mailboxRepository.findById(payload.id);
    if (!existing) {
      throw new NotFoundException(`Mailbox with id ${payload.id} not found`);
    }

    const subscriptions = await this.subscriptionRepository.findByMailboxId(
      existing.address,
    );

    // Delete subscriptions from Microsoft Graph and database
    for (const subscription of subscriptions) {
      try {
        // Delete from Microsoft Graph API
        await this.graphService.deleteSubscription(subscription.subscriptionId);
        // Delete from database
        await this.subscriptionRepository.delete(subscription.subscriptionId);
        this.logger.log(
          `Deleted subscription ${subscription.subscriptionId} for mailbox ${existing.address}`,
        );
      } catch (error) {
        // Log error but continue with deletion
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to delete subscription ${subscription.subscriptionId}: ${errorMessage}`,
        );
        // Still try to delete from database even if Graph deletion failed
        try {
          await this.subscriptionRepository.delete(subscription.subscriptionId);
        } catch (dbError) {
          this.logger.error(
            `Failed to delete subscription ${subscription.subscriptionId} from database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
          );
        }
      }
    }

    // Delete the mailbox
    await this.mailboxRepository.delete(payload.id);
    this.logger.log(`Successfully deleted mailbox ${existing.address}`);
  }
}
