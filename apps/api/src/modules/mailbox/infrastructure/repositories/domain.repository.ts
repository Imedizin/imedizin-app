import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../../../../shared/common/database/database.module';
import type { Database } from '../../../../shared/common/database/database.module';
import { domains } from '../schema';
import { Domain } from '../../domain/entities/domain.entity';
import { IDomainRepository } from '../../domain/interfaces/domain.repository.interface';
import { eq } from 'drizzle-orm';

/**
 * Domain repository implementation
 * Handles data persistence using Drizzle ORM
 */
@Injectable()
export class DomainRepository implements IDomainRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database,
  ) {}

  /**
   * Find all domains
   */
  async findAll(): Promise<Domain[]> {
    const result = await this.db.select().from(domains);

    return result.map((row) => this.toDomainEntity(row));
  }

  /**
   * Find domain by ID
   */
  async findById(id: string): Promise<Domain | null> {
    const result = await this.db
      .select()
      .from(domains)
      .where(eq(domains.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomainEntity(result[0]);
  }

  /**
   * Find domain by domain name
   */
  async findByDomain(domain: string): Promise<Domain | null> {
    const result = await this.db
      .select()
      .from(domains)
      .where(eq(domains.domain, domain))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomainEntity(result[0]);
  }

  /**
   * Create a new domain
   */
  async create(domain: { domain: string; name: string }): Promise<Domain> {
    const result = await this.db
      .insert(domains)
      .values({
        domain: domain.domain,
        name: domain.name,
      })
      .returning();

    return this.toDomainEntity(result[0]);
  }

  /**
   * Update an existing domain
   */
  async update(
    id: string,
    data: { domain?: string; name?: string },
  ): Promise<Domain> {
    const updateData: { domain?: string; name?: string; updatedAt?: Date } = {
      updatedAt: new Date(),
    };

    if (data.domain !== undefined) {
      updateData.domain = data.domain;
    }
    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    const result = await this.db
      .update(domains)
      .set(updateData)
      .where(eq(domains.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Domain with id ${id} not found`);
    }

    return this.toDomainEntity(result[0]);
  }

  /**
   * Delete a domain by ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(domains).where(eq(domains.id, id));
  }

  /**
   * Convert database model to domain entity
   */
  private toDomainEntity(model: {
    id: string;
    domain: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }): Domain {
    return new Domain(
      model.id,
      model.domain,
      model.name,
      model.createdAt,
      model.updatedAt,
    );
  }
}
