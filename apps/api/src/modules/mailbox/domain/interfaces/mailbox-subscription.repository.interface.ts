import { MailboxSubscription } from "../entities/mailbox-subscription.entity";

/**
 * MailboxSubscription repository interface
 * Defined in domain layer to maintain dependency inversion
 */
export interface IMailboxSubscriptionRepository {
  /**
   * Find subscription by subscription ID (Microsoft Graph ID)
   */
  findBySubscriptionId(
    subscriptionId: string,
  ): Promise<MailboxSubscription | null>;

  /**
   * Find all subscriptions for a mailbox
   */
  findByMailboxId(mailboxId: string): Promise<MailboxSubscription[]>;

  /**
   * Find subscription by mailbox ID and resource
   */
  findByMailboxIdAndResource(
    mailboxId: string,
    resource: string,
  ): Promise<MailboxSubscription | null>;

  /**
   * Find subscriptions expiring soon
   * @param thresholdMinutes - Minutes before expiration to consider "soon"
   */
  findExpiringSoon(thresholdMinutes: number): Promise<MailboxSubscription[]>;

  /**
   * Save subscription (create or update)
   */
  save(subscription: MailboxSubscription): Promise<MailboxSubscription>;

  /**
   * Delete subscription by subscription ID
   */
  delete(subscriptionId: string): Promise<void>;
}
