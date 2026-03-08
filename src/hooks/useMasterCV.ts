import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useMasterCV() {
  const { user } = useAuth();

  const active = useQuery({
    queryKey: ["masterCV", "active", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("master_cvs")
        .select("id, parsed_data, file_name, file_url, created_at, is_active, photo_url")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!user,
    staleTime: 60_000,
    gcTime: 300_000,
  });

  const inactive = useQuery({
    queryKey: ["masterCV", "inactive", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("master_cvs")
        .select("id, file_name, file_url, created_at, is_active")
        .eq("user_id", user!.id)
        .eq("is_active", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 60_000,
    gcTime: 300_000,
  });

  return { active, inactive };
}
