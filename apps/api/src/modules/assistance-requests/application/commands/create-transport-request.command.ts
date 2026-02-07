import { Inject, Injectable } from '@nestjs/common';
import type { AssistanceRequest } from '../../domain/entities/assistance-request.entity';
import type {
  IAssistanceRequestRepository,
  CreateTransportPayload,
} from '../../domain/interfaces/assistance-request.repository.interface';

@Injectable()
export class CreateTransportRequestCommand {
  constructor(
    @Inject('IAssistanceRequestRepository')
    private readonly repo: IAssistanceRequestRepository,
  ) {}

  async execute(payload: CreateTransportPayload): Promise<AssistanceRequest> {
    return this.repo.createTransport(payload);
  }
}
