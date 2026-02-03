import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { Domain } from "@/types/domain";
import type { ListResponse } from "@/types/api";

export const useGetDomainsQuery = () => {
  const query = useQuery({
    queryKey: ["domains"],
    queryFn: async (): Promise<Domain[]> => {
      const result = await apiClient
        .get("domains")
        .json<ListResponse<Domain>>();

      return result.data;
    },
  });

  return query;
};
