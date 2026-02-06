import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { ApiNotification } from "@/types/notification";
import type { ListResponse } from "@/types/api";

export interface GetNotificationsParams {
  recipientType?: string;
  recipientId?: string;
  limit?: number;
  offset?: number;
}

export function useGetNotificationsQuery(
  params: GetNotificationsParams = {},
  options?: { enabled?: boolean }
) {
  const { recipientType, recipientId, limit = 50, offset = 0 } = params;
  const searchParams = new URLSearchParams();
  if (recipientType != null) searchParams.set("recipientType", recipientType);
  if (recipientId != null) searchParams.set("recipientId", recipientId);
  searchParams.set("limit", String(limit));
  searchParams.set("offset", String(offset));

  const queryString = searchParams.toString();
  const url = queryString ? `notifications?${queryString}` : "notifications";

  return useQuery({
    queryKey: ["notifications", params],
    queryFn: async (): Promise<ApiNotification[]> => {
      const result = await apiClient
        .get(url)
        .json<ListResponse<ApiNotification>>();
      return result.data;
    },
    enabled: options?.enabled !== false,
  });
}
