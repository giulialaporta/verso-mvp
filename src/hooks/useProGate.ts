import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns a function that checks if the user can create a new application.
 * If user is Free and has ≥1 active application → navigates to /upgrade.
 * Returns true if user can proceed, false if blocked.
 */
export function useProGate() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const checkCanCreate = useCallback(async (isPro: boolean): Promise<boolean> => {
    if (isPro || !user) return true;

    const { count, error } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("status", "eq", "ko");

    if (error) {
      console.error("Pro gate check failed:", error);
      return true; // fail open
    }

    if ((count ?? 0) >= 1) {
      navigate("/upgrade");
      return false;
    }

    return true;
  }, [user, navigate]);

  return checkCanCreate;
}
