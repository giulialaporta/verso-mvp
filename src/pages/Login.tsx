import { useState, useEffect, useCallback } from "react";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AppleLogo } from "@phosphor-icons/react";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { saveRegistrationConsents } from "@/components/ConsentCheckboxes";

/** Map Supabase error messages to user-friendly Italian strings (non-revealing). */
function mapAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Email o password non corretti";
  if (lower.includes("email not confirmed")) return "Conferma la tua email prima di accedere";
  if (lower.includes("user already registered")) return "Controlla la tua email per completare la registrazione";
  if (lower.includes("signup is disabled")) return "La registrazione è temporaneamente disabilitata";
  if (lower.includes("rate limit")) return "Troppi tentativi. Riprova tra qualche minuto";
  if (lower.includes("password") && lower.includes("least")) return "La password deve avere almeno 6 caratteri";
  return "Errore durante l'autenticazione. Riprova.";
}

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const trackEvent = useTrackEvent();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // US-S10: Sanitize redirect — only allow internal /app/ paths
  const rawPath = (location.state as any)?.from?.pathname;
  const fromPath = rawPath && typeof rawPath === "string" && rawPath.startsWith("/app/") ? rawPath : "/app/home";

  // Save pending OAuth consents when user lands back after OAuth signup
  useEffect(() => {
    if (!user) return;
    const pending = localStorage.getItem("verso_pending_oauth_consents");
    if (!pending) return;
    localStorage.removeItem("verso_pending_oauth_consents");
    saveRegistrationConsents(user.id, user.email ?? "", "oauth_by_action").catch(() => {});
  }, [user]);

  // Redirect authenticated users imperatively (avoids Navigate ref warning)
  useEffect(() => {
    if (!loading && user) {
      navigate(fromPath, { replace: true });
    }
  }, [loading, user, fromPath, navigate]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Form validity: no consent checkboxes needed
  const isFormValid = isSignUp
    ? email.trim() !== "" && password.trim() !== "" && fullName.trim() !== ""
    : email.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        // Save consent records (by-action: registering = accepting T&C)
        if (data.user) {
          await saveRegistrationConsents(data.user.id, email, "registration_by_action");
        }
        toast.success("Controlla la tua email per confermare la registrazione!");
        trackEvent("signup_completed", { method: "email" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(fromPath);
      }
    } catch (error: any) {
      toast.error(mapAuthError(error.message || ""));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Email di recupero inviata! Controlla la tua casella di posta.");
      setIsForgot(false);
    } catch (error: any) {
      toast.error(mapAuthError(error.message || ""));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    if (oauthLoading) return;
    try {
      // Save pending consent flag before redirect
      if (isSignUp) {
        localStorage.setItem("verso_pending_oauth_consents", "true");
      }
      const { error } = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (error) {
        localStorage.removeItem("verso_pending_oauth_consents");
        toast.error(mapAuthError((error as any).message || ""));
      }
    } catch {
      localStorage.removeItem("verso_pending_oauth_consents");
      toast.error("Errore durante l'autenticazione. Riprova.");
    } finally {
      setOauthLoading(false);
    }
  };

  // Forgot password view
  if (isForgot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="font-display text-4xl font-extrabold tracking-tight">
              VERS<span className="text-primary">O</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Recupera la tua password
            </p>
          </div>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@esempio.com"
                    required
                  />
                </div>

                <Button type="submit" className="w-full active:scale-[0.98] transition-transform" disabled={submitting || email.trim() === ""}>
                  {submitting ? "Invio in corso..." : "Invia link di recupero"}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={() => setIsForgot(false)}
                >
                  Torna al login
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            VERS<span className="text-primary">O</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Il tuo CV, su misura
          </p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Mario Rossi"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@esempio.com"
                  required
                  pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                  title="Inserisci un indirizzo email valido"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                      onClick={() => setIsForgot(true)}
                    >
                      Password dimenticata?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full active:scale-[0.98] transition-transform" disabled={submitting || !isFormValid}>
                {submitting
                  ? "Caricamento..."
                  : isSignUp
                    ? "Registrati"
                    : "Accedi"}
              </Button>

              {/* Informative legal text for signup (replaces checkboxes) */}
              {isSignUp && (
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Creando un account accetti i{" "}
                  <Link to="/termini" target="_blank" className="text-primary underline underline-offset-4 hover:text-primary/80">
                    Termini e Condizioni
                  </Link>{" "}
                  e confermi di aver letto l'
                  <Link to="/privacy" target="_blank" className="text-primary underline underline-offset-4 hover:text-primary/80">
                    Informativa Privacy
                  </Link>.
                </p>
              )}
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">oppure</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full active:scale-[0.98] transition-transform"
              disabled={oauthLoading}
              onClick={() => handleOAuth("apple")}
            >
              <AppleLogo weight="fill" size={18} className="mr-2" />
              Continua con Apple
            </Button>

            <Button
              variant="outline"
              className="w-full mt-3 active:scale-[0.98] transition-transform"
              disabled={oauthLoading}
              onClick={() => handleOAuth("google")}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continua con Google
            </Button>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isSignUp ? "Hai già un account?" : "Non hai un account?"}{" "}
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? "Accedi" : "Registrati"}
              </button>
            </p>
          </CardContent>
        </Card>

        {/* Legal footer */}
        <div className="flex justify-center gap-4 mt-4">
          <Link to="/termini" target="_blank" className="text-xs text-muted-foreground/50 hover:text-muted-foreground underline-offset-4 hover:underline py-2">Termini</Link>
          <Link to="/privacy" target="_blank" className="text-xs text-muted-foreground/50 hover:text-muted-foreground underline-offset-4 hover:underline py-2">Privacy</Link>
          <Link to="/cookie-policy" target="_blank" className="text-xs text-muted-foreground/50 hover:text-muted-foreground underline-offset-4 hover:underline py-2">Cookie</Link>
        </div>
      </div>
    </div>
  );
}
