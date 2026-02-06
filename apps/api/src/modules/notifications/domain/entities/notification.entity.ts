/**
 * Inbox notification entity (persisted).
 * Scoped by recipientType + recipientId (e.g. mailbox/mailboxId).
 */
export class Notification {
  constructor(
    public id: string,
    public recipientType: string,
    public recipientId: string,
    public type: string,
    public title: string,
    public body: string | null,
    public data: Record<string, unknown> | null,
    public readAt: Date | null,
    public createdAt: Date
  ) {}
}
