import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRowWithAts } from "@/types/application";

export function useApplications(limit?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["applications", user?.id, limit],
    queryFn: async () => {
      let query = supabase
        .from("applications")
        .select("id, company_name, role_title, match_score, status, created_at, notes, tailored_cvs(ats_score, honest_score)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((d: any) => ({
        ...d,
        ats_score: d.tailored_cvs?.[0]?.ats_score ?? null,
      })) as AppRowWithAts[];
    },
    enabled: !!user,
    staleTime: 30_000,
    gcTime: 300_000,
  });
}
