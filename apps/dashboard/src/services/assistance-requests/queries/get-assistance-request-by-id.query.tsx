import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type { AssistanceRequest } from "@/types/assistance-request";
import {
  type AssistanceRequestApiResponse,
  mapApiToAssistanceRequest,
} from "../api-types";

async function fetchAssistanceRequestById(
  id: string
): Promise<AssistanceRequest | null> {
  try {
    const result = await apiClient
      .get(`assistance-requests/${id}`)
      .json<ApiResponse<AssistanceRequestApiResponse>>();
    if (!result?.data) return null;
    return mapApiToAssistanceRequest(result.data);
  } catch {
    return null;
  }
}

export const useAssistanceRequestByIdQuery = (id: string | undefined) => {
  return useQuery({
    queryKey: ["assistance-requests", id],
    queryFn: () => fetchAssistanceRequestById(id!),
    enabled: Boolean(id),
  });
};
