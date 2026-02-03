/**
 * Transportation Request domain entity
 * Phase 1: Minimal entity with just pickup/dropoff addresses
 */
export class TransportationRequest {
  constructor(
    public id: string,
    public requestNumber: string,
    public pickupAddress: string,
    public dropoffAddress: string,
    public threadIds: string[] = [],
    public status: string = 'draft',
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}

  /**
   * Update pickup address
   */
  updatePickupAddress(address: string): void {
    this.pickupAddress = address;
    this.updatedAt = new Date();
  }

  /**
   * Update dropoff address
   */
  updateDropoffAddress(address: string): void {
    this.dropoffAddress = address;
    this.updatedAt = new Date();
  }

  /**
   * Update status
   */
  updateStatus(status: string): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  /**
   * Link thread IDs to this request
   */
  linkThreadIds(threadIds: string[]): void {
    this.threadIds = threadIds;
    this.updatedAt = new Date();
  }

  /**
   * Add a thread ID to this request
   */
  addThreadId(threadId: string): void {
    if (!this.threadIds.includes(threadId)) {
      this.threadIds.push(threadId);
      this.updatedAt = new Date();
    }
  }

  /**
   * Remove a thread ID from this request
   */
  removeThreadId(threadId: string): void {
    this.threadIds = this.threadIds.filter((id) => id !== threadId);
    this.updatedAt = new Date();
  }

  /**
   * Clear all thread IDs from this request
   */
  clearThreadIds(): void {
    this.threadIds = [];
    this.updatedAt = new Date();
  }

  /**
   * Check if request has linked threads
   */
  hasLinkedThreads(): boolean {
    return this.threadIds.length > 0;
  }

  /**
   * Check if request is in draft status
   */
  isDraft(): boolean {
    return this.status === 'draft';
  }
}
