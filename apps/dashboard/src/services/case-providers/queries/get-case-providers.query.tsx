import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type {
  CaseProvider,
  CaseProviderListParams,
} from "@/types/case-provider";
import type { ListResponse } from "@/types/api";

export const useListCaseProvidersQuery = (
  params: CaseProviderListParams = {},
) => {
  const searchParams = new URLSearchParams();
  if (params.search?.trim()) searchParams.set("search", params.search.trim());
  if (params.providerType?.trim())
    searchParams.set("providerType", params.providerType.trim());
  if (params.operatingRegion?.trim())
    searchParams.set("operatingRegion", params.operatingRegion.trim());
  if (params.status?.trim()) searchParams.set("status", params.status.trim());

  const queryString = searchParams.toString();
  const url = queryString
    ? `case-providers?${queryString}`
    : "case-providers";

  return useQuery({
    queryKey: ["case-providers", params],
    queryFn: async (): Promise<CaseProvider[]> => {
      const result = await apiClient
        .get(url)
        .json<ListResponse<CaseProvider>>();
      return result.data;
    },
  });
};
