import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { ThreadListResponse } from "@/types/email";

export interface GetThreadsQueryParams {
  mailboxId?: string;
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Query hook for fetching threads with pagination and optional search
 */
export const useGetThreadsQuery = (params: GetThreadsQueryParams = {}) => {
  const { mailboxId, page = 1, limit = 20, search } = params;

  const queryTrimmed = search?.trim();
  const query = useQuery({
    queryKey: ["threads", mailboxId, page, limit, queryTrimmed ?? ""],
    queryFn: async (): Promise<ThreadListResponse> => {
      const urlParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (mailboxId) {
        urlParams.append("mailboxId", mailboxId);
      }
      if (queryTrimmed) {
        urlParams.append("q", queryTrimmed);
      }
      return await apiClient
        .get(`emails/threads?${urlParams.toString()}`)
        .json<ThreadListResponse>();
    },
  });

  return query;
};
