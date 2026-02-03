import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

/**
 * Notification event types
 */
export type NotificationEventType =
  | 'email.received'
  | 'email_updated'
  | 'email_deleted';

/**
 * Base notification event
 */
export interface NotificationEvent {
  type: NotificationEventType;
  timestamp: string;
  mailboxId: string;
}

/**
 * Email received notification – emitted when a new email is stored (webhook or sync).
 * mailboxAddress: for admin panel display (e.g. "support@example.com received an email").
 */
export interface EmailReceivedNotification extends NotificationEvent {
  type: 'email.received';
  /** Email address of the mailbox for admin display */
  mailboxAddress?: string;
  emailId: string;
  subject: string;
  from: {
    emailAddress: string;
    displayName: string | null;
  };
  receivedAt: string | null;
}

/**
 * Union type for all notifications (extend when adding email_updated, email_deleted).
 */
export type Notification = EmailReceivedNotification;

/**
 * Notification channel interface - implement this for WebSocket, Push, etc.
 */
export interface NotificationChannel {
  name: string;
  send(notification: Notification, clientId?: string): void;
}

/**
 * NotificationService - Central hub for all real-time notifications
 *
 * Designed to support multiple channels:
 * - SSE (Server-Sent Events) - implemented
 * - WebSocket - can be added later
 * - Push Notifications - can be added later
 *
 * Usage:
 * - Backend: inject and call emit() to broadcast notifications
 * - Frontend: subscribe via SSE endpoint or future WebSocket
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  // RxJS Subject for internal event streaming
  private readonly eventSubject = new Subject<Notification>();

  // Registered notification channels (SSE, WebSocket, Push, etc.)
  private readonly channels: NotificationChannel[] = [];

  // Connected SSE clients (Response objects)
  private readonly sseClients = new Map<
    string,
    {
      response: any;
      mailboxIds: Set<string> | null; // null = all mailboxes
    }
  >();

  /**
   * Get observable stream of all notifications
   */
  getNotificationStream(): Observable<Notification> {
    return this.eventSubject.asObservable();
  }

  /**
   * Get observable stream filtered by mailbox
   */
  getMailboxNotificationStream(mailboxId: string): Observable<Notification> {
    return this.eventSubject
      .asObservable()
      .pipe(filter((event) => event.mailboxId === mailboxId));
  }

  /**
   * Register a notification channel (for future WebSocket, Push support)
   */
  registerChannel(channel: NotificationChannel): void {
    this.channels.push(channel);
    this.logger.log(`Registered notification channel: ${channel.name}`);
  }

  /**
   * Emit a notification to all channels and SSE clients
   */
  emit(notification: Notification): void {
    this.logger.debug(
      `Emitting notification: ${notification.type} for mailbox ${notification.mailboxId}`,
    );

    // Emit to RxJS subject (for internal subscribers)
    this.eventSubject.next(notification);

    // Send to all registered channels
    for (const channel of this.channels) {
      try {
        channel.send(notification);
      } catch (error) {
        this.logger.error(
          `Failed to send to channel ${channel.name}: ${error}`,
        );
      }
    }

    // Send to SSE clients
    this.broadcastToSSEClients(notification);
  }

  /**
   * Emit email received notification (after a new email is stored – webhook or sync).
   * mailboxAddress: optional, for admin panel display (e.g. "support@example.com received an email").
   */
  emitEmailReceived(
    mailboxId: string,
    emailId: string,
    subject: string,
    from: { emailAddress: string; displayName: string | null },
    receivedAt: string | null,
    mailboxAddress?: string,
  ): void {
    this.emit({
      type: 'email.received',
      timestamp: new Date().toISOString(),
      mailboxId,
      mailboxAddress,
      emailId,
      subject,
      from,
      receivedAt,
    });
  }

  // ============ SSE Client Management ============

  /**
   * Register an SSE client
   * @param clientId Unique client identifier
   * @param response Express Response object
   * @param mailboxIds Optional filter - only receive notifications for these mailboxes
   */
  addSSEClient(
    clientId: string,
    response: any,
    mailboxIds: string[] | null = null,
  ): void {
    this.sseClients.set(clientId, {
      response,
      mailboxIds: mailboxIds ? new Set(mailboxIds) : null,
    });
    this.logger.log(
      `SSE client connected: ${clientId} (${this.sseClients.size} total)`,
    );
  }

  /**
   * Remove an SSE client
   */
  removeSSEClient(clientId: string): void {
    this.sseClients.delete(clientId);
    this.logger.log(
      `SSE client disconnected: ${clientId} (${this.sseClients.size} total)`,
    );
  }

  /**
   * Get count of connected SSE clients
   */
  getSSEClientCount(): number {
    return this.sseClients.size;
  }

  /**
   * Broadcast notification to relevant SSE clients
   */
  private broadcastToSSEClients(notification: Notification): void {
    const data = `data: ${JSON.stringify(notification)}\n\n`;

    for (const [clientId, client] of this.sseClients) {
      try {
        // Check if client wants notifications for this mailbox
        if (
          client.mailboxIds === null ||
          client.mailboxIds.has(notification.mailboxId)
        ) {
          client.response.write(data);
        }
      } catch (error) {
        this.logger.error(`Failed to send to SSE client ${clientId}: ${error}`);
        // Remove dead client
        this.sseClients.delete(clientId);
      }
    }
  }

  /**
   * Send a heartbeat to all SSE clients (keep connection alive)
   */
  sendHeartbeat(): void {
    const heartbeat = `:heartbeat ${Date.now()}\n\n`;
    for (const [clientId, client] of this.sseClients) {
      try {
        client.response.write(heartbeat);
      } catch (error) {
        this.logger.error(
          `Heartbeat failed for SSE client ${clientId}: ${error}`,
        );
        this.sseClients.delete(clientId);
      }
    }
  }
}
