import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { ListResponse } from "@/types/api";
import type { AssistanceRequest } from "@/types/assistance-request";
import {
  type AssistanceRequestApiResponse,
  mapApiToAssistanceRequest,
} from "../api-types";
import { dummyAssistanceRequests } from "../dummy-assistance-requests";

export type AssistanceRequestsFilter = {
  serviceType?: "TRANSPORT" | "MEDICAL";
  status?: string;
};

async function fetchAssistanceRequests(
  filter?: AssistanceRequestsFilter
): Promise<AssistanceRequest[]> {
  try {
    const searchParams = new URLSearchParams();
    if (filter?.serviceType) searchParams.set("serviceType", filter.serviceType);
    if (filter?.status) searchParams.set("status", filter.status);
    const query = searchParams.toString();
    const url = query ? `assistance-requests?${query}` : "assistance-requests";
    const result = await apiClient
      .get(url)
      .json<ListResponse<AssistanceRequestApiResponse>>();
    return (result.data ?? []).map(mapApiToAssistanceRequest);
  } catch {
    return dummyAssistanceRequests;
  }
}

export const useAssistanceRequestsQuery = (filter?: AssistanceRequestsFilter) => {
  return useQuery({
    queryKey: ["assistance-requests", filter],
    queryFn: () => fetchAssistanceRequests(filter),
  });
};
