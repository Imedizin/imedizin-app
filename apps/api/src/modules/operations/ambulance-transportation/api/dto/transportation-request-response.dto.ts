import { TransportationRequest } from '../../domain/entities/transportation-request.entity';

/**
 * DTO for transportation request response
 */
export class TransportationRequestResponseDto {
  id: string;
  requestNumber: string;
  pickupAddress: string;
  dropoffAddress: string;
  threadIds: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(request: TransportationRequest) {
    this.id = request.id;
    this.requestNumber = request.requestNumber;
    this.pickupAddress = request.pickupAddress;
    this.dropoffAddress = request.dropoffAddress;
    // Convert single threadId to array for API consistency
    this.threadIds = request.threadIds;
    this.status = request.status;
    this.createdAt = request.createdAt || new Date();
    this.updatedAt = request.updatedAt || new Date();
  }
}
