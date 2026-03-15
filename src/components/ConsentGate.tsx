import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { saveRegistrationConsents } from "@/components/ConsentCheckboxes";

type Status = "loading" | "missing" | "granted";

export function ConsentGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      const { data } = await supabase
        .from("consent_logs")
        .select("consent_type")
        .eq("user_id", user.id)
        .in("consent_type", ["terms", "privacy"])
        .eq("granted", true);

      const types = new Set((data ?? []).map((r: any) => r.consent_type));
      setStatus(types.has("terms") && types.has("privacy") ? "granted" : "missing");
    };

    check();
  }, [user]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "granted") {
    return <>{children}</>;
  }

  const handleAccept = async () => {
    if (!user || !accepted) return;
    setSubmitting(true);
    try {
      await saveRegistrationConsents(user.id, user.email ?? "", "post_login_gate");
      setStatus("granted");
    } catch {
      toast.error("Errore nel salvataggio dei consensi. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            VERS<span className="text-primary">O</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Prima di continuare, accetta i termini del servizio
          </p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Per utilizzare Verso devi accettare i nostri Termini e Condizioni e l'Informativa Privacy.
            </p>

            <div className="flex items-start gap-2">
              <Checkbox
                id="consent-gate"
                checked={accepted}
                onCheckedChange={(v) => setAccepted(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="consent-gate" className="text-[13px] font-normal leading-snug text-muted-foreground cursor-pointer">
                Ho letto e accetto i{" "}
                <Link to="/termini" target="_blank" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  Termini e Condizioni
                </Link>{" "}
                e l'
                <Link to="/privacy" target="_blank" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  Informativa Privacy
                </Link>
              </Label>
            </div>

            <Button
              className="w-full active:scale-[0.98] transition-transform"
              disabled={!accepted || submitting}
              onClick={handleAccept}
            >
              {submitting ? "Salvataggio..." : "Accetta e continua"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
