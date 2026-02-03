/**
 * DTO for subscription response
 */
export class SubscriptionResponseDto {
  id: string;
  subscriptionId: string;
  mailboxId: string;
  resource: string;
  notificationUrl: string;
  expirationDateTime: Date;
  clientState?: string;
  changeType: string;
  createdAt?: Date;
  updatedAt?: Date;
  isExpired: boolean;
  isExpiringSoon: boolean;

  constructor(subscription: {
    id: string;
    subscriptionId: string;
    mailboxId: string;
    resource: string;
    notificationUrl: string;
    expirationDateTime: Date;
    clientState?: string;
    changeType: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = subscription.id;
    this.subscriptionId = subscription.subscriptionId;
    this.mailboxId = subscription.mailboxId;
    this.resource = subscription.resource;
    this.notificationUrl = subscription.notificationUrl;
    this.expirationDateTime = subscription.expirationDateTime;
    this.clientState = subscription.clientState;
    this.changeType = subscription.changeType;
    this.createdAt = subscription.createdAt;
    this.updatedAt = subscription.updatedAt;
    this.isExpired = new Date() >= subscription.expirationDateTime;
    this.isExpiringSoon = this.isExpiringSoonCheck(
      subscription.expirationDateTime,
    );
  }

  private isExpiringSoonCheck(
    expirationDateTime: Date,
    thresholdMinutes: number = 60,
  ): boolean {
    const now = new Date();
    const threshold = new Date(now.getTime() + thresholdMinutes * 60 * 1000);
    return expirationDateTime <= threshold;
  }
}
