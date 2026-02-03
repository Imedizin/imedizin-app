import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../../../../../shared/common/database/database.module';
import type { Database } from '../../../../../shared/common/database/database.module';
import { transportationRequests } from '../schema';
import { TransportationRequest } from '../../domain/entities/transportation-request.entity';
import { ITransportationRequestRepository } from '../../domain/interfaces/transportation-request.repository.interface';
import { eq } from 'drizzle-orm';

/**
 * Transportation Request repository implementation
 * Handles data persistence using Drizzle ORM
 */
@Injectable()
export class TransportationRequestRepository implements ITransportationRequestRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database,
  ) {}

  /**
   * Find all transportation requests
   */
  async findAll(): Promise<TransportationRequest[]> {
    const result = await this.db.select().from(transportationRequests);

    return result.map((row) => this.toDomainEntity(row));
  }

  /**
   * Find transportation request by ID
   */
  async findById(id: string): Promise<TransportationRequest | null> {
    const result = await this.db
      .select()
      .from(transportationRequests)
      .where(eq(transportationRequests.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomainEntity(result[0]);
  }

  /**
   * Find transportation request by request number
   */
  async findByRequestNumber(
    requestNumber: string,
  ): Promise<TransportationRequest | null> {
    const result = await this.db
      .select()
      .from(transportationRequests)
      .where(eq(transportationRequests.requestNumber, requestNumber))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomainEntity(result[0]);
  }

  /**
   * Create a new transportation request
   */
  async create(request: {
    pickupAddress: string;
    dropoffAddress: string;
    threadIds?: string[];
  }): Promise<TransportationRequest> {
    const requestNumber = `REQ-${new Date().getFullYear()}-${Date.now()}`;

    const result = await this.db
      .insert(transportationRequests)
      .values({
        requestNumber,
        pickupAddress: request.pickupAddress,
        dropoffAddress: request.dropoffAddress,
        threadIds: request.threadIds ?? [],
        status: 'draft',
      })
      .returning();

    return this.toDomainEntity(result[0]);
  }

  /**
   * Update an existing transportation request
   */
  async update(
    id: string,
    data: {
      pickupAddress?: string;
      dropoffAddress?: string;
      threadIds?: string[];
      status?: string;
    },
  ): Promise<TransportationRequest> {
    const updateData: {
      pickupAddress?: string;
      dropoffAddress?: string;
      threadIds?: string[];
      status?: string;
      updatedAt?: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.pickupAddress !== undefined) {
      updateData.pickupAddress = data.pickupAddress;
    }
    if (data.dropoffAddress !== undefined) {
      updateData.dropoffAddress = data.dropoffAddress;
    }
    if (data.threadIds !== undefined) {
      updateData.threadIds = data.threadIds;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    const result = await this.db
      .update(transportationRequests)
      .set(updateData)
      .where(eq(transportationRequests.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Transportation request with id ${id} not found`);
    }

    return this.toDomainEntity(result[0]);
  }

  /**
   * Delete a transportation request by ID
   */
  async delete(id: string): Promise<void> {
    await this.db
      .delete(transportationRequests)
      .where(eq(transportationRequests.id, id));
  }

  /**
   * Convert database row to domain entity
   */
  private toDomainEntity(row: {
    id: string;
    requestNumber: string;
    pickupAddress: string;
    dropoffAddress: string;
    threadIds: string[] | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): TransportationRequest {
    // Always normalize to array (never null)
    const threadIds = row.threadIds ?? [];
    return new TransportationRequest(
      row.id,
      row.requestNumber,
      row.pickupAddress,
      row.dropoffAddress,
      threadIds,
      row.status,
      row.createdAt,
      row.updatedAt,
    );
  }
}
