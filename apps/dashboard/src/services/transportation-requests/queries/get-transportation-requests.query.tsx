import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { TransportationRequest } from "@/types/transportation-request";
import type { ListResponse } from "@/types/api";

export const useListTransportationRequestsQuery = () => {
  const query = useQuery({
    queryKey: ["transportation-requests"],
    queryFn: async (): Promise<TransportationRequest[]> => {
      const result = await apiClient
        .get("transportation-requests")
        .json<ListResponse<TransportationRequest>>();

      return result.data;
    },
  });

  return query;
};
