import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ITransportationRequestRepository } from '../../domain/interfaces/transportation-request.repository.interface';
import { TransportationRequest } from '../../domain/entities/transportation-request.entity';

/**
 * Query to find a transportation request by ID
 */
export interface FindTransportationRequestByIdQueryPayload {
  id: string;
}

@Injectable()
export class FindTransportationRequestByIdQuery {
  private readonly logger = new Logger(
    FindTransportationRequestByIdQuery.name,
  );

  constructor(
    @Inject('ITransportationRequestRepository')
    private readonly transportationRequestRepository: ITransportationRequestRepository,
  ) {}

  /**
   * Execute the query to find a transportation request by ID
   */
  async execute(
    payload: FindTransportationRequestByIdQueryPayload,
  ): Promise<TransportationRequest> {
    this.logger.log(`Fetching transportation request with id: ${payload.id}`);
    const request = await this.transportationRequestRepository.findById(
      payload.id,
    );

    if (!request) {
      throw new NotFoundException(
        `Transportation request with id ${payload.id} not found`,
      );
    }

    return request;
  }
}
