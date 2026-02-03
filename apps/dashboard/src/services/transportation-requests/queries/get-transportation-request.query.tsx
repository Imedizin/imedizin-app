import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { TransportationRequest } from "@/types/transportation-request";
import type { ApiResponse } from "@/types/api";

export const useGetTransportationRequestQuery = (id: string) => {
  const query = useQuery({
    queryKey: ["transportation-requests", id],
    queryFn: async (): Promise<TransportationRequest> => {
      const result = await apiClient
        .get(`transportation-requests/${id}`)
        .json<ApiResponse<TransportationRequest>>();

      return result.data;
    },
    enabled: !!id,
  });

  return query;
};
