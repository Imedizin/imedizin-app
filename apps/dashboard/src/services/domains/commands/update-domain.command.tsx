import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { Domain } from "@/types/domain";
import type { ApiResponse } from "@/types/api";

/**
 * DTO for updating a domain
 */
interface UpdateDomainDto {
  domain?: string;
  name?: string;
}

export const useUpdateDomainCommand = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateDomainDto;
    }): Promise<Domain> => {
      const result = await apiClient
        .patch(`domains/${id}`, { json: data })
        .json<ApiResponse<Domain>>();

      return result.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      message.success("Domain updated successfully");
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  return { updateMutation };
};
