import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { EmailDetail } from "@/types/email";

export const useGetEmailQuery = (id: string | undefined) => {
  const query = useQuery({
    queryKey: ["emails", id],
    queryFn: async (): Promise<EmailDetail> => {
      if (!id) {
        throw new Error("Email ID is required");
      }

      return await apiClient.get(`emails/${id}`).json<EmailDetail>();
    },
    enabled: !!id,
  });

  return query;
};
