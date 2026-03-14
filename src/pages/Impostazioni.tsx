import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Trash, User, Warning, Lock, SignOut, ShieldCheck,
  Cookie, ArrowSquareOut, CheckCircle, XCircle, DownloadSimple, Headset, EnvelopeSimple,
} from "@phosphor-icons/react";
import { resetCookieConsent, getCookieConsent } from "@/components/CookieBanner";
import { hashEmail } from "@/lib/hash-email";

interface ConsentRecord {
  id: string;
  consent_type: string;
  consent_version: string;
  granted: boolean;
  granted_at: string;
  revoked_at: string | null;
}

const CONSENT_LABELS: Record<string, { label: string; description: string; revocable: boolean; consequence: string }> = {
  terms_and_privacy: {
    label: "Termini di Servizio e Privacy Policy",
    description: "Accettazione obbligatoria per utilizzare il servizio.",
    revocable: false,
    consequence: "",
  },
  sensitive_data: {
    label: "Trattamento dati sensibili (art. 9 GDPR)",
    description: "Consenso al trattamento di eventuali categorie particolari di dati nel tuo CV.",
    revocable: true,
    consequence: "Se revochi questo consenso, non potrai caricare o analizzare nuovi CV finché non lo riaccetti. I CV già generati restano disponibili.",
  },
  analytics_cookies: {
    label: "Cookie analitici",
    description: "Cookie per analisi anonime sull'utilizzo dell'app.",
    revocable: true,
    consequence: "Le preferenze cookie verranno ripristinate e il banner riapparirà alla prossima visita.",
  },
};

export default function Impostazioni() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loadingConsents, setLoadingConsents] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Load user consents
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("consent_logs")
        .select("id, consent_type, consent_version, granted, granted_at, revoked_at")
        .eq("user_id", user.id)
        .order("granted_at", { ascending: false });
      setConsents((data as ConsentRecord[]) ?? []);
      setLoadingConsents(false);
    })();
  }, [user]);

  // Get latest consent status per type
  const getConsentStatus = (type: string): { granted: boolean; date: string } | null => {
    const latest = consents.find((c) => c.consent_type === type);
    if (!latest) return null;
    return { granted: latest.granted, date: latest.granted_at };
  };

  const handleRevokeSensitiveData = async () => {
    if (!user) return;
    setRevoking("sensitive_data");
    try {
      const userHash = user.email ? await hashEmail(user.email) : undefined;
      await supabase.from("consent_logs").insert({
        user_id: user.id,
        user_hash: userHash,
        consent_type: "sensitive_data",
        consent_version: "1.0",
        granted: false,
        user_agent: navigator.userAgent,
        method: "settings_revoke",
        metadata: { screen: "impostazioni" },
      } as any);
      // Refresh consents
      const { data } = await supabase
        .from("consent_logs")
        .select("id, consent_type, consent_version, granted, granted_at, revoked_at")
        .eq("user_id", user.id)
        .order("granted_at", { ascending: false });
      setConsents((data as ConsentRecord[]) ?? []);
      toast({ title: "Consenso revocato", description: "Il consenso ai dati sensibili è stato revocato. Per caricare nuovi CV dovrai riaccettarlo." });
    } catch {
      toast({ title: "Errore", description: "Non è stato possibile revocare il consenso.", variant: "destructive" });
    } finally {
      setRevoking(null);
    }
  };

  const handleResetCookies = async () => {
    resetCookieConsent();
    toast({ title: "Preferenze cookie ripristinate", description: "Il banner cookie riapparirà alla prossima visita." });
    // Also log revocation
    if (user) {
      const userHash = user.email ? await hashEmail(user.email) : undefined;
      supabase.from("consent_logs").insert({
        user_id: user.id,
        user_hash: userHash,
        consent_type: "analytics_cookies",
        consent_version: "1.0",
        granted: false,
        user_agent: navigator.userAgent,
        method: "settings_reset",
        metadata: { screen: "impostazioni" },
      } as any);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [profileRes, cvsRes, appsRes, tailoredRes, consentsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id),
        supabase.from("master_cvs").select("*").eq("user_id", user.id),
        supabase.from("applications").select("*").eq("user_id", user.id),
        supabase.from("tailored_cvs").select("*").eq("user_id", user.id),
        supabase.from("consent_logs").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_email: user.email,
        profile: profileRes.data ?? [],
        master_cvs: cvsRes.data ?? [],
        applications: appsRes.data ?? [],
        tailored_cvs: tailoredRes.data ?? [],
        consent_logs: consentsRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `verso-dati-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Dati esportati", description: "Il file JSON è stato scaricato." });
    } catch {
      toast({ title: "Errore", description: "Non è stato possibile esportare i dati.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== "ELIMINA") return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const res = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;

      await signOut();
      navigate("/login", { replace: true });
      toast({ title: "Account eliminato", description: "Tutti i tuoi dati sono stati rimossi." });
    } catch (err) {
      console.error(err);
      toast({ title: "Errore", description: "Non è stato possibile eliminare l'account. Riprova.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const sensitiveStatus = getConsentStatus("sensitive_data");
  const cookiePrefs = getCookieConsent();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold tracking-tight">Impostazioni</h1>

      {/* Account info */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User size={20} weight="bold" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <p className="text-sm font-medium text-foreground">{user?.email ?? "—"}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Nome</label>
            <p className="text-sm font-medium text-foreground">
              {user?.user_metadata?.full_name || user?.user_metadata?.name || "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy e Dati */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck size={20} weight="bold" />
            Privacy e Dati
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Consensi list */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">I tuoi consensi</h3>

            {loadingConsents ? (
              <p className="text-sm text-muted-foreground">Caricamento...</p>
            ) : (
              <div className="space-y-3">
                {/* T&C + Privacy */}
                {(() => {
                  const s = getConsentStatus("terms_and_privacy");
                  return (
                    <ConsentRow
                      label={CONSENT_LABELS.terms_and_privacy.label}
                      description={CONSENT_LABELS.terms_and_privacy.description}
                      granted={s?.granted ?? false}
                      date={s?.date}
                      revocable={false}
                    />
                  );
                })()}

                {/* Sensitive data */}
                <ConsentRow
                  label={CONSENT_LABELS.sensitive_data.label}
                  description={CONSENT_LABELS.sensitive_data.description}
                  granted={sensitiveStatus?.granted ?? false}
                  date={sensitiveStatus?.date}
                  revocable={true}
                  consequence={CONSENT_LABELS.sensitive_data.consequence}
                  onRevoke={handleRevokeSensitiveData}
                  revoking={revoking === "sensitive_data"}
                />

                {/* Cookies */}
                <ConsentRow
                  label={CONSENT_LABELS.analytics_cookies.label}
                  description={CONSENT_LABELS.analytics_cookies.description}
                  granted={cookiePrefs?.analytics ?? false}
                  date={cookiePrefs?.timestamp}
                  revocable={true}
                  consequence={CONSENT_LABELS.analytics_cookies.consequence}
                  onRevoke={handleResetCookies}
                />
              </div>
            )}
          </div>

          {/* Export data */}
          <div className="border-t border-border pt-4 space-y-2">
            <h3 className="text-sm font-medium text-foreground">Portabilità dei dati (art. 20 GDPR)</h3>
            <p className="text-[12px] text-muted-foreground">
              Scarica tutti i tuoi dati in formato JSON strutturato: profilo, CV, candidature, consensi.
              Il file contiene tutti i tuoi dati personali — conservalo in modo sicuro.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={exporting}
              onClick={handleExportData}
            >
              <DownloadSimple size={16} />
              {exporting ? "Preparazione..." : "Esporta i miei dati"}
            </Button>
          </div>

          {/* Legal links */}
          <div className="border-t border-border pt-4 space-y-2">
            <h3 className="text-sm font-medium text-foreground">Documenti legali</h3>
            <div className="flex flex-wrap gap-3">
              <Link to="/termini" target="_blank" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 underline underline-offset-4">
                Termini di Servizio <ArrowSquareOut size={14} />
              </Link>
              <Link to="/privacy" target="_blank" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 underline underline-offset-4">
                Privacy Policy <ArrowSquareOut size={14} />
              </Link>
              <Link to="/cookie-policy" target="_blank" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 underline underline-offset-4">
                Cookie Policy <ArrowSquareOut size={14} />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assistenza */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Headset size={20} weight="bold" />
            Assistenza
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Hai bisogno di aiuto o vuoi esercitare i tuoi diritti privacy? Contattaci via email. Rispondiamo entro 48 ore lavorative.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="mailto:supporto@verso-cv.app"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 underline underline-offset-4"
            >
              <EnvelopeSimple size={16} /> supporto@verso-cv.app
            </a>
            <a
              href="mailto:privacy@verso-cv.app"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              <ShieldCheck size={16} /> privacy@verso-cv.app <span className="text-[11px] no-underline">(richieste GDPR)</span>
            </a>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock size={20} weight="bold" />
            Sicurezza
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            onClick={() => navigate("/reset-password")}
            className="w-full justify-start gap-2"
          >
            <Lock size={16} /> Cambia password
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-muted-foreground"
          >
            <SignOut size={16} /> Esci dall'account
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <Warning size={20} weight="bold" />
            Zona pericolosa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Eliminando il tuo account, tutti i tuoi dati verranno cancellati permanentemente: CV, candidature, dati personali. Questa azione è irreversibile.
          </p>
          <AlertDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setConfirmText(""); }}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash size={18} className="mr-2" />
                Elimina account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-border bg-background">
              <AlertDialogHeader>
                <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tutti i tuoi dati verranno eliminati permanentemente: CV caricati, CV adattati, candidature, profilo. Non potrai recuperarli. I log dei consensi prestati verranno anonimizzati e conservati per obblighi di legge.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Digita <span className="font-mono font-bold text-foreground">ELIMINA</span> per confermare
                </label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="ELIMINA"
                  className="font-mono"
                  autoComplete="off"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Annulla</AlertDialogCancel>
                <Button
                  variant="destructive"
                  disabled={confirmText !== "ELIMINA" || deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "Eliminazione..." : "Elimina definitivamente"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Version */}
      <p className="text-center text-[11px] font-mono text-muted-foreground pb-4">Verso v1.0</p>
    </div>
  );
}

/* ── Consent Row Component ── */

function ConsentRow({
  label,
  description,
  granted,
  date,
  revocable,
  consequence,
  onRevoke,
  revoking,
}: {
  label: string;
  description: string;
  granted: boolean;
  date?: string;
  revocable: boolean;
  consequence?: string;
  onRevoke?: () => void;
  revoking?: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-background/50 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            {granted ? (
              <CheckCircle size={16} weight="fill" className="text-primary shrink-0" />
            ) : (
              <XCircle size={16} weight="fill" className="text-muted-foreground shrink-0" />
            )}
            <span className="text-sm font-medium text-foreground">{label}</span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5 ml-[22px]">{description}</p>
          {date && (
            <p className="text-[11px] font-mono text-muted-foreground/60 mt-0.5 ml-[22px]">
              {granted ? "Accettato" : "Revocato"} il {new Date(date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        {revocable && granted && onRevoke && !showConfirm && (
          <Button
            variant="ghost"
            size="sm"
            className="text-[12px] text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => setShowConfirm(true)}
          >
            Revoca
          </Button>
        )}
      </div>

      {/* Consequence + confirm */}
      {showConfirm && consequence && (
        <div className="ml-[22px] rounded-md border border-warning/30 bg-warning/5 p-2.5 space-y-2">
          <p className="text-[12px] text-warning leading-relaxed flex items-start gap-1.5">
            <Warning size={14} weight="bold" className="shrink-0 mt-0.5" />
            {consequence}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-[12px] text-destructive hover:bg-destructive/10"
              onClick={() => {
                onRevoke?.();
                setShowConfirm(false);
              }}
              disabled={revoking}
            >
              {revoking ? "Revoca..." : "Conferma revoca"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-[12px] text-muted-foreground"
              onClick={() => setShowConfirm(false)}
            >
              Annulla
            </Button>
          </div>
        </div>
      )}

      {/* Not revocable notice */}
      {!revocable && (
        <p className="text-[11px] text-muted-foreground/50 ml-[22px]">
          Consenso obbligatorio — per revocarlo è necessario eliminare l'account.
        </p>
      )}
    </div>
  );
}
