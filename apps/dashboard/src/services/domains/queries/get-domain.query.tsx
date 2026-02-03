import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { Domain } from "@/types/domain";
import type { ApiResponse } from "@/types/api";

export const useGetDomainQuery = (id: string | undefined) => {
  const query = useQuery({
    queryKey: ["domains", id],
    queryFn: async (): Promise<Domain> => {
      if (!id) {
        throw new Error("Domain ID is required");
      }

      const result = await apiClient
        .get(`domains/${id}`)
        .json<ApiResponse<Domain>>();

      return result.data;
    },
    enabled: !!id,
  });

  return query;
};
