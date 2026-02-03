/**
 * Mailbox domain entity
 * Represents an email inbox like support@ourdomain.com
 */
export class Mailbox {
  constructor(
    public id: string,
    public address: string,
    public name: string,
    public deltaLink: string | null = null,
    public lastSyncAt: Date | null = null,
    public createdAt?: Date,
  ) {}

  /**
   * Update mailbox name
   */
  updateName(name: string): void {
    this.name = name;
  }

  /**
   * Update mailbox address
   */
  updateAddress(address: string): void {
    this.address = address;
  }

  /**
   * Update delta link after sync
   */
  updateDeltaLink(deltaLink: string): void {
    this.deltaLink = deltaLink;
    this.lastSyncAt = new Date();
  }

  /**
   * Check if mailbox has been synced before
   */
  hasBeenSynced(): boolean {
    return this.deltaLink !== null;
  }
}
