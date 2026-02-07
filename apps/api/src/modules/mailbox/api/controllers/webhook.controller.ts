import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  Logger,
  Inject,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import type { Response } from "express";
import type { Queue } from "bullmq";
import { NEW_MESSAGE_QUEUE } from "../../application/processors/new-message.processor";
import type { NewMessageJobPayload } from "../../application/commands/process-new-message.command";
import type { WebhookNotification } from "../../application/commands/process-notification.command";
import type { IMailboxSubscriptionRepository } from "../../domain/interfaces/mailbox-subscription.repository.interface";

@Controller("mailbox/webhooks")
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue(NEW_MESSAGE_QUEUE)
    private readonly newMessageQueue: Queue,
    @Inject("IMailboxSubscriptionRepository")
    private readonly subscriptionRepository: IMailboxSubscriptionRepository,
  ) {}

  /**
   * Handle webhook validation request (GET)
   * Microsoft Graph sends GET request with validationToken query parameter
   */
  @Get("graph")
  handleValidation(
    @Query("validationToken") validationToken: string,
    @Res() res: Response,
  ): void {
    this.logger.log(
      `Webhook validation request received (GET). Token present: ${!!validationToken}`,
    );
    this.logger.log(`Request headers: ${JSON.stringify(res.req.headers)}`);

    if (validationToken) {
      this.handleValidationToken(validationToken, res, "GET");
      return;
    }

    this.logger.warn("Webhook validation failed: Missing validationToken");
    res.status(400).json({
      error: "Missing validationToken query parameter",
    });
  }

  /**
   * Handle webhook notification (POST)
   * Microsoft Graph can send validation requests via POST or actual notifications
   * Note: Using 'any' type bypasses class-validator to allow validation requests
   * with empty/minimal body
   */
  @Post("graph")
  handleNotification(
    @Query("validationToken") validationToken: string,
    @Body() notification: any,
    @Res() res: Response,
  ): void {
    // Check if this is a validation request (Microsoft Graph can send validation via POST)
    if (validationToken) {
      this.logger.log(
        `Webhook validation request received via POST. Token present: ${!!validationToken}`,
      );
      this.handleValidationToken(validationToken, res, "POST");
      return;
    }

    // Stage 1: return 202 immediately, enqueue one job per messageId
    res.status(202).json({
      success: true,
      message: "Notification received and queued for processing",
    });

    void this.enqueueNewMessageJobs(notification as WebhookNotification);
  }

  /**
   * Validate clientState, extract { mailboxId, messageId } per change, enqueue with jobId = mailboxId_messageId (no colon; BullMQ disallows it).
   */
  private async enqueueNewMessageJobs(
    notification: WebhookNotification,
  ): Promise<void> {
    const expectedClientState = this.configService.get<string>(
      "WEBHOOK_CLIENT_STATE",
      "my-super-secret",
    );

    const value = notification?.value;
    if (!Array.isArray(value) || value.length === 0) {
      this.logger.debug("Empty notification value, nothing to enqueue");
      return;
    }

    for (const change of value) {
      if (change.clientState !== expectedClientState) {
        this.logger.warn(
          `Invalid clientState for subscription ${change.subscriptionId}, skipping`,
        );
        continue;
      }

      const messageId = change.resourceData?.id;
      if (!messageId) {
        this.logger.warn(
          `Missing resourceData.id for subscription ${change.subscriptionId}, skipping`,
        );
        continue;
      }

      try {
        const subscription =
          await this.subscriptionRepository.findBySubscriptionId(
            change.subscriptionId,
          );
        if (!subscription) {
          this.logger.warn(
            `Subscription ${change.subscriptionId} not found, skipping`,
          );
          continue;
        }

        const payload: NewMessageJobPayload = {
          mailboxId: subscription.mailboxId,
          messageId,
        };
        const jobId = `${subscription.mailboxId}_${messageId}`;

        await this.newMessageQueue.add("process", payload, { jobId });
      } catch (err) {
        this.logger.error(
          `Failed to enqueue new-message job: ${(err as Error).message}`,
        );
      }
    }
  }

  /**
   * Shared method to handle validation token response
   * Microsoft Graph requires:
   * - HTTP 200 status
   * - Content-Type: text/plain
   * - Response body: exact validation token value
   */
  private handleValidationToken(
    validationToken: string,
    res: Response,
    method: "GET" | "POST",
  ): void {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(validationToken);
    this.logger.log(
      `Webhook validation successful (${method}). Returned token: ${validationToken.substring(0, 10)}...`,
    );
  }
}
