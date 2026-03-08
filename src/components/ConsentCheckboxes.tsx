import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ConsentCheckboxesProps {
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  onTermsChange: (v: boolean) => void;
  onPrivacyChange: (v: boolean) => void;
}

export function ConsentCheckboxes({ acceptedTerms, acceptedPrivacy, onTermsChange, onPrivacyChange }: ConsentCheckboxesProps) {
  return (
    <div className="space-y-2 pt-4">
      <div className="flex items-start gap-2">
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onCheckedChange={(v) => onTermsChange(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor="terms" className="text-[13px] font-normal leading-snug text-muted-foreground cursor-pointer">
          Ho letto e accetto i{" "}
          <a href="/termini" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80">
            Termini e Condizioni d'Uso
          </a>
        </Label>
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="privacy"
          checked={acceptedPrivacy}
          onCheckedChange={(v) => onPrivacyChange(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor="privacy" className="text-[13px] font-normal leading-snug text-muted-foreground cursor-pointer">
          Ho letto l'
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80">
            Informativa Privacy
          </a>{" "}
          e acconsento al trattamento dei miei dati personali
        </Label>
      </div>
    </div>
  );
}

/** Save consent records after successful signup */
export async function saveRegistrationConsents(userId: string) {
  const now = new Date().toISOString();
  const common = {
    user_id: userId,
    granted: true,
    granted_at: now,
    user_agent: navigator.userAgent,
    method: "registration",
    metadata: { screen: "login_signup" },
    consent_version: "1.0",
  };

  await supabase.from("consent_logs" as any).insert([
    { ...common, consent_type: "terms" },
    { ...common, consent_type: "privacy" },
  ]);
}
