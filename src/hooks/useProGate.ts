import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TRIAL_MODE } from "@/hooks/useSubscription";

/**
 * Returns a function that checks if the user can create a new application.
 * Uses profiles.free_apps_used (lifetime counter, not decremented on delete).
 * Returns true if user can proceed, false if blocked.
 */
export function useProGate() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const checkCanCreate = useCallback(async (isPro: boolean): Promise<boolean> => {
    if (TRIAL_MODE) return true;
    if (isPro || !user) return true;

    const { data, error } = await supabase
      .from("profiles")
      .select("free_apps_used")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Pro gate check failed:", error);
      return true; // fail open
    }

    if ((data?.free_apps_used ?? 0) >= 1) {
      navigate("/upgrade");
      return false;
    }

    return true;
  }, [user, navigate]);

  return checkCanCreate;
}
