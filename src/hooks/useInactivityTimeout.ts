import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const EVENTS: (keyof WindowEventMap)[] = ["mousemove", "keydown", "click", "scroll", "touchstart", "focus"];

export function useInactivityTimeout(minutes = 30) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ms = minutes * 60 * 1000;

    const logout = () => {
      sessionStorage.setItem("inactivity_logout", "true");
      signOut().then(() => navigate("/login", { replace: true }));
    };

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(logout, ms);
    };

    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [minutes, signOut, navigate]);
}
