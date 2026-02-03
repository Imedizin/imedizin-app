import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { TransportationRequest } from "@/types/transportation-request";
import type { ApiResponse } from "@/types/api";

/**
 * DTO for creating a new transportation request
 */
interface CreateTransportationRequestDto {
  pickupAddress: string;
  dropoffAddress: string;
}

export const useAddTransportationRequestCommand = () => {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (
      data: CreateTransportationRequestDto,
    ): Promise<TransportationRequest> => {
      const result = await apiClient
        .post("transportation-requests", { json: data })
        .json<ApiResponse<TransportationRequest>>();

      return result.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transportation-requests"] });
      message.success("Transportation request created successfully");
    },

    onError: (error: Error) => {
      message.error(error.message || "Failed to create transportation request");
    },
  });

  return { addMutation };
};
