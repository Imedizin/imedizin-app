import { Inject, Injectable } from "@nestjs/common";
import type { IMailboxSubscriptionRepository } from "../../domain/interfaces/mailbox-subscription.repository.interface";
import { MailboxSubscription } from "../../domain/entities/mailbox-subscription.entity";

/**
 * Query to find expiring subscriptions
 */
@Injectable()
export class FindExpiringSubscriptionsQuery {
  constructor(
    @Inject("IMailboxSubscriptionRepository")
    private readonly subscriptionRepository: IMailboxSubscriptionRepository,
  ) {}

  /**
   * Execute the query to find subscriptions expiring soon
   * @param thresholdMinutes - Minutes before expiration to consider "soon"
   * @returns Array of subscriptions expiring within the threshold
   */
  async execute(thresholdMinutes: number): Promise<MailboxSubscription[]> {
    return await this.subscriptionRepository.findExpiringSoon(thresholdMinutes);
  }
}
