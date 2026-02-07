import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type { AssistanceRequest } from "@/types/assistance-request";
import {
  type AssistanceRequestApiResponse,
  mapApiToAssistanceRequest,
} from "../api-types";

export const useUnlinkThreadCommand = (requestId: string | undefined) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (threadId: string): Promise<AssistanceRequest> => {
      const result = await apiClient
        .delete(`assistance-requests/${requestId}/threads/${encodeURIComponent(threadId)}`)
        .json<ApiResponse<AssistanceRequestApiResponse>>();
      return mapApiToAssistanceRequest(result.data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assistance-requests"] });
      queryClient.setQueryData(["assistance-requests", requestId], data);
      message.success("Thread unlinked");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to unlink thread");
    },
  });

  return mutation;
};
