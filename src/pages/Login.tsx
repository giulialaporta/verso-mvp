import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AppleLogo } from "@phosphor-icons/react";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app/home" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Controlla la tua email per confermare la registrazione!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/app/home");
      }
    } catch (error: any) {
      toast.error(error.message || "Errore durante l'autenticazione");
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
      toast.error(error.message || "Errore durante l'invio dell'email di recupero");
    } finally {
      setSubmitting(false);
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

                <Button type="submit" className="w-full" disabled={submitting}>
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

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting
                  ? "Caricamento..."
                  : isSignUp
                    ? "Registrati"
                    : "Accedi"}
              </Button>
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
              className="w-full"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("apple", {
                  redirect_uri: window.location.origin,
                });
                if (error) toast.error(error.message);
              }}
            >
              <AppleLogo weight="fill" size={18} className="mr-2" />
              Continua con Apple
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
      </div>
    </div>
  );
}
