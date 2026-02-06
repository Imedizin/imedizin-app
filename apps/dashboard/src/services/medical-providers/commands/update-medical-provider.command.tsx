import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { MedicalProvider } from "@/types/medical-provider";
import type { UpdateMedicalProviderDto } from "@/types/medical-provider";
import type { ApiResponse } from "@/types/api";

export const useUpdateMedicalProviderCommand = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: UpdateMedicalProviderDto & { id: string }): Promise<MedicalProvider> => {
      const result = await apiClient
        .patch(`medical-providers/${id}`, { json: data })
        .json<ApiResponse<MedicalProvider>>();
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["medical-providers"] });
      queryClient.invalidateQueries({
        queryKey: ["medical-providers", variables.id],
      });
      message.success("Medical provider updated successfully");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to update medical provider");
    },
  });

  return { updateMutation };
};
