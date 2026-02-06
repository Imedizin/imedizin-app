import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { MedicalProvider } from "@/types/medical-provider";
import type { CreateMedicalProviderDto } from "@/types/medical-provider";
import type { ApiResponse } from "@/types/api";

export const useCreateMedicalProviderCommand = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (
      data: CreateMedicalProviderDto,
    ): Promise<MedicalProvider> => {
      const result = await apiClient
        .post("medical-providers", { json: data })
        .json<ApiResponse<MedicalProvider>>();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-providers"] });
      message.success("Medical provider created successfully");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to create medical provider");
    },
  });

  return { createMutation };
};
