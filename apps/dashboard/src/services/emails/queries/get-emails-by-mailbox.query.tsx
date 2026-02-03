import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { EmailListResponse } from "@/types/email";

export const useGetEmailsByMailboxQuery = (
  mailboxId: string | undefined,
  page = 1,
  limit = 20,
) => {
  const query = useQuery({
    queryKey: ["emails", "mailbox", mailboxId, page, limit],
    queryFn: async (): Promise<EmailListResponse> => {
      if (!mailboxId) {
        throw new Error("Mailbox ID is required");
      }

      return await apiClient
        .get(`emails/mailbox/${mailboxId}?page=${page}&limit=${limit}`)
        .json<EmailListResponse>();
    },
    enabled: !!mailboxId,
  });

  return query;
};
