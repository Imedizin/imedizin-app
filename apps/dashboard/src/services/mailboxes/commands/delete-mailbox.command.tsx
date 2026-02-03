import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";

export const useDeleteMailboxCommand = () => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`mailboxes/${id}`);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mailboxes"] });
      message.success("Mailbox deleted successfully");
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  return { deleteMutation };
};
