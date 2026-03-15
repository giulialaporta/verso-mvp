import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hashEmail } from "@/lib/hash-email";
import { motion, AnimatePresence } from "framer-motion";

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
  const dismissedRef = useRef(false);

  useEffect(() => {
    const prefs = getSavedPrefs();
    if (!prefs) setVisible(true);
  }, []);

  const dismiss = async () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;

    const prefs: CookiePrefs = {
      technical: true,
      analytics: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setVisible(false);

    // If authenticated, log to consent_logs
    if (user) {
      const userHash = user.email ? await hashEmail(user.email) : undefined;
      await supabase.from("consent_logs" as any).insert({
        user_id: user.id,
        user_hash: userHash,
        consent_type: "analytics_cookies",
        consent_version: "1.0",
        granted: false,
        user_agent: navigator.userAgent,
        method: "auto_dismiss",
        metadata: { technical: true, analytics: false },
      });
    }
  };

  // Auto-dismiss after 5s or on first scroll/click
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(dismiss, 5000);
    const handler = () => dismiss();

    document.addEventListener("scroll", handler, { once: true, passive: true });
    document.addEventListener("click", handler, { once: true });

    return () => {
      clearTimeout(timer);
      document.removeEventListener("scroll", handler);
      document.removeEventListener("click", handler);
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 inset-x-0 z-50 flex justify-center p-4 pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-[480px] rounded-xl border border-border bg-card/90 backdrop-blur-md px-4 py-3 shadow-lg">
            <p className="text-xs text-muted-foreground leading-relaxed text-center">
              Questo sito usa solo cookie tecnici necessari al funzionamento.{" "}
              <Link to="/cookie-policy" target="_blank" className="text-primary underline underline-offset-4 hover:text-primary/80">
                Cookie Policy
              </Link>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Reopen cookie banner (for settings page) */
export function resetCookieConsent() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getCookieConsent(): CookiePrefs | null {
  return getSavedPrefs();
}
