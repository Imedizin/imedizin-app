/**
 * Domain event: an email was received and stored (webhook or sync).
 * Handlers may push to realtime (Socket.IO), send push, log, etc.
 */
export const EMAIL_RECEIVED_EVENT = 'email.received';

export interface EmailReceivedEventPayload {
  mailboxId: string;
  /** Email address of the mailbox (e.g. support@example.com) for admin display */
  mailboxAddress?: string;
  emailId: string;
  subject: string;
  from: {
    emailAddress: string;
    displayName: string | null;
  };
  receivedAt: string | null;
}

export class EmailReceivedEvent implements EmailReceivedEventPayload {
  constructor(
    public readonly mailboxId: string,
    public readonly emailId: string,
    public readonly subject: string,
    public readonly from: {
      emailAddress: string;
      displayName: string | null;
    },
    public readonly receivedAt: string | null,
    public readonly mailboxAddress?: string,
  ) {}
}
