import { Inject, Injectable } from '@nestjs/common';
import type { AssistanceRequest } from '../../domain/entities/assistance-request.entity';
import type {
  IAssistanceRequestRepository,
  UpdateMedicalPayload,
} from '../../domain/interfaces/assistance-request.repository.interface';

@Injectable()
export class UpdateMedicalRequestCommand {
  constructor(
    @Inject('IAssistanceRequestRepository')
    private readonly repo: IAssistanceRequestRepository,
  ) {}

  async execute(id: string, payload: UpdateMedicalPayload): Promise<AssistanceRequest> {
    return this.repo.updateMedical(id, payload);
  }
}
