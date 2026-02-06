import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { CaseProvider } from "@/types/case-provider";
import type { UpdateCaseProviderDto } from "@/types/case-provider";
import type { ApiResponse } from "@/types/api";

export const useUpdateCaseProviderCommand = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: UpdateCaseProviderDto & { id: string }): Promise<CaseProvider> => {
      const result = await apiClient
        .patch(`case-providers/${id}`, { json: data })
        .json<ApiResponse<CaseProvider>>();
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["case-providers"] });
      queryClient.invalidateQueries({
        queryKey: ["case-providers", variables.id],
      });
      message.success("Case provider updated successfully");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to update case provider");
    },
  });

  return { updateMutation };
};
