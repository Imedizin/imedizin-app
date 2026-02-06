import { Controller, Get, Query } from "@nestjs/common";
import { RealtimePublisher } from "./realtime.publisher";

/**
 * Test endpoint to emit a fake email.received event (for integration testing).
 * RealtimePublisher → Socket.IO gateway → frontend notification.
 *
 * Usage:
 *   curl "http://localhost:3000/api/realtime/test/email-received"
 *   curl "http://localhost:3000/api/realtime/test/email-received?subject=Test%20subject&from=test@example.com"
 */
@Controller("api/realtime/test")
export class RealtimeTestController {
  constructor(private readonly publisher: RealtimePublisher) {}

  @Get("email-received")
  emitTestEmailReceived(
    @Query("subject") subject?: string,
    @Query("from") fromEmail?: string,
    @Query("mailboxId") mailboxId?: string
  ): { ok: boolean; message: string } {
    const payload = {
      emailId: `test-${Date.now()}`,
      subject: subject ?? "Test email (curl)",
      from: {
        emailAddress: fromEmail ?? "test@example.com",
        displayName: fromEmail ?? "Test Sender",
      },
      receivedAt: new Date().toISOString(),
      mailboxAddress: "test@example.com",
    };

    this.publisher.emit({
      topic: "email.received",
      payload,
      scope: { mailboxId: mailboxId ?? "test-mailbox" },
    });

    return {
      ok: true,
      message: `Emitted email.received (subject: ${payload.subject}). Check frontend for toast + notification.`,
    };
  }
}
