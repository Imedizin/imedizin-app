import { Inject, Injectable } from '@nestjs/common';
import type { AssistanceRequest } from '../../domain/entities/assistance-request.entity';
import type { IAssistanceRequestRepository } from '../../domain/interfaces/assistance-request.repository.interface';

@Injectable()
export class FindAssistanceRequestByIdQuery {
  constructor(
    @Inject('IAssistanceRequestRepository')
    private readonly repo: IAssistanceRequestRepository,
  ) {}

  async execute(id: string): Promise<AssistanceRequest | null> {
    return this.repo.findById(id);
  }
}
