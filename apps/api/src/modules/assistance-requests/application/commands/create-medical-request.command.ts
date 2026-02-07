import { Inject, Injectable } from '@nestjs/common';
import type { AssistanceRequest } from '../../domain/entities/assistance-request.entity';
import type {
  IAssistanceRequestRepository,
  CreateMedicalPayload,
} from '../../domain/interfaces/assistance-request.repository.interface';

@Injectable()
export class CreateMedicalRequestCommand {
  constructor(
    @Inject('IAssistanceRequestRepository')
    private readonly repo: IAssistanceRequestRepository,
  ) {}

  async execute(payload: CreateMedicalPayload): Promise<AssistanceRequest> {
    return this.repo.createMedical(payload);
  }
}
