import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type {
  MedicalProvider,
  MedicalProviderListParams,
} from "@/types/medical-provider";
import type { ListResponse } from "@/types/api";

export const useListMedicalProvidersQuery = (
  params: MedicalProviderListParams = {},
) => {
  const searchParams = new URLSearchParams();
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  if (params.providerType?.trim())
    searchParams.set("providerType", params.providerType.trim());
  if (params.country?.trim())
    searchParams.set("country", params.country.trim());
  if (params.status?.trim()) searchParams.set("status", params.status.trim());
  if (params.specialty?.trim())
    searchParams.set("specialty", params.specialty.trim());

  const queryString = searchParams.toString();
  const url = queryString ? `medical-providers?${queryString}` : "medical-providers";

  return useQuery({
    queryKey: ["medical-providers", params],
    queryFn: async (): Promise<MedicalProvider[]> => {
      const result = await apiClient
        .get(url)
        .json<ListResponse<MedicalProvider>>();
      return result.data;
    },
  });
};
