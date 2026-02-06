import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { MedicalProvider } from "@/types/medical-provider";
import type { ApiResponse } from "@/types/api";

export const useGetMedicalProviderQuery = (id: string) => {
  return useQuery({
    queryKey: ["medical-providers", id],
    queryFn: async (): Promise<MedicalProvider> => {
      const result = await apiClient
        .get(`medical-providers/${id}`)
        .json<ApiResponse<MedicalProvider>>();
      return result.data;
    },
    enabled: !!id,
  });
};
