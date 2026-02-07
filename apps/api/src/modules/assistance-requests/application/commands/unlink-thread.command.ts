import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { IAssistanceRequestRepository } from "../../domain/interfaces/assistance-request.repository.interface";
import type { AssistanceRequest } from "../../domain/entities/assistance-request.entity";

@Injectable()
export class UnlinkThreadCommand {
  constructor(
    @Inject("IAssistanceRequestRepository")
    private readonly repo: IAssistanceRequestRepository,
  ) {}

  async execute(
    requestId: string,
    threadId: string,
  ): Promise<AssistanceRequest> {
    const existing = await this.repo.findById(requestId);
    if (!existing) {
      throw new NotFoundException("Assistance request not found");
    }
    await this.repo.removeThread(requestId, threadId);
    const updated = await this.repo.findById(requestId);
    if (!updated) throw new NotFoundException("Assistance request not found");
    return updated;
  }
}
