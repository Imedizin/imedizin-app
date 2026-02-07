import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE } from "../../../../shared/common/database/database.module";
import type { Database } from "../../../../shared/common/database/database.module";
import { mailboxes } from "../schema";
import { Mailbox } from "../../domain/entities/mailbox.entity";
import { IMailboxRepository } from "../../domain/interfaces/mailbox.repository.interface";
import { eq } from "drizzle-orm";

/**
 * Mailbox repository implementation
 * Handles data persistence using Drizzle ORM
 */
@Injectable()
export class MailboxRepository implements IMailboxRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database,
  ) {}

  /**
   * Find all mailboxes
   */
  async findAll(): Promise<Mailbox[]> {
    const result = await this.db.select().from(mailboxes);

    return result.map((row) => this.toDomainEntity(row));
  }

  /**
   * Find mailbox by ID
   */
  async findById(id: string): Promise<Mailbox | null> {
    const result = await this.db
      .select()
      .from(mailboxes)
      .where(eq(mailboxes.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomainEntity(result[0]);
  }

  /**
   * Find mailbox by email address
   */
  async findByAddress(address: string): Promise<Mailbox | null> {
    const result = await this.db
      .select()
      .from(mailboxes)
      .where(eq(mailboxes.address, address))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomainEntity(result[0]);
  }

  /**
   * Create a new mailbox
   */
  async create(mailbox: { address: string; name: string }): Promise<Mailbox> {
    const result = await this.db
      .insert(mailboxes)
      .values({
        address: mailbox.address,
        name: mailbox.name,
      })
      .returning();

    return this.toDomainEntity(result[0]);
  }

  /**
   * Update an existing mailbox
   */
  async update(
    id: string,
    data: { address?: string; name?: string },
  ): Promise<Mailbox> {
    const updateData: { address?: string; name?: string } = {};

    if (data.address !== undefined) {
      updateData.address = data.address;
    }
    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    const result = await this.db
      .update(mailboxes)
      .set(updateData)
      .where(eq(mailboxes.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Mailbox with id ${id} not found`);
    }

    return this.toDomainEntity(result[0]);
  }

  /**
   * Update delta link and last sync time
   */
  async updateDeltaLink(id: string, deltaLink: string): Promise<void> {
    await this.db
      .update(mailboxes)
      .set({
        deltaLink,
        lastSyncAt: new Date(),
      })
      .where(eq(mailboxes.id, id));
  }

  /**
   * Delete a mailbox by ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(mailboxes).where(eq(mailboxes.id, id));
  }

  /**
   * Convert database model to domain entity
   */
  private toDomainEntity(model: {
    id: string;
    address: string;
    name: string;
    deltaLink: string | null;
    lastSyncAt: Date | null;
    createdAt: Date;
  }): Mailbox {
    return new Mailbox(
      model.id,
      model.address,
      model.name,
      model.deltaLink,
      model.lastSyncAt,
      model.createdAt,
    );
  }
}
