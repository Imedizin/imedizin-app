import { Inject, Injectable } from "@nestjs/common";
import type { AssistanceRequest } from "../../domain/entities/assistance-request.entity";
import type {
  IAssistanceRequestRepository,
  UpdateTransportPayload,
} from "../../domain/interfaces/assistance-request.repository.interface";

@Injectable()
export class UpdateTransportRequestCommand {
  constructor(
    @Inject("IAssistanceRequestRepository")
    private readonly repo: IAssistanceRequestRepository,
  ) {}

  async execute(
    id: string,
    payload: UpdateTransportPayload,
  ): Promise<AssistanceRequest> {
    return this.repo.updateTransport(id, payload);
  }
}
