import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "verso_cookie_consent";

interface CookiePrefs {
  technical: boolean;
  analytics: boolean;
  timestamp: string;
}

function getSavedPrefs(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function CookieBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefs = getSavedPrefs();
    if (!prefs) setVisible(true);
  }, []);

  const saveChoice = async (analytics: boolean) => {
    const prefs: CookiePrefs = {
      technical: true,
      analytics,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setVisible(false);

    // If authenticated, also log to consent_logs
    if (user) {
      await supabase.from("consent_logs" as any).insert({
        user_id: user.id,
        consent_type: "analytics_cookies",
        consent_version: "1.0",
        granted: analytics,
        user_agent: navigator.userAgent,
        method: "cookie_banner",
        metadata: { technical: true, analytics },
      });
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-[560px] rounded-xl border border-border bg-card/95 backdrop-blur-md p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-2">
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Questo sito usa cookie tecnici necessari al funzionamento.
              Per saperne di più, consulta la nostra{" "}
              <Link to="/cookie-policy" target="_blank" className="text-primary underline underline-offset-4 hover:text-primary/80">
                Cookie Policy
              </Link>.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveChoice(false)}>
                Accetta necessari
              </Button>
            </div>
          </div>
          <button
            onClick={() => saveChoice(false)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Reopen cookie banner (for settings page) */
export function resetCookieConsent() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getCookieConsent(): CookiePrefs | null {
  return getSavedPrefs();
}
