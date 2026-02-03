import { TransportationRequest } from '../entities/transportation-request.entity';

/**
 * Transportation Request repository interface
 * Defined in domain layer to maintain dependency inversion
 */
export interface ITransportationRequestRepository {
  /**
   * Find all transportation requests
   */
  findAll(): Promise<TransportationRequest[]>;

  /**
   * Find transportation request by ID
   */
  findById(id: string): Promise<TransportationRequest | null>;

  /**
   * Find transportation request by request number
   */
  findByRequestNumber(
    requestNumber: string,
  ): Promise<TransportationRequest | null>;

  /**
   * Create a new transportation request
   */
  create(request: {
    pickupAddress: string;
    dropoffAddress: string;
    threadIds?: string[];
  }): Promise<TransportationRequest>;

  /**
   * Update an existing transportation request
   */
  update(
    id: string,
    data: {
      pickupAddress?: string;
      dropoffAddress?: string;
      threadIds?: string[];
      status?: string;
    },
  ): Promise<TransportationRequest>;

  /**
   * Delete a transportation request by ID
   */
  delete(id: string): Promise<void>;
}
