import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { Mailbox } from "@/types/mailbox";
import type { ListResponse } from "@/types/api";

export const useGetMailboxesQuery = () => {
  const query = useQuery({
    queryKey: ["mailboxes"],
    queryFn: async (): Promise<Mailbox[]> => {
      const result = await apiClient
        .get("mailboxes")
        .json<ListResponse<Mailbox>>();

      return result.data;
    },
  });

  return query;
};
