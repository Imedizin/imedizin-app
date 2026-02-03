import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { EmailListResponse } from "@/types/email";

export const useGetEmailsQuery = (page = 1, limit = 20) => {
  const query = useQuery({
    queryKey: ["emails", page, limit],
    queryFn: async (): Promise<EmailListResponse> => {
      return await apiClient
        .get(`emails?page=${page}&limit=${limit}`)
        .json<EmailListResponse>();
    },
  });

  return query;
};
