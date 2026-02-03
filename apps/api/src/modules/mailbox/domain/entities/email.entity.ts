/**
 * Email participant value object
 */
export interface EmailParticipant {
  emailAddress: string;
  displayName: string | null;
  type: 'from' | 'to' | 'cc' | 'bcc' | 'reply_to';
}

/**
 * Email domain entity
 * Represents an email message
 */
export class Email {
  constructor(
    public id: string,
    public mailboxId: string,
    public messageId: string, // RFC Message-ID header
    public threadId: string | null, // Computed thread ID for grouping
    public inReplyTo: string | null, // RFC In-Reply-To header - parent Message-ID
    public references: string | null, // RFC References header - ancestor Message-IDs
    public subject: string,
    public bodyText: string | null,
    public bodyHtml: string | null,
    public rawSource: string,
    public direction: 'incoming' | 'outgoing',
    public sentAt: Date | null,
    public receivedAt: Date | null,
    public createdAt: Date,
    public participants: EmailParticipant[] = [],
  ) {}

  /**
   * Get the sender (from participant)
   */
  getFrom(): EmailParticipant | undefined {
    return this.participants.find((p) => p.type === 'from');
  }

  /**
   * Get all recipients (to participants)
   */
  getTo(): EmailParticipant[] {
    return this.participants.filter((p) => p.type === 'to');
  }

  /**
   * Get CC recipients
   */
  getCc(): EmailParticipant[] {
    return this.participants.filter((p) => p.type === 'cc');
  }

  /**
   * Get BCC recipients
   */
  getBcc(): EmailParticipant[] {
    return this.participants.filter((p) => p.type === 'bcc');
  }
}
