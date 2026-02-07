import { Inject, Injectable } from "@nestjs/common";
import type { IEmailRepository } from "../../domain/interfaces/email.repository.interface";
import type { ThreadSummaryByIdsItem } from "../../domain/interfaces/email.repository.interface";

/**
 * Returns minimal thread info (subject, latestDate) for the given thread IDs.
 * Used by other modules (e.g. assistance-requests) to enrich responses without joining DBs.
 */
@Injectable()
export class GetThreadSummariesByIdsQuery {
  constructor(
    @Inject("IEmailRepository")
    private readonly emailRepository: IEmailRepository,
  ) {}

  async execute(threadIds: string[]): Promise<ThreadSummaryByIdsItem[]> {
    if (threadIds.length === 0) return [];
    return this.emailRepository.getThreadSummariesByThreadIds(threadIds);
  }
}
