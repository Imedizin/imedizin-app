import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ITransportationRequestRepository } from '../../domain/interfaces/transportation-request.repository.interface';
import { TransportationRequest } from '../../domain/entities/transportation-request.entity';

/**
 * Command to update an existing transportation request
 */
export interface UpdateTransportationRequestCommandPayload {
  id: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  threadIds?: string[];
  status?: string;
}

@Injectable()
export class UpdateTransportationRequestCommand {
  private readonly logger = new Logger(UpdateTransportationRequestCommand.name);

  constructor(
    @Inject('ITransportationRequestRepository')
    private readonly transportationRequestRepository: ITransportationRequestRepository,
  ) {}

  async execute(
    payload: UpdateTransportationRequestCommandPayload,
  ): Promise<TransportationRequest> {
    this.logger.log(`Updating transportation request: ${payload.id}`);

    // Check if request exists
    const existing = await this.transportationRequestRepository.findById(
      payload.id,
    );
    if (!existing) {
      throw new NotFoundException(
        `Transportation request with id ${payload.id} not found`,
      );
    }

    const request = await this.transportationRequestRepository.update(
      payload.id,
      {
        pickupAddress: payload.pickupAddress,
        dropoffAddress: payload.dropoffAddress,
        threadIds: payload.threadIds,
        status: payload.status,
      },
    );

    this.logger.log(`Updated transportation request: ${request.requestNumber}`);

    return request;
  }
}
