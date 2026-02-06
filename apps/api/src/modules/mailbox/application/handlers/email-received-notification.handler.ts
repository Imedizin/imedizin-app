import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
  EMAIL_RECEIVED_EVENT,
  EmailReceivedEvent,
} from "../../domain/events/email-received.event";
import { RealtimePublisher } from "../../../realtime/realtime.publisher";
import type {
  INotificationRepository,
  CreateNotificationInput,
} from "../../../notifications/domain/interfaces/notification.repository.interface";
import { NOTIFICATION_REPOSITORY } from "../../../notifications/notifications.module";

/**
 * Listens for EmailReceived domain events: broadcasts to realtime (Socket.IO) and creates a persisted inbox notification.
 */
@Injectable()
export class EmailReceivedNotificationHandler {
  private readonly logger = new Logger(EmailReceivedNotificationHandler.name);

  constructor(
    private readonly realtimePublisher: RealtimePublisher,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  @OnEvent(EMAIL_RECEIVED_EVENT)
  async handle(event: EmailReceivedEvent): Promise<void> {
    this.logger.debug(
      `Email received event: mailbox=${event.mailboxId}, email=${event.emailId}`,
    );

    // Realtime: broadcast to connected Socket.IO clients
    this.realtimePublisher.emit({
      topic: "email.received",
      payload: {
        emailId: event.emailId,
        subject: event.subject,
        from: event.from,
        receivedAt: event.receivedAt,
        mailboxAddress: event.mailboxAddress,
      },
      scope: { mailboxId: event.mailboxId },
    });

    // Persisted inbox: create notification for this mailbox
    const fromLabel =
      event.from.displayName || event.from.emailAddress || "Unknown";
    const input: CreateNotificationInput = {
      recipientType: "mailbox",
      recipientId: event.mailboxId,
      type: "email.received",
      title: event.subject || "(No subject)",
      body: `From: ${fromLabel}`,
      data: {
        emailId: event.emailId,
        subject: event.subject,
        from: event.from,
        receivedAt: event.receivedAt,
        mailboxAddress: event.mailboxAddress,
      },
    };
    await this.notificationRepository.create(input);
  }
}
