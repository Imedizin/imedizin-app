import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { Mailbox } from "@/types/mailbox";
import type { ApiResponse } from "@/types/api";

/**
 * DTO for updating a mailbox
 */
interface UpdateMailboxDto {
  address?: string;
  name?: string;
}

export const useUpdateMailboxCommand = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMailboxDto;
    }): Promise<Mailbox> => {
      const result = await apiClient
        .patch(`mailboxes/${id}`, { json: data })
        .json<ApiResponse<Mailbox>>();

      return result.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mailboxes"] });
      message.success("Mailbox updated successfully");
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  return { updateMutation };
};
