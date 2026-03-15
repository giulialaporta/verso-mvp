import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget event tracking hook.
 * Events are sent to the track-event edge function (service_role insert).
 */
export function useTrackEvent() {
  return useCallback((eventName: string, eventData?: Record<string, unknown>) => {
    supabase.functions.invoke("track-event", {
      body: { event_name: eventName, event_data: eventData || {} },
    }).catch(() => {
      // Silently ignore — tracking should never break UX
    });
  }, []);
}
