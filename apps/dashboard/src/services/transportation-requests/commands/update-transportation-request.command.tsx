import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { TransportationRequest } from "@/types/transportation-request";
import type { ApiResponse } from "@/types/api";

/**
 * DTO for updating a transportation request
 */
interface UpdateTransportationRequestDto {
  pickupAddress?: string;
  dropoffAddress?: string;
  threadIds?: string[];
  status?: string;
}

export const useUpdateTransportationRequestCommand = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: UpdateTransportationRequestDto & {
      id: string;
    }): Promise<TransportationRequest> => {
      const result = await apiClient
        .patch(`transportation-requests/${id}`, { json: data })
        .json<ApiResponse<TransportationRequest>>();

      return result.data;
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transportation-requests"] });
      queryClient.invalidateQueries({
        queryKey: ["transportation-requests", variables.id],
      });
      message.success("Transportation request updated successfully");
    },

    onError: (error: Error) => {
      message.error(error.message || "Failed to update transportation request");
    },
  });

  return { updateMutation };
};
