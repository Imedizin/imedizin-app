import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type { AssistanceRequest } from "@/types/assistance-request";
import {
  type AssistanceRequestApiResponse,
  mapApiToAssistanceRequest,
} from "../api-types";

export const useLinkThreadCommand = (requestId: string | undefined) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (threadId: string): Promise<AssistanceRequest> => {
      const result = await apiClient
        .post(`assistance-requests/${requestId}/threads`, {
          json: { threadId: threadId.trim() },
        })
        .json<ApiResponse<AssistanceRequestApiResponse>>();
      return mapApiToAssistanceRequest(result.data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assistance-requests"] });
      queryClient.setQueryData(["assistance-requests", requestId], data);
      message.success("Thread linked");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to link thread");
    },
  });

  return mutation;
};
