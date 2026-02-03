import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ITransportationRequestRepository } from '../../domain/interfaces/transportation-request.repository.interface';
import { TransportationRequest } from '../../domain/entities/transportation-request.entity';

/**
 * Query to find all transportation requests
 */
@Injectable()
export class FindAllTransportationRequestsQuery {
  private readonly logger = new Logger(FindAllTransportationRequestsQuery.name);

  constructor(
    @Inject('ITransportationRequestRepository')
    private readonly transportationRequestRepository: ITransportationRequestRepository,
  ) {}

  /**
   * Execute the query to find all transportation requests
   */
  async execute(): Promise<TransportationRequest[]> {
    this.logger.log('Fetching all transportation requests');
    return await this.transportationRequestRepository.findAll();
  }
}
