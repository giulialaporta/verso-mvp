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
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    const token = session?.access_token;
    if (!user || !token) {
      setState({ isPro: false, subscriptionEnd: null, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!mountedRef.current) return;

      if (error) {
        // Treat as non-fatal — user simply isn't Pro
        console.warn("check-subscription error (non-fatal):", error);
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      setState({
        isPro: data?.subscribed ?? false,
        subscriptionEnd: data?.subscription_end ?? null,
        loading: false,
      });
    } catch (e) {
      if (!mountedRef.current) return;
      console.warn("check-subscription failed (non-fatal):", e);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [user, session?.access_token]);

  useEffect(() => {
    mountedRef.current = true;

    if (!user || !session?.access_token) {
      setState({ isPro: false, subscriptionEnd: null, loading: false });
      return;
    }

    refresh();
    intervalRef.current = setInterval(refresh, 60_000);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, session?.access_token, refresh]);

  return { ...state, refresh };
}
