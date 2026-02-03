import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ITransportationRequestRepository } from '../../domain/interfaces/transportation-request.repository.interface';
import { TransportationRequest } from '../../domain/entities/transportation-request.entity';

/**
 * Command to create a new transportation request
 */
export interface CreateTransportationRequestCommandPayload {
  pickupAddress: string;
  dropoffAddress: string;
  threadIds?: string[];
}

@Injectable()
export class CreateTransportationRequestCommand {
  private readonly logger = new Logger(CreateTransportationRequestCommand.name);

  constructor(
    @Inject('ITransportationRequestRepository')
    private readonly transportationRequestRepository: ITransportationRequestRepository,
  ) {}

  async execute(
    payload: CreateTransportationRequestCommandPayload,
  ): Promise<TransportationRequest> {
    this.logger.log(
      `Creating transportation request from ${payload.pickupAddress} to ${payload.dropoffAddress}`,
    );

    const request = await this.transportationRequestRepository.create({
      pickupAddress: payload.pickupAddress,
      dropoffAddress: payload.dropoffAddress,
      threadIds: payload.threadIds,
    });

    this.logger.log(
      `Created transportation request with number: ${request.requestNumber}`,
    );

    return request;
  }
}
