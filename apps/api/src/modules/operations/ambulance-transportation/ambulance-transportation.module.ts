import { Module } from '@nestjs/common';
import { TransportationRequestRepository } from './infrastructure/repositories/transportation-request.repository';
import { CreateTransportationRequestCommand } from './application/commands/create-transportation-request.command';
import { UpdateTransportationRequestCommand } from './application/commands/update-transportation-request.command';
import { FindTransportationRequestByIdQuery } from './application/queries/find-transportation-request-by-id.query';
import { FindAllTransportationRequestsQuery } from './application/queries/find-all-transportation-requests.query';
import { TransportationRequestController } from './api/controllers/transportation-request.controller';

@Module({
  imports: [],
  controllers: [TransportationRequestController],
  providers: [
    CreateTransportationRequestCommand,
    UpdateTransportationRequestCommand,
    FindTransportationRequestByIdQuery,
    FindAllTransportationRequestsQuery,
    {
      provide: 'ITransportationRequestRepository',
      useClass: TransportationRequestRepository,
    },
  ],
  exports: ['ITransportationRequestRepository'],
})
export class AmbulanceTransportationModule {}
