import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowRight,
  UploadSimple,
  Trash,
  FileText,
  FileArrowUp,
  MagicWand,
  Funnel,
  Lock,
  ChartLineUp,
  CheckCircle,
  Briefcase,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CVSections } from "@/components/CVSections";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { ParsedCV } from "@/types/cv";

type MasterCV = {
  id: string;
  parsed_data: ParsedCV | null;
  file_name: string | null;
  file_url: string | null;
};

type AppRow = {
  id: string;
  company_name: string;
  role_title: string;
  match_score: number | null;
  ats_score: number | null;
  status: string;
  created_at: string;
};

import { StatusChip } from "@/components/StatusChip";

// ─── Stats Bar ───────────────────────────────────────────────
function StatsBar({
  activeCount,
  avgScore,
  hasCV,
}: {
  activeCount: number;
  avgScore: number | null;
  hasCV: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        {
          icon: Briefcase,
          label: "Attive",
          value: String(activeCount),
          accent: activeCount > 0,
        },
        {
          icon: ChartLineUp,
          label: "Score",
          value: avgScore !== null ? `${avgScore}%` : "—",
          accent: avgScore !== null && avgScore >= 70,
        },
        {
          icon: FileText,
          label: "CV",
          value: hasCV ? "OK" : "—",
          accent: hasCV,
        },
      ].map((stat) => (
        <Card key={stat.label} className="border-border/40 bg-card/60">
          <CardContent className="flex flex-col items-center gap-1 py-3 px-1 sm:py-4 sm:px-2">
            <stat.icon
              size={20}
              className={stat.accent ? "text-primary" : "text-muted-foreground"}
            />
            <span
              className={`font-mono text-xl font-bold ${
                stat.accent ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {stat.value}
            </span>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono">
              {stat.label}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Virgin State ────────────────────────────────────────────
function VirginState() {
  const navigate = useNavigate();

  const steps = [
    {
      num: 1,
      icon: FileArrowUp,
      title: "Carica il tuo CV",
      desc: "Il punto di partenza. Verso lo analizza e ne estrae i dati.",
      locked: false,
    },
    {
      num: 2,
      icon: MagicWand,
      title: "Incolla un annuncio",
      desc: "Verso adatta il tuo CV alla posizione, automaticamente.",
      locked: true,
    },
    {
      num: 3,
      icon: Funnel,
      title: "Monitora le candidature",
      desc: "Tieni traccia di ogni application nel tuo funnel.",
      locked: true,
    },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="font-display text-3xl font-bold">
          Benvenuto su Verso
        </h1>
        <p className="mt-1 text-muted-foreground">
          Il tuo CV, alla sua versione migliore. Ecco come funziona.
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.3 }}
          >
            <Card
              className={`border-border/50 transition-all ${
                step.locked
                  ? "opacity-50 bg-card/40"
                  : "bg-card/80 border-primary/30"
              }`}
            >
              <CardContent className="flex items-start gap-4 py-5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${
                    step.locked
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {step.locked ? <Lock size={16} /> : step.num}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <step.icon
                      size={18}
                      className={step.locked ? "text-muted-foreground" : "text-primary"}
                    />
                    <p className="font-medium text-sm">{step.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <Button
          onClick={() => navigate("/onboarding")}
          className="w-full gap-2 h-12 text-base"
        >
          Carica il tuo CV <ArrowRight size={18} />
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Recent Applications ─────────────────────────────────────
function RecentApplications({ apps }: { apps: AppRow[] }) {
  const navigate = useNavigate();

  if (apps.length === 0) return null;

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Ultime candidature
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {apps.map((app) => (
          <div
            key={app.id}
            className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/60 px-3 py-2.5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-bold text-muted-foreground uppercase">
              {app.company_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{app.role_title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {app.company_name}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {app.match_score !== null && (
                <span className="font-mono text-xs font-bold text-primary">
                  {app.match_score}%
                </span>
              )}
              {(app as any).ats_score !== null && (app as any).ats_score !== undefined && (
                <span className="font-mono text-xs font-bold text-secondary">
                  ATS {(app as any).ats_score}%
                </span>
              )}
            </div>
            <StatusChip status={app.status} />
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-2 text-muted-foreground"
          onClick={() => navigate("/app/candidature")}
        >
          Vedi tutte <ArrowRight size={14} />
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── CV Card (collapsible) ───────────────────────────────────
function CVCard({
  cv,
  onDelete,
  deleting,
}: {
  cv: MasterCV;
  onDelete: () => void;
  deleting: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          <CardTitle className="text-sm font-medium">
            {cv.parsed_data?.personal?.name || "Il tuo CV"}
          </CardTitle>
        </div>
        {cv.parsed_data?.experience?.[0] ? (
          <p className="text-xs text-muted-foreground mt-1">
            {cv.parsed_data.experience[0].role || (cv.parsed_data.experience[0] as any).title} · {cv.parsed_data.experience[0].company}
          </p>
        ) : !cv.parsed_data?.personal?.name && cv.file_name ? (
          <p className="font-mono text-xs text-muted-foreground break-all mt-1">
            {cv.file_name}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {cv.parsed_data ? (
          <CVSections data={cv.parsed_data} collapsible />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nessun dato estratto disponibile.
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-2 border-t border-border/50">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash size={16} /> Elimina CV
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminare il CV?</AlertDialogTitle>
                <AlertDialogDescription>
                  Il tuo CV e tutti i dati estratti verranno eliminati
                  permanentemente. Potrai caricarne uno nuovo in qualsiasi
                  momento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Eliminazione..." : "Elimina"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/onboarding")}
            className="gap-2"
          >
            <UploadSimple size={16} /> Carica nuovo CV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cv, setCv] = useState<MasterCV | null | undefined>(undefined);
  const [apps, setApps] = useState<AppRow[] | undefined>(undefined);
  const [profileName, setProfileName] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [{ data: profile }, { data: cvs }, { data: appRows }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("master_cvs")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("applications")
            .select("id, company_name, role_title, match_score, ats_score, status, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

      setProfileName(profile?.full_name || "");
      setCv(cvs && cvs.length > 0 ? (cvs[0] as unknown as MasterCV) : null);
      setApps((appRows as unknown as AppRow[]) ?? []);
    };

    fetchData();
  }, [user]);

  const handleDelete = async () => {
    if (!cv || !user) return;
    setDeleting(true);
    try {
      if (cv.file_url) {
        await supabase.storage.from("cv-uploads").remove([cv.file_url]);
      }
      const { error } = await supabase
        .from("master_cvs")
        .delete()
        .eq("id", cv.id);
      if (error) throw error;
      setCv(null);
      toast.success("CV eliminato con successo.");
    } catch (e: any) {
      toast.error(e.message || "Errore durante l'eliminazione.");
    } finally {
      setDeleting(false);
    }
  };

  const firstName = profileName?.split(" ")[0] || "utente";
  const isLoading = cv === undefined || apps === undefined;
  const hasCV = cv !== null && cv !== undefined;
  const activeApps = useMemo(
    () => (apps ?? []).filter((a) => !["ko", "draft"].includes(a.status.toLowerCase())),
    [apps]
  );
  const hasApplications = activeApps.length > 0;
  const avgScore = useMemo(() => {
    const scored = (apps ?? []).filter((a) => a.match_score !== null);
    if (scored.length === 0) return null;
    return Math.round(
      scored.reduce((sum, a) => sum + (a.match_score ?? 0), 0) / scored.length
    );
  }, [apps]);
  const recentApps = useMemo(() => (apps ?? []).slice(0, 3), [apps]);

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-6 px-4 sm:px-0">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // Virgin state — no CV, no apps
  if (!hasCV && !hasApplications) {
    return <VirginState />;
  }

  // Dashboard states (CV-only or full)
  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">
          Ciao, {firstName} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          {hasApplications
            ? `Hai ${activeApps.length} candidatur${activeApps.length === 1 ? "a attiva" : "e attive"}.`
            : "Il tuo CV è pronto. Crea la tua prima candidatura."}
        </p>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <StatsBar
          activeCount={activeApps.length}
          avgScore={avgScore}
          hasCV={hasCV}
        />
      </motion.div>

      {/* CTA */}
      <Button
        onClick={() => navigate("/app/nuova")}
        className="w-full gap-2 h-12 text-base"
      >
        Nuova candidatura <ArrowRight size={18} />
      </Button>

      {/* Recent Applications */}
      {hasApplications && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
        >
          <RecentApplications apps={recentApps} />
        </motion.div>
      )}

      {/* CV Card */}
      {hasCV && cv && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.25 }}
        >
          <CVCard cv={cv} onDelete={handleDelete} deleting={deleting} />
        </motion.div>
      )}

      {/* No CV fallback (shouldn't normally happen in this branch) */}
      {!hasCV && (
        <Card className="border-border/50 bg-card/80">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <UploadSimple size={32} className="text-primary" />
            <p className="text-center text-foreground text-sm">
              Carica il tuo CV per adattarlo alle offerte.
            </p>
            <Button
              onClick={() => navigate("/onboarding")}
              variant="outline"
              className="gap-2"
            >
              Carica CV <ArrowRight size={16} />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
