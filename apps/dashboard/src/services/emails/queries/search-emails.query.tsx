import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { EmailListResponse } from "@/types/email";

export const useSearchEmailsQuery = (
  query: string,
  mailboxId?: string,
  page = 1,
  limit = 20,
) => {
  const searchQuery = useQuery({
    queryKey: ["emails", "search", query, mailboxId, page, limit],
    queryFn: async (): Promise<EmailListResponse> => {
      let url = `emails/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
      if (mailboxId) {
        url += `&mailboxId=${mailboxId}`;
      }
      return await apiClient.get(url).json<EmailListResponse>();
    },
    enabled: !!query && query.trim().length > 0,
  });

  return searchQuery;
};
