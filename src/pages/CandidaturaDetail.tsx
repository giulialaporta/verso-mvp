import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  ArrowLeft,
  CalendarBlank,
  ChartLineUp,
  FloppyDisk,
  DownloadSimple,
  Trash,
  Target,
  ShieldWarning,
  Eye,
  CaretDown,
  GraduationCap,
} from "@phosphor-icons/react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { StatusChip, STATUS_STYLES } from "@/components/StatusChip";
import { CVSections } from "@/components/CVSections";
import { ExportDrawer } from "@/components/ExportDrawer";
import { toast } from "sonner";
import type { ParsedCV } from "@/types/cv";

const STATUSES = ["pronta", "inviata", "visualizzata", "contattato", "colloquio", "offerta", "ko"] as const;

const STATUS_ICONS: Record<string, { icon: typeof Target; label: string }> = {
  pronta: { icon: Target, label: "Pronta" },
  inviata: { icon: ArrowLeft, label: "Inviata" },
  visualizzata: { icon: Eye, label: "Vista" },
  contattato: { icon: ChartLineUp, label: "Contattato" },
  colloquio: { icon: ArrowLeft, label: "Colloquio" },
  offerta: { icon: ChartLineUp, label: "Offerta" },
  ko: { icon: ShieldWarning, label: "KO" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CandidaturaDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<any>(null);
  const [tailored, setTailored] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    Promise.all([
      supabase
        .from("applications")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("tailored_cvs")
        .select("*")
        .eq("application_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]).then(([{ data: appData }, { data: tcData }]) => {
      setApp(appData);
      setTailored(tcData);
      setStatus(appData?.status?.toLowerCase() || "");
      setNotes(appData?.notes || "");
      setLoading(false);
    });
  }, [user, id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!app || newStatus === status) return;
    setStatus(newStatus);
    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus } as any)
      .eq("id", app.id);
    if (error) {
      toast.error("Errore durante il salvataggio.");
      setStatus(status); // revert
    } else {
      toast.success("Stato aggiornato.");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    }
  };

  const handleNotesBlur = async () => {
    if (!app) return;
    const { error } = await supabase
      .from("applications")
      .update({ notes: notes || null } as any)
      .eq("id", app.id);
    if (error) {
      toast.error("Errore nel salvataggio note.");
    } else {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    }
  };

  const handleDelete = async () => {
    if (!app) return;
    setDeleting(true);
    try {
      if (tailored?.pdf_url) {
        await supabase.storage.from("cv-exports").remove([tailored.pdf_url]);
      }
      await supabase.from("tailored_cvs").delete().eq("application_id", app.id);
      await supabase.from("applications").delete().eq("id", app.id);
      toast.success("Candidatura eliminata.");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      navigate("/app/candidature", { replace: true });
    } catch {
      toast.error("Errore durante l'eliminazione.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4">
        {/* Header skeleton */}
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
        {/* Score cards skeleton */}
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        {/* ATS section skeleton */}
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="mx-auto max-w-2xl px-4 text-center space-y-4 pt-12">
        <p className="text-muted-foreground">Candidatura non trovata.</p>
        <Button variant="outline" onClick={() => navigate("/app/candidature")}>Torna alle candidature</Button>
      </div>
    );
  }

  const matchScore = app.match_score;
  const atsScore = tailored?.ats_score ?? null;
  const diff = tailored?.diff as any[] | null;
  const tailoredData = tailored?.tailored_data as ParsedCV | null;
  const atsChecks = tailored?.ats_checks as any[] | null;
  const honestScore = tailored?.honest_score as any;
  const skillsMatch = tailored?.skills_match as any;
  const seniorityMatch = tailored?.seniority_match as any;
  const scoreNote = (tailored as any)?.score_note as string | null;
  const learningSuggestions = (tailored as any)?.learning_suggestions as any[] | null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate("/app/candidature")} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Torna alle candidature">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold break-words">{app.role_title}</h1>
          <p className="text-muted-foreground">{app.company_name}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="inline-flex items-center gap-1">
              <CalendarBlank size={12} /> {formatDate(app.created_at)}
            </span>
            <StatusChip status={status} />
          </div>
        </div>
      </div>

      {/* Status Grid — prominente, subito dopo header */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {STATUSES.map((s) => {
          const style = STATUS_STYLES[s] ?? STATUS_STYLES.draft;
          const isActive = status === s;
          return (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`rounded-xl py-3 px-2 font-mono text-[11px] uppercase tracking-wider transition-all min-h-[48px] flex items-center justify-center gap-1.5 ${
                isActive
                  ? `${style.bg} ${style.text} ring-2 ring-current font-bold`
                  : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      {(matchScore !== null || atsScore !== null) && (
        <div className="grid grid-cols-2 gap-3">
          {matchScore !== null && (
            <Card className="border-border/50 bg-card/80">
              <CardContent className="py-4 text-center space-y-1">
                <p className="text-[11px] font-mono text-muted-foreground uppercase">Match</p>
                <p className="font-mono text-2xl font-bold text-primary">{matchScore}%</p>
                <div className="h-2 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={matchScore} aria-valuemin={0} aria-valuemax={100} aria-label={`Match score ${matchScore}%`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-destructive via-warning to-primary" style={{ width: `${matchScore}%` }} />
                </div>
              </CardContent>
            </Card>
          )}
          {atsScore !== null && (
            <Card className="border-border/50 bg-card/80">
              <CardContent className="py-4 text-center space-y-1">
                <p className="text-[11px] font-mono text-muted-foreground uppercase">ATS</p>
                <p className="font-mono text-2xl font-bold text-info">{atsScore}%</p>
                <div className="h-2 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={atsScore} aria-valuemin={0} aria-valuemax={100} aria-label={`ATS score ${atsScore}%`}>
                  <div className="h-full rounded-full bg-info" style={{ width: `${atsScore}%` }} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Score Note */}
      {scoreNote && (
         <Card className="border-border/50 bg-card/80 overflow-hidden">
           <CardContent className="py-4">
             <p className="text-sm text-muted-foreground break-words">{scoreNote}</p>
          </CardContent>
        </Card>
      )}

      {atsChecks && atsChecks.length > 0 && (
        <Card className="border-border/50 bg-card/80 overflow-hidden">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldWarning size={16} className="text-info" />
              <span className="text-sm font-medium">ATS Check</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {atsChecks.map((check: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className={`h-2 w-2 rounded-full shrink-0 mt-1.5 ${
                    check.status === "pass" ? "bg-primary" : check.status === "warning" ? "bg-warning" : "bg-destructive"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-muted-foreground">{check.label || check.check}</span>
                    {check.detail && <p className="text-muted-foreground/60 whitespace-normal break-words mt-0.5">{check.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seniority match */}
      {seniorityMatch && (
        <Card className="border-border/50 bg-card/80">
          <CardContent className="py-4 space-y-2">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-primary" />
              <span className="text-sm font-medium">Seniority</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded uppercase truncate max-w-[120px]">{seniorityMatch.candidate_level}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded uppercase truncate max-w-[120px]">{seniorityMatch.role_level}</span>
              <span className={`ml-auto font-mono text-xs ${seniorityMatch.match ? "text-primary" : "text-warning"}`}>
                {seniorityMatch.match ? "Match" : "Gap"}
              </span>
            </div>
            {seniorityMatch.note && <p className="text-xs text-muted-foreground">{seniorityMatch.note}</p>}
          </CardContent>
        </Card>
      )}

      {/* Learning Suggestions */}
      {learningSuggestions && learningSuggestions.length > 0 && (
        <Card className="border-border/50 bg-card/80 overflow-hidden">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-primary" />
              <span className="text-sm font-medium">Risorse consigliate</span>
            </div>
            <div className="space-y-2">
              {learningSuggestions.map((s: any, i: number) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors group">
                  <span className="font-mono text-[11px] uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">{s.type}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm group-hover:text-primary transition-colors truncate">{s.resource_name}</p>
                    <p className="text-xs text-muted-foreground">{s.skill}{s.duration ? ` · ${s.duration}` : ""}</p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {diff && diff.length > 0 && (
        <Collapsible open={diffOpen} onOpenChange={setDiffOpen}>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="py-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-primary" />
                  <span className="text-sm font-medium">Modifiche AI</span>
                  <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{diff.length}</span>
                </div>
                <CaretDown size={14} className={`text-muted-foreground transition-transform ${diffOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3 mt-4">
                  {diff.map((ch: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border/30 p-3 space-y-1.5">
                      <p className="font-mono text-[11px] text-muted-foreground uppercase">{ch.section}</p>
                      <p className="text-sm line-through text-muted-foreground">{ch.original}</p>
                      <p className="text-sm text-primary border-l-2 border-primary/40 pl-2">{ch.suggested}</p>
                      {ch.reason && <p className="text-xs text-muted-foreground italic">{ch.reason}</p>}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>
      )}

      {/* Tailored CV preview */}
      {tailoredData && (
        <Card className="border-border/50 bg-card/80">
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-medium">CV adattato</p>
            <CVSections data={tailoredData} collapsible />
          </CardContent>
        </Card>
      )}

      {/* Notes — auto-save on blur */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="py-4 space-y-2">
          <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Note</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Aggiungi note..."
            rows={3}
            className="resize-none bg-surface border-border"
          />
        </CardContent>
      </Card>

      {/* Job description */}
      {app.job_description && (
        <Collapsible>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="py-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">Annuncio originale</span>
                <CaretDown size={14} className="text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{app.job_description}</p>
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>
      )}

      {/* Actions — sticky on mobile */}
      <div className="space-y-2 pb-6 md:pb-6 sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)] md:static bg-background/95 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none pt-3 -mx-4 px-4 border-t border-border/30 md:border-0 md:mx-0 z-10">
        {tailoredData && (
          <Button variant="outline" className="w-full gap-2 active:scale-[0.98] transition-transform" onClick={() => setExportOpen(true)}>
            <DownloadSimple size={16} /> Scarica PDF
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 active:scale-[0.98] transition-transform">
              <Trash size={16} /> Elimina candidatura
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminare la candidatura?</AlertDialogTitle>
              <AlertDialogDescription>
                La candidatura per {app.role_title} — {app.company_name} verrà eliminata permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Eliminazione..." : "Elimina"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Export Drawer */}
      {tailoredData && (
        <ExportDrawer
          open={exportOpen}
          onOpenChange={setExportOpen}
          tailoredCv={tailoredData as Record<string, any>}
          atsScore={atsScore ?? undefined}
          atsChecks={atsChecks ?? undefined}
          honestScore={honestScore ?? undefined}
          companyName={app.company_name}
          applicationId={app.id}
          userId={user?.id}
        />
      )}
    </div>
  );
}
