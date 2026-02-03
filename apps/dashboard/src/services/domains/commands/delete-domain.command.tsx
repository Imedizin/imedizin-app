import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { apiClient } from "@/api/client";

export const useDeleteDomainCommand = () => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`domains/${id}`);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      message.success("Domain deleted successfully");
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  return { deleteMutation };
};
