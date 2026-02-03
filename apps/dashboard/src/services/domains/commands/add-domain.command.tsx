import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";
import type { Domain } from "@/types/domain";
import type { ApiResponse } from "@/types/api";

/**
 * DTO for creating a new domain
 */
interface CreateDomainDto {
  domain: string;
  name: string;
}

export const useAddDomainCommand = () => {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (data: CreateDomainDto): Promise<Domain> => {
      const result = await apiClient
        .post("domains", { json: data })
        .json<ApiResponse<Domain>>();

      return result.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      message.success("Domain added successfully");
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  return { addMutation };
};
