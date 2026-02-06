import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { CaseProvider } from "@/types/case-provider";
import type { CreateCaseProviderDto } from "@/types/case-provider";
import type { ApiResponse } from "@/types/api";

export const useCreateCaseProviderCommand = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (
      data: CreateCaseProviderDto,
    ): Promise<CaseProvider> => {
      const result = await apiClient
        .post("case-providers", { json: data })
        .json<ApiResponse<CaseProvider>>();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-providers"] });
      message.success("Case provider created successfully");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to create case provider");
    },
  });

  return { createMutation };
};
