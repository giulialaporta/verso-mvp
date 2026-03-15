import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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
  Briefcase,
  CaretDown,
  ArrowClockwise,
  PencilSimple,
  Crown,
  DownloadSimple,
  SpinnerGap,
  Camera,
  Plus,
} from "@phosphor-icons/react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import type { AppRowWithAts } from "@/types/application";
import { useProfile } from "@/hooks/useProfile";
import { useApplications } from "@/hooks/useApplications";
import { useMasterCV } from "@/hooks/useMasterCV";
import { usePrefetchApplication } from "@/hooks/usePrefetchApplication";
import { useSubscription } from "@/hooks/useSubscription";
import { useProGate } from "@/hooks/useProGate";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";

import { StatusChip } from "@/components/StatusChip";
import { MatchScoreCompact } from "@/components/MatchScore";

type MasterCV = {
  id: string;
  parsed_data?: any;
  file_name: string | null;
  file_url: string | null;
  created_at: string;
  is_active: boolean;
  photo_url?: string | null;
};
// ─── Compact Headline (AI-powered with cache) ───────────────
function useCompactHeadline(role: string, company: string) {
  const [headline, setHeadline] = useState("");

  useEffect(() => {
    if (!role && !company) { setHeadline(""); return; }

    const cacheKey = `verso_headline_${role}_${company}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setHeadline(cached); return; }

    // Immediate fallback while AI loads
    const fallback = (role.length > 35 ? role.slice(0, 32) + "…" : role) + (company ? ` @${company}` : "");
    setHeadline(fallback);

    supabase.functions.invoke("compact-headline", {
      body: { role, company },
    }).then(({ data, error }) => {
      if (!error && data?.headline) {
        setHeadline(data.headline);
        localStorage.setItem(cacheKey, data.headline);
      }
    }).catch(() => { /* keep fallback */ });
  }, [role, company]);

  return headline;
}

// ─── Hero Section ────────────────────────────────────────────
function HeroSection({
  name,
  headline,
  avatarUrl,
  avgMatchScore,
  activeCount,
  totalCount,
  isPro,
  cancelAtPeriodEnd,
  onAvatarClick,
  onNewApp,
}: {
  name: string;
  headline: string;
  avatarUrl: string | null;
  avgMatchScore: number | null;
  activeCount: number;
  totalCount: number;
  isPro: boolean;
  cancelAtPeriodEnd: boolean;
  onAvatarClick: () => void;
  onNewApp: () => void;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const imgSrc = avatarUrl || null;

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-card via-card to-secondary/30 p-6 sm:p-8 overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start gap-5">
        {/* Avatar */}
        <button
          onClick={onAvatarClick}
          className="relative group shrink-0"
          aria-label="Cambia foto profilo"
        >
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-2 ring-border group-hover:ring-primary/50 transition-all">
            {imgSrc ? (
              <AvatarImage src={imgSrc} alt={name} />
            ) : null}
            <AvatarFallback className="bg-muted text-muted-foreground font-display text-lg font-bold">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={20} className="text-foreground" />
          </div>
        </button>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight line-clamp-1">
              {name.split(" ")[0] || "Ciao"}
            </h1>
            {/* Plan badge */}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                isPro
                  ? cancelAtPeriodEnd
                    ? "bg-warning/15 text-warning"
                    : "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Crown size={10} weight="fill" />
              {isPro ? (cancelAtPeriodEnd ? "Pro ⏳" : "Pro") : "Free"}
            </span>
          </div>
          {headline && (
            <p className={`${headline.length > 35 ? 'text-xs' : 'text-sm'} text-muted-foreground mt-0.5 line-clamp-1`}>{headline}</p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {avgMatchScore !== null && (
              <div className="flex items-center gap-1.5">
                <ChartLineUp size={14} className="text-primary" />
                <span className="font-mono text-lg font-bold text-foreground">{avgMatchScore}%</span>
                <span className="text-[11px] text-muted-foreground">match</span>
              </div>
            )}
            {totalCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Briefcase size={14} className="text-muted-foreground" />
                <span className="font-mono text-sm font-medium text-foreground">{activeCount}</span>
                <span className="text-[11px] text-muted-foreground">attive · {totalCount} totali</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.25 }}
        className="mt-6"
      >
        <Button
          onClick={onNewApp}
          className="w-full gap-2 h-12 text-base rounded-full"
        >
          <Plus size={18} weight="bold" /> Nuova candidatura <ArrowRight size={18} />
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Recent Applications (horizontal) ───────────────────────
function RecentApps({ apps }: { apps: AppRowWithAts[] }) {
  const navigate = useNavigate();
  const prefetch = usePrefetchApplication();

  if (apps.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Candidature recenti</h2>
        <button
          onClick={() => navigate("/app/candidature")}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          Vedi tutte <ArrowRight size={12} />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1 scrollbar-none">
        {apps.map((app, i) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.2 }}
            className="snap-start shrink-0 w-[200px]"
          >
            <div
              className="rounded-xl border border-border/30 bg-card/60 p-3.5 cursor-pointer hover:border-primary/40 transition-colors h-full"
              onClick={() => navigate(`/app/candidatura/${app.id}`)}
              onMouseEnter={() => prefetch(app.id)}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-bold text-muted-foreground uppercase">
                  {app.company_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate leading-tight">{app.role_title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{app.company_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MatchScoreCompact
                  matchScore={app.match_score}
                  isHonest={((app as any).honest_score ?? 0) >= 85}
                />
                <StatusChip status={app.status} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── CV Snapshot ─────────────────────────────────────────────
function CVSnapshot({
  cv,
  onDelete,
  deleting,
}: {
  cv: MasterCV;
  onDelete: () => void;
  deleting: boolean;
}) {
  const navigate = useNavigate();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const skills: string[] = cv.parsed_data?.skills?.technical?.slice(0, 5) ?? [];

  const handleDownloadCV = useCallback(async () => {
    if (!cv.parsed_data) return;
    setDownloadingPdf(true);
    try {
      const [{ pdf }, { ClassicoTemplate }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/cv-templates"),
      ]);
      const blob = await pdf(<ClassicoTemplate cv={cv.parsed_data} />).toBlob();
      const name = cv.parsed_data?.personal?.name || "CV";
      const fileName = `CV-${name.replace(/\s+/g, "-")}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF scaricato!");
    } catch (e) {
      console.error("PDF generation error:", e);
      toast.error("Errore durante la generazione del PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  }, [cv]);

  const uploadDate = new Date(cv.created_at).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-bold">Il tuo CV</h2>
      <div className="rounded-xl border border-border/30 bg-card/60 p-4 space-y-3">
        {/* File info row */}
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {cv.parsed_data?.personal?.name || cv.file_name || "Il tuo CV"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Caricato il {uploadDate}
            </p>
          </div>
          <button
            onClick={() => navigate("/app/cv-edit")}
            className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 shrink-0"
          >
            <PencilSimple size={14} /> Modifica
          </button>
        </div>

        {/* Skills chips */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/30">
          <button
            onClick={() => navigate("/onboarding")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <UploadSimple size={14} /> Carica nuovo
          </button>
          {cv.parsed_data && (
            <button
              onClick={handleDownloadCV}
              disabled={downloadingPdf}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 ml-auto"
            >
              {downloadingPdf ? (
                <><SpinnerGap size={14} className="animate-spin" /> Generazione...</>
              ) : (
                <><DownloadSimple size={14} /> Scarica PDF</>
              )}
            </button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 ml-2">
                <Trash size={14} /> Archivia
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archiviare il CV?</AlertDialogTitle>
                <AlertDialogDescription>
                  Il CV verrà archiviato e potrai riattivarlo in qualsiasi momento dallo storico.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Eliminazione..." : "Archivia"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

// ─── Virgin State ────────────────────────────────────────────
function VirginState() {
  const navigate = useNavigate();

  const steps = [
    { num: 1, icon: FileArrowUp, title: "Carica il tuo CV", desc: "Il punto di partenza. Verso lo analizza e ne estrae i dati.", locked: false },
    { num: 2, icon: MagicWand, title: "Incolla un annuncio", desc: "Verso adatta il tuo CV alla posizione, automaticamente.", locked: true },
    { num: 3, icon: Funnel, title: "Monitora le candidature", desc: "Tieni traccia di ogni application nel tuo funnel.", locked: true },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="font-display text-3xl font-bold">Benvenuto su Verso</h1>
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
            <div className={`rounded-xl border p-5 flex items-start gap-4 transition-all ${step.locked ? "opacity-50 bg-card/40 border-border/50" : "bg-card/80 border-primary/30"}`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${step.locked ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}>
                {step.locked ? <Lock size={16} /> : step.num}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <step.icon size={18} className={step.locked ? "text-muted-foreground" : "text-primary"} />
                  <p className="font-medium text-sm">{step.title}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.3 }}>
        <Button onClick={() => navigate("/onboarding")} className="w-full gap-2 h-12 text-base rounded-full">
          Carica il tuo CV <ArrowRight size={18} />
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const { isPro, loading: subLoading, refresh: refreshSubscription, cancelAtPeriodEnd, subscriptionEnd } = useSubscription();
  const checkCanCreate = useProGate();
  const { upload: uploadAvatar, uploading: avatarUploading } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle post-upgrade success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "success") {
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await refreshSubscription();
        if (attempts >= 3) {
          clearInterval(poll);
          toast.success("Benvenuto in Verso Pro! 🎉");
          navigate("/app/home", { replace: true });
        }
      }, 2000);
      return () => clearInterval(poll);
    }
  }, [refreshSubscription, navigate]);

  // React Query hooks
  const { data: profile } = useProfile();
  const { data: apps } = useApplications(5);
  const { active: activeCvQuery, inactive: inactiveCvQuery } = useMasterCV();

  const cv = activeCvQuery.data;
  const inactiveCvs = inactiveCvQuery.data ?? [];
  const profileName = profile?.full_name || "";
  const avatarUrl = (profile as any)?.avatar_url || null;

  const handleDelete = async () => {
    if (!cv || !user) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("master_cvs")
        .update({ is_active: false } as any)
        .eq("id", cv.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["masterCV"] });
      toast.success("CV archiviato.");
    } catch (e: any) {
      toast.error(e.message || "Errore durante l'archiviazione.");
    } finally {
      setDeleting(false);
    }
  };

  const invalidateCVs = () => queryClient.invalidateQueries({ queryKey: ["masterCV"] });

  const handleReactivate = async (oldCv: MasterCV) => {
    if (!user) return;
    try {
      if (cv) {
        await supabase.from("master_cvs").update({ is_active: false } as any).eq("id", cv.id);
      }
      const { error } = await supabase.from("master_cvs").update({ is_active: true } as any).eq("id", oldCv.id);
      if (error) throw error;
      invalidateCVs();
      toast.success("CV riattivato.");
    } catch (e: any) {
      toast.error(e.message || "Errore durante la riattivazione.");
    }
  };

  const handleHardDelete = async (oldCv: MasterCV) => {
    try {
      if (oldCv.file_url) {
        await supabase.storage.from("cv-uploads").remove([oldCv.file_url]);
      }
      const { error } = await supabase.from("master_cvs").delete().eq("id", oldCv.id);
      if (error) throw error;
      invalidateCVs();
      toast.success("CV eliminato definitivamente.");
    } catch (e: any) {
      toast.error(e.message || "Errore durante l'eliminazione.");
    }
  };

  const isLoading = activeCvQuery.isLoading || !apps;
  const hasCV = cv !== null && cv !== undefined;
  const activeApps = useMemo(
    () => (apps ?? []).filter((a) => !["ko", "draft"].includes(a.status.toLowerCase())),
    [apps]
  );
  const hasApplications = activeApps.length > 0;
  const avgMatchScore = useMemo(() => {
    const scores = (apps ?? []).map((a) => a.match_score).filter((s): s is number => s !== null);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  }, [apps]);
  const recentApps = useMemo(() => (apps ?? []).filter((a) => !["draft"].includes(a.status.toLowerCase())).slice(0, 5), [apps]);

  // Build headline from CV data (AI-powered)
  const parsedData = cv?.parsed_data as any;
  const heroRole = useMemo(() => {
    const exp = parsedData?.experience?.[0];
    return exp?.role || exp?.title || "";
  }, [parsedData]);
  const heroCompany = useMemo(() => {
    const exp = parsedData?.experience?.[0];
    return exp?.company || "";
  }, [parsedData]);
  const headline = useCompactHeadline(heroRole, heroCompany);

  // Redirect to onboarding if user has apps but no CV
  useEffect(() => {
    if (!isLoading && !hasCV && hasApplications) {
      navigate("/onboarding");
    }
  }, [isLoading, hasCV, hasApplications, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-6 px-4 sm:px-0">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!hasCV && !hasApplications) return <VirginState />;
  if (!hasCV && hasApplications) return null;

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 sm:px-0">
      {/* Hidden file input for avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadAvatar(file);
          e.target.value = "";
        }}
      />

      {/* Hero */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <HeroSection
          name={profileName || parsedData?.personal?.name || ""}
          headline={headline}
          avatarUrl={avatarUrl}
          avgMatchScore={avgMatchScore}
          activeCount={activeApps.length}
          totalCount={(apps ?? []).length}
          isPro={isPro}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
          onAvatarClick={() => fileInputRef.current?.click()}
          onNewApp={async () => {
            const canCreate = await checkCanCreate(isPro);
            if (canCreate) navigate("/app/nuova");
          }}
        />
      </motion.div>

      {/* Recent Applications */}
      {recentApps.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.25 }}>
          <RecentApps apps={recentApps} />
        </motion.div>
      )}

      {/* CV Snapshot */}
      {hasCV && cv && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.25 }}>
          <CVSnapshot cv={cv} onDelete={handleDelete} deleting={deleting} />
        </motion.div>
      )}

      {/* CV precedenti */}
      {inactiveCvs.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.25 }}>
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2">
              <FileText size={16} />
              <span>CV precedenti ({inactiveCvs.length})</span>
              <CaretDown size={14} className="ml-auto" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 mt-2">
                {inactiveCvs.map((oldCv) => (
                  <div key={oldCv.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/60 px-3 py-2.5">
                    <FileText size={18} className="text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{oldCv.file_name || "CV"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(oldCv.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => handleReactivate(oldCv)}>
                        <ArrowClockwise size={14} /> Riattiva
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                            <Trash size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminare definitivamente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Questo CV verrà eliminato permanentemente. Le candidature associate manterranno i loro dati.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleHardDelete(oldCv)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>
      )}
    </div>
  );
}
