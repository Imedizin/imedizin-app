import { Inject, Injectable } from '@nestjs/common';
import type { AssistanceRequest } from '../../domain/entities/assistance-request.entity';
import type {
  IAssistanceRequestRepository,
  FindAllAssistanceRequestsFilters,
} from '../../domain/interfaces/assistance-request.repository.interface';

@Injectable()
export class FindAllAssistanceRequestsQuery {
  constructor(
    @Inject('IAssistanceRequestRepository')
    private readonly repo: IAssistanceRequestRepository,
  ) {}

  async execute(filters?: FindAllAssistanceRequestsFilters): Promise<AssistanceRequest[]> {
    return this.repo.findAll(filters);
  }
}
