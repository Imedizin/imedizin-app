import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SyncMailboxCommand } from "./sync-mailbox.command";
import type { IMailboxSubscriptionRepository } from "../../domain/interfaces/mailbox-subscription.repository.interface";
import type { IMailboxRepository } from "../../domain/interfaces/mailbox.repository.interface";

/**
 * Notification change from Microsoft Graph webhook
 */
export interface NotificationChange {
  subscriptionId: string;
  subscriptionExpirationDateTime: string;
  changeType: "created" | "updated" | "deleted";
  resource: string;
  resourceData?: {
    "@odata.type": string;
    "@odata.id": string;
    "@odata.etag"?: string;
    id: string;
  };
  clientState?: string;
  tenantId: string;
}

/**
 * Webhook notification payload
 */
export interface WebhookNotification {
  value: NotificationChange[];
}

@Injectable()
export class ProcessNotificationCommand {
  private readonly logger = new Logger(ProcessNotificationCommand.name);

  // Track mailboxes being synced to avoid duplicate syncs
  private syncingMailboxes = new Set<string>();

  constructor(
    private readonly configService: ConfigService,
    private readonly syncMailboxCommand: SyncMailboxCommand,
    @Inject("IMailboxSubscriptionRepository")
    private readonly subscriptionRepository: IMailboxSubscriptionRepository,
    @Inject("IMailboxRepository")
    private readonly mailboxRepository: IMailboxRepository,
  ) {}

  /**
   * Process a webhook notification
   * Uses delta sync to fetch all changes since last sync
   */
  async execute(notification: WebhookNotification): Promise<void> {
    this.logger.log(
      `Processing ${notification.value?.length || 0} notification(s)`,
    );

    if (!notification.value || notification.value.length === 0) {
      this.logger.warn("Received empty notification");
      return;
    }

    // Collect unique mailboxes to sync from all notifications
    const mailboxesToSync = new Map<string, string>(); // mailboxId -> address

    for (const change of notification.value) {
      try {
        const mailboxInfo = await this.getMailboxFromChange(change);
        if (mailboxInfo) {
          mailboxesToSync.set(mailboxInfo.id, mailboxInfo.address);
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to get mailbox for subscription ${change.subscriptionId}: ${msg}`,
        );
      }
    }

    // Sync each unique mailbox using delta query
    for (const [mailboxId, mailboxAddress] of mailboxesToSync) {
      await this.syncMailboxIfNotInProgress(mailboxId, mailboxAddress);
    }
  }

  /**
   * Validate notification and get mailbox info
   */
  private async getMailboxFromChange(
    change: NotificationChange,
  ): Promise<{ id: string; address: string } | null> {
    // Validate client state
    const expectedClientState = this.configService.get<string>(
      "WEBHOOK_CLIENT_STATE",
      "my-super-secret",
    );
    if (change.clientState !== expectedClientState) {
      this.logger.warn(
        `Invalid clientState received. Expected: ${expectedClientState}, Got: ${change.clientState}`,
      );
      return null;
    }

    // Look up the subscription to find the mailbox
    const subscription = await this.subscriptionRepository.findBySubscriptionId(
      change.subscriptionId,
    );

    if (!subscription) {
      this.logger.warn(
        `Subscription ${change.subscriptionId} not found in database`,
      );
      return null;
    }

    // Get the mailbox
    const mailbox = await this.mailboxRepository.findByAddress(
      subscription.mailboxId,
    );

    if (!mailbox) {
      this.logger.warn(`Mailbox ${subscription.mailboxId} not found`);
      return null;
    }

    return { id: mailbox.id, address: mailbox.address };
  }

  /**
   * Sync mailbox if not already in progress
   * Prevents duplicate syncs when multiple notifications arrive close together
   */
  private async syncMailboxIfNotInProgress(
    mailboxId: string,
    mailboxAddress: string,
  ): Promise<void> {
    // Check if already syncing this mailbox
    if (this.syncingMailboxes.has(mailboxId)) {
      this.logger.log(
        `Mailbox ${mailboxAddress} sync already in progress, skipping`,
      );
      return;
    }

    try {
      // Mark as syncing
      this.syncingMailboxes.add(mailboxId);

      this.logger.log(`Triggering delta sync for mailbox ${mailboxAddress}`);

      const result = await this.syncMailboxCommand.execute(mailboxId);

      this.logger.log(
        `Delta sync complete for ${mailboxAddress}: ` +
          `${result.messagesCreated} created, ${result.messagesSkipped} skipped`,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Delta sync failed for ${mailboxAddress}: ${msg}`);
    } finally {
      // Remove from syncing set
      this.syncingMailboxes.delete(mailboxId);
    }
  }
}
