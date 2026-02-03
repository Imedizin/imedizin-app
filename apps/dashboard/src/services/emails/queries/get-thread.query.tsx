import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { ThreadDetail } from "@/types/email";

/**
 * Query hook for fetching all emails in a thread
 */
export const useGetThreadQuery = (threadId?: string) => {
  const query = useQuery({
    queryKey: ["threadDetails", threadId],
    queryFn: async (): Promise<ThreadDetail> => {
      return await apiClient
        .get(`emails/thread/${threadId}`)
        .json<ThreadDetail>();
    },
    enabled: !!threadId,
  });

  return query;
};
