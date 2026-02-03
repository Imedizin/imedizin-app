import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { SyncResult } from "@/types/email";

export const useSyncMailboxCommand = () => {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async (mailboxId: string): Promise<SyncResult> => {
      return await apiClient
        .post(`emails/mailbox/${mailboxId}/sync`)
        .json<SyncResult>();
    },

    onSuccess: (result) => {
      message.success(
        `Synced ${result.messagesCreated} new emails for ${result.mailboxAddress}`,
      );
      void queryClient.invalidateQueries({ queryKey: ["emails"] });
      void queryClient.invalidateQueries({ queryKey: ["threads"] });
      void queryClient.invalidateQueries({ queryKey: ["threadDetails"] });
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  return { syncMutation };
};
