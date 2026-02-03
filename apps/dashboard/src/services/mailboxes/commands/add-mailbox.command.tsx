import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { Mailbox } from "@/types/mailbox";
import type { ApiResponse } from "@/types/api";

/**
 * DTO for adding a new mailbox
 */
interface AddMailboxDto {
  address: string;
  name: string;
}

export const useAddMailboxCommand = () => {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (data: AddMailboxDto): Promise<Mailbox> => {
      const result = await apiClient
        .post("mailboxes", { json: data })
        .json<ApiResponse<Mailbox>>();

      return result.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mailboxes"] });
      message.success("Mailbox added successfully");
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  return { addMutation };
};
