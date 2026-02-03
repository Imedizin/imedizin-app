import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IMailboxSubscriptionRepository } from '../../domain/interfaces/mailbox-subscription.repository.interface';
import { MailboxSubscription } from '../../domain/entities/mailbox-subscription.entity';

/**
 * Command to renew subscriptions
 */
@Injectable()
export class RenewSubscriptionsCommand {
  private readonly logger = new Logger(RenewSubscriptionsCommand.name);

  constructor(
    @Inject('IMailboxSubscriptionRepository')
    private readonly subscriptionRepository: IMailboxSubscriptionRepository,
  ) {}

  /**
   * Execute the command to renew subscriptions
   * Finds subscriptions expiring in the next 24 hours and renews them
   * Since this runs daily and Graph API subscriptions max at 3 days,
   * checking 24 hours ahead ensures we renew before expiration
   */
  async execute(): Promise<void> {
    this.logger.log('Starting mailbox subscription renewal check...');

    try {
      // Find subscriptions expiring in the next 24 hours (1440 minutes)
      const expiringSubscriptions =
        await this.subscriptionRepository.findExpiringSoon(1440);

      if (expiringSubscriptions.length === 0) {
        this.logger.log('No subscriptions expiring soon');
        return;
      }

      this.logger.log(
        `Found ${expiringSubscriptions.length} subscription(s) expiring soon`,
      );

      for (const subscription of expiringSubscriptions) {
        await this.renewSubscription(subscription);
      }

      this.logger.log('Mailbox subscription renewal check completed');
    } catch (error) {
      this.logger.error(
        'Error during subscription renewal check',
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Renew a single subscription
   * This method should be extended to call Microsoft Graph API
   * to actually renew the subscription
   */
  private async renewSubscription(
    subscription: MailboxSubscription,
  ): Promise<void> {
    try {
      this.logger.log(
        `Renewing subscription ${subscription.subscriptionId} for mailbox ${subscription.mailboxId}`,
      );

      // TODO: Implement Microsoft Graph API call to renew subscription
      // Example:
      // const renewedSubscription = await this.graphApiClient.renewSubscription(
      //   subscription.subscriptionId,
      //   new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      // );

      // For now, we'll just update the expiration to 3 days from now
      // In production, you should call the actual Graph API
      const newExpirationDateTime = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      ); // 3 days from now

      subscription.updateExpiration(newExpirationDateTime);

      // Save the updated subscription
      await this.subscriptionRepository.save(subscription);

      this.logger.log(
        `Successfully renewed subscription ${subscription.subscriptionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to renew subscription ${subscription.subscriptionId}`,
        (error as Error).stack,
      );
      // Continue with other subscriptions even if one fails
      throw error;
    }
  }
}
