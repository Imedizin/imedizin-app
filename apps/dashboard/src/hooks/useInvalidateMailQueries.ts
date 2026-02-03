import { useQueryClient } from "@tanstack/react-query";

/**
 * Invalidates all email- and thread-related queries so React Query refetches
 * active data. Use after sync or when the user requests a refresh.
 * All components using email/thread queries will get fresh data automatically.
 */
export function useInvalidateMailQueries() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: ["emails"] });
    void queryClient.invalidateQueries({ queryKey: ["threads"] });
    void queryClient.invalidateQueries({ queryKey: ["threadDetails"] });
  };
}
