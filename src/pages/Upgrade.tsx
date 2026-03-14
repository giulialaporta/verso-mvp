import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useApplications } from "@/hooks/useApplications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Briefcase, FileText, Sparkle, ArrowLeft, SpinnerGap, CheckCircle } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Upgrade() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: apps } = useApplications(1);
  const [loading, setLoading] = useState(false);

  const firstApp = apps?.[0];

  const isAlreadySubscribed = (payload: unknown) => {
    if (!payload) return false;
    if (typeof payload === "string") return payload.toLowerCase().includes("already subscribed");
    if (typeof payload === "object") {
      const value = payload as { error?: unknown; message?: unknown };
      return isAlreadySubscribed(value.error) || isAlreadySubscribed(value.message);
    }
    return false;
  };

  const handleCheckout = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");

      if (error) {
        let contextBody: unknown = null;
        const context = (error as { context?: unknown }).context;

        if (context instanceof Response) {
          try {
            contextBody = await context.clone().json();
          } catch {
            try {
              contextBody = await context.clone().text();
            } catch {
              contextBody = null;
            }
          }
        }

        if (isAlreadySubscribed(error) || isAlreadySubscribed(contextBody)) {
          toast.success("Sei già abbonata a Versō Pro!");
          navigate("/app/home");
          return;
        }

        throw error;
      }

      if (data?.already_subscribed || data?.error === "Already subscribed") {
        toast.success("Sei già abbonata a Versō Pro!");
        navigate("/app/home");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Checkout URL not available");
    } catch (e: unknown) {
      if (isAlreadySubscribed(e)) {
        toast.success("Sei già abbonata a Versō Pro!");
        navigate("/app/home");
        return;
      }
      toast.error("Errore durante il checkout");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Briefcase, text: "Candidature illimitate" },
    { icon: FileText, text: "Tutti i template CV" },
    { icon: Sparkle, text: "Priorità sulle nuove funzionalità" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="mx-auto max-w-md w-full space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate("/app/home")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Torna alla dashboard
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-warning/15 flex items-center justify-center">
            <Crown size={32} className="text-warning" weight="fill" />
          </div>
          <h1 className="font-display text-2xl font-bold">Hai raggiunto il limite</h1>
          <p className="text-muted-foreground text-sm">
            Con il piano Free puoi creare <span className="text-foreground font-medium">1 sola candidatura</span>.
            Per continuare, passa a Versō Pro.
          </p>
        </motion.div>

        {/* First application recap */}
        {firstApp && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/50 bg-card/60">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-bold text-muted-foreground uppercase">
                  {firstApp.company_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{firstApp.role_title}</p>
                  <p className="text-xs text-muted-foreground truncate">{firstApp.company_name}</p>
                </div>
                {firstApp.match_score !== null && (
                  <span className="font-mono text-xs font-bold text-primary">{firstApp.match_score}%</span>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pro benefits */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-primary/30 bg-card/80">
            <CardContent className="py-5 px-5 space-y-4">
              <div className="flex items-center gap-2">
                <Crown size={20} className="text-primary" weight="fill" />
                <span className="font-display text-lg font-bold">Versō Pro</span>
                <span className="ml-auto font-mono text-sm text-primary font-bold">€9,90/mese</span>
              </div>

              <div className="space-y-2.5">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-primary shrink-0" weight="fill" />
                    <span className="text-sm">{b.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full gap-2 h-12 text-base"
          >
            {loading ? (
              <><SpinnerGap size={18} className="animate-spin" /> Reindirizzamento...</>
            ) : (
              <><Crown size={18} weight="fill" /> Passa a Versō Pro</>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate("/app/home")}
            className="w-full text-muted-foreground"
          >
            Resta con il piano Free
          </Button>
        </motion.div>

        <p className="text-center text-[10px] text-muted-foreground">
          Puoi disdire in qualsiasi momento dalle impostazioni.
        </p>
      </div>
    </div>
  );
}
