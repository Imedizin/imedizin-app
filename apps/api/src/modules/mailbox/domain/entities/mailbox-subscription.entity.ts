/**
 * MailboxSubscription domain entity
 * Represents a webhook subscription for Microsoft Graph notifications
 */
export class MailboxSubscription {
  constructor(
    public id: string,
    public subscriptionId: string,
    public mailboxId: string,
    public resource: string,
    public notificationUrl: string,
    public expirationDateTime: Date,
    public clientState?: string,
    public changeType: string = 'created,updated,deleted',
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}

  /**
   * Check if subscription is expired
   */
  isExpired(): boolean {
    return new Date() >= this.expirationDateTime;
  }

  /**
   * Check if subscription is expiring soon
   * @param thresholdMinutes - Minutes before expiration to consider "soon" (default: 60)
   */
  isExpiringSoon(thresholdMinutes: number = 60): boolean {
    const now = new Date();
    const threshold = new Date(now.getTime() + thresholdMinutes * 60 * 1000);
    return this.expirationDateTime <= threshold;
  }

  /**
   * Update expiration date
   */
  updateExpiration(newExpirationDateTime: Date): void {
    this.expirationDateTime = newExpirationDateTime;
    this.updatedAt = new Date();
  }
}
