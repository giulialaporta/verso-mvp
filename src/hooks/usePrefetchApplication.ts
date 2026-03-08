import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

/**
 * Returns a handler to prefetch application detail + tailored_cv on hover.
 * Attach to onMouseEnter / onFocus on application cards.
 */
export function usePrefetchApplication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useCallback(
    (applicationId: string) => {
      if (!user) return;

      queryClient.prefetchQuery({
        queryKey: ["application", applicationId],
        queryFn: async () => {
          const { data } = await supabase
            .from("applications")
            .select("*")
            .eq("id", applicationId)
            .eq("user_id", user.id)
            .single();
          return data;
        },
        staleTime: 30_000,
      });

      queryClient.prefetchQuery({
        queryKey: ["tailoredCV", applicationId],
        queryFn: async () => {
          const { data } = await supabase
            .from("tailored_cvs")
            .select("*")
            .eq("application_id", applicationId)
            .eq("user_id", user.id)
            .maybeSingle();
          return data;
        },
        staleTime: 30_000,
      });
    },
    [queryClient, user]
  );
}
