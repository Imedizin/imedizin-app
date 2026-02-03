import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { Mailbox } from "@/types/mailbox";
import type { ApiResponse } from "@/types/api";

export const useGetMailboxQuery = (id: string | undefined) => {
  const query = useQuery({
    queryKey: ["mailboxes", id],
    queryFn: async (): Promise<Mailbox> => {
      if (!id) {
        throw new Error("Mailbox ID is required");
      }

      const result = await apiClient
        .get(`mailboxes/${id}`)
        .json<ApiResponse<Mailbox>>();

      return result.data;
    },
    enabled: !!id,
  });

  return query;
};
