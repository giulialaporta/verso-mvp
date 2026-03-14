import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionState {
  isPro: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    subscriptionEnd: null,
    loading: true,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!session?.access_token) {
      setState({ isPro: false, subscriptionEnd: null, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      setState({
        isPro: data?.subscribed ?? false,
        subscriptionEnd: data?.subscription_end ?? null,
        loading: false,
      });
    } catch (e) {
      console.warn("check-subscription failed:", e);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [session?.access_token]);

  // Check on login and poll every 60s
  useEffect(() => {
    if (!user) {
      setState({ isPro: false, subscriptionEnd: null, loading: false });
      return;
    }

    refresh();

    intervalRef.current = setInterval(refresh, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, refresh]);

  return { ...state, refresh };
}
