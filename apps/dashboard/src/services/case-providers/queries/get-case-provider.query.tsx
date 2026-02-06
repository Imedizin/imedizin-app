import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { CaseProvider } from "@/types/case-provider";
import type { ApiResponse } from "@/types/api";

export const useGetCaseProviderQuery = (id: string) => {
  return useQuery({
    queryKey: ["case-providers", id],
    queryFn: async (): Promise<CaseProvider> => {
      const result = await apiClient
        .get(`case-providers/${id}`)
        .json<ApiResponse<CaseProvider>>();
      return result.data;
    },
    enabled: !!id,
  });
};
