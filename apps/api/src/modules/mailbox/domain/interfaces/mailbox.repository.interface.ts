import { Mailbox } from '../entities/mailbox.entity';

/**
 * Mailbox repository interface
 * Defined in domain layer to maintain dependency inversion
 */
export interface IMailboxRepository {
  /**
   * Find all mailboxes
   */
  findAll(): Promise<Mailbox[]>;

  /**
   * Find mailbox by ID
   */
  findById(id: string): Promise<Mailbox | null>;

  /**
   * Find mailbox by email address
   */
  findByAddress(address: string): Promise<Mailbox | null>;

  /**
   * Create a new mailbox
   */
  create(mailbox: { address: string; name: string }): Promise<Mailbox>;

  /**
   * Update an existing mailbox
   */
  update(
    id: string,
    data: { address?: string; name?: string },
  ): Promise<Mailbox>;

  /**
   * Update delta link and last sync time
   */
  updateDeltaLink(id: string, deltaLink: string): Promise<void>;

  /**
   * Delete a mailbox by ID
   */
  delete(id: string): Promise<void>;
}
