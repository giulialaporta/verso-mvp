import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hashEmail } from "@/lib/hash-email";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SensitiveDataConsentProps {
  open: boolean;
  onConsent: () => void;
  onCancel: () => void;
}

export function SensitiveDataConsent({ open, onConsent, onCancel }: SensitiveDataConsentProps) {
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!accepted || !user) return;
    setSaving(true);
    try {
      const userHash = user.email ? await hashEmail(user.email) : undefined;
      await supabase.from("consent_logs" as any).insert({
        user_id: user.id,
        user_hash: userHash,
        consent_type: "sensitive_data",
        consent_version: "1.0",
        granted: true,
        user_agent: navigator.userAgent,
        method: "pre_upload_modal",
        metadata: { screen: "onboarding_upload" },
      });
      onConsent();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">Informativa sul trattamento del CV</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Il curriculum vitae che stai per caricare potrebbe contenere informazioni personali
                sensibili come stato di salute, convinzioni religiose o politiche, appartenenza
                sindacale o origine etnica.
              </p>
              <p>
                Questi dati saranno trattati esclusivamente per adattare il tuo CV agli annunci
                selezionati e non saranno utilizzati per altri scopi.
              </p>
              <p>
                Se non desideri che queste informazioni vengano elaborate, ti suggerisco di
                rimuoverle dal CV prima di caricarlo.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-start gap-2 py-2">
          <Checkbox
            id="sensitive-consent"
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-0.5"
          />
          <Label htmlFor="sensitive-consent" className="text-[13px] font-normal leading-snug text-muted-foreground cursor-pointer">
            Acconsento al trattamento delle eventuali categorie particolari di dati contenute nel mio CV (art. 9 GDPR)
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={handleContinue} disabled={!accepted || saving}>
            {saving ? "Salvataggio..." : "Continua"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Check if user already gave sensitive data consent */
export async function hasSensitiveDataConsent(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("consent_logs" as any)
    .select("id")
    .eq("user_id", userId)
    .eq("consent_type", "sensitive_data")
    .eq("granted", true)
    .limit(1);
  return (data?.length ?? 0) > 0;
}
