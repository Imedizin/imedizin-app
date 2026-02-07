import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE } from "../../../../shared/common/database/database.module";
import type { Database } from "../../../../shared/common/database/database.module";
import { mailboxSubscriptions } from "../schema";
import { MailboxSubscription } from "../../domain/entities/mailbox-subscription.entity";
import { IMailboxSubscriptionRepository } from "../../domain/interfaces/mailbox-subscription.repository.interface";
import { eq, and, lte } from "drizzle-orm";

/**
 * MailboxSubscription repository implementation
 * Handles data persistence using Drizzle ORM
 */
@Injectable()
export class MailboxSubscriptionRepository implements IMailboxSubscriptionRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database,
  ) {}

  /**
   * Find subscription by subscription ID (Microsoft Graph ID)
   */
  async findBySubscriptionId(
    subscriptionId: string,
  ): Promise<MailboxSubscription | null> {
    const result = await this.db
      .select()
      .from(mailboxSubscriptions)
      .where(eq(mailboxSubscriptions.subscriptionId, subscriptionId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomainEntity(result[0]);
  }

  /**
   * Find all subscriptions for a mailbox
   */
  async findByMailboxId(mailboxId: string): Promise<MailboxSubscription[]> {
    const result = await this.db
      .select()
      .from(mailboxSubscriptions)
      .where(eq(mailboxSubscriptions.mailboxId, mailboxId));

    return result.map((row) => this.toDomainEntity(row));
  }

  /**
   * Find subscription by mailbox ID and resource
   */
  async findByMailboxIdAndResource(
    mailboxId: string,
    resource: string,
  ): Promise<MailboxSubscription | null> {
    const result = await this.db
      .select()
      .from(mailboxSubscriptions)
      .where(
        and(
          eq(mailboxSubscriptions.mailboxId, mailboxId),
          eq(mailboxSubscriptions.resource, resource),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomainEntity(result[0]);
  }

  /**
   * Find subscriptions expiring soon
   */
  async findExpiringSoon(
    thresholdMinutes: number,
  ): Promise<MailboxSubscription[]> {
    const threshold = new Date(Date.now() + thresholdMinutes * 60 * 1000);

    const result = await this.db
      .select()
      .from(mailboxSubscriptions)
      .where(lte(mailboxSubscriptions.expirationDateTime, threshold));

    return result.map((row) => this.toDomainEntity(row));
  }

  /**
   * Save subscription (create or update)
   */
  async save(subscription: MailboxSubscription): Promise<MailboxSubscription> {
    const existing = await this.findBySubscriptionId(
      subscription.subscriptionId,
    );

    if (existing) {
      // Update existing subscription
      const result = await this.db
        .update(mailboxSubscriptions)
        .set({
          expirationDateTime: subscription.expirationDateTime,
          updatedAt: new Date(),
        })
        .where(
          eq(mailboxSubscriptions.subscriptionId, subscription.subscriptionId),
        )
        .returning();

      return this.toDomainEntity(result[0]);
    } else {
      // Create new subscription
      const insertData = {
        subscriptionId: subscription.subscriptionId,
        mailboxId: subscription.mailboxId,
        resource: subscription.resource,
        notificationUrl: subscription.notificationUrl,
        changeType: subscription.changeType,
        clientState: subscription.clientState,
        expirationDateTime: subscription.expirationDateTime,
      };

      const result = await this.db
        .insert(mailboxSubscriptions)
        .values(insertData)
        .returning();

      return this.toDomainEntity(result[0]);
    }
  }

  /**
   * Delete subscription by subscription ID
   */
  async delete(subscriptionId: string): Promise<void> {
    await this.db
      .delete(mailboxSubscriptions)
      .where(eq(mailboxSubscriptions.subscriptionId, subscriptionId));
  }

  /**
   * Convert database model to domain entity
   */
  private toDomainEntity(model: {
    id: string;
    subscriptionId: string;
    mailboxId: string;
    resource: string;
    notificationUrl: string;
    changeType: string;
    clientState: string | null;
    expirationDateTime: Date;
    createdAt: Date;
    updatedAt: Date;
  }): MailboxSubscription {
    return new MailboxSubscription(
      model.id,
      model.subscriptionId,
      model.mailboxId,
      model.resource,
      model.notificationUrl,
      model.expirationDateTime,
      model.clientState || undefined,
      model.changeType,
      model.createdAt,
      model.updatedAt,
    );
  }
}
