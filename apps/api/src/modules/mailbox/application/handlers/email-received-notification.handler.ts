import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EMAIL_RECEIVED_EVENT,
  EmailReceivedEvent,
} from '../../domain/events/email-received.event';
import { NotificationService } from '../services/notification.service';

/**
 * Listens for EmailReceived domain events and pushes to SSE (and any other channels).
 * Keeps commands decoupled from notification transport.
 */
@Injectable()
export class EmailReceivedNotificationHandler {
  private readonly logger = new Logger(EmailReceivedNotificationHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(EMAIL_RECEIVED_EVENT)
  handle(event: EmailReceivedEvent): void {
    this.logger.debug(
      `Email received event: mailbox=${event.mailboxId}, email=${event.emailId}`,
    );
    this.notificationService.emitEmailReceived(
      event.mailboxId,
      event.emailId,
      event.subject,
      event.from,
      event.receivedAt,
      event.mailboxAddress,
    );
  }
}
