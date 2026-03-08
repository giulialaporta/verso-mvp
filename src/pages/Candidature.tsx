import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  ArrowRight,
  Trash,
  ArrowClockwise,
  Plus,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ExportDrawer } from "@/components/ExportDrawer";
import { DetailContent } from "@/components/candidature/DetailContent";
import { ResponsiveDetailPanel } from "@/components/candidature/ResponsiveDetailPanel";


import { useApplications } from "@/hooks/useApplications";
import type { AppRowWithAts } from "@/types/application";

import { StatusChip, STATUS_STYLES } from "@/components/StatusChip";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });
}



export default function Candidature() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: apps, isLoading: appsLoading } = useApplications(100);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<AppRowWithAts | null>(null);
  const [drawerStatus, setDrawerStatus] = useState("");
  const [drawerNotes, setDrawerNotes] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportCv, setExportCv] = useState<Record<string, any> | null>(null);
  const [exportAtsScore, setExportAtsScore] = useState<number | undefined>();
  const [exportAtsChecks, setExportAtsChecks] = useState<any>(undefined);
  const [exportHonestScore, setExportHonestScore] = useState<any>(undefined);
  const [exportCompany, setExportCompany] = useState("");
  const [exportAppId, setExportAppId] = useState("");

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      // Delete PDF from storage if exists
      const { data: tcData } = await supabase
        .from("tailored_cvs")
        .select("pdf_url")
        .eq("application_id", id);
      if (tcData) {
        // pdf_url now stores the storage path directly (not a full URL)
        const pdfPaths = tcData
          .map((tc) => tc.pdf_url)
          .filter(Boolean) as string[];
        if (pdfPaths.length > 0) {
          await supabase.storage.from("cv-exports").remove(pdfPaths);
        }
      }
      // Delete related tailored_cvs first
      await supabase.from("tailored_cvs").delete().eq("application_id", id);
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Candidatura eliminata.");
    } catch (e: any) {
      toast.error(e.message || "Errore durante l'eliminazione.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenDetail = (app: AppRowWithAts) => {
    setSelectedApp(app);
    setDrawerStatus(app.status.toLowerCase());
    setDrawerNotes(app.notes || "");
  };

  const handleStatusSave = async () => {
    if (!selectedApp) return;
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: drawerStatus, notes: drawerNotes || null } as any)
        .eq("id", selectedApp.id);
      if (error) throw error;
      setApps((prev) =>
        prev?.map((a) => (a.id === selectedApp.id ? { ...a, status: drawerStatus, notes: drawerNotes || null } : a))
      );
      toast.success("Stato aggiornato.");
      setSelectedApp(null);
    } catch (e: any) {
      toast.error(e.message || "Errore durante il salvataggio.");
    }
  };

  const drafts = useMemo(() => (apps ?? []).filter((a) => a.status.toLowerCase() === "draft"), [apps]);
  const active = useMemo(() => (apps ?? []).filter((a) => a.status.toLowerCase() !== "draft"), [apps]);

  if (apps === undefined) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 sm:px-0">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 py-20">
        <Briefcase size={48} className="text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">Candidature</h1>
        <p className="text-center text-muted-foreground">
          Le tue candidature appariranno qui una volta create.
        </p>
        <Button onClick={() => navigate("/app/nuova")} className="gap-2">
          <Plus size={16} /> Nuova candidatura
        </Button>
      </div>
    );
  }

  const AppCard = ({ app }: { app: AppRowWithAts }) => (
    <div
      className="rounded-lg border border-border/30 bg-card/60 px-3 py-3 cursor-pointer hover:border-primary/40 transition-colors"
      onClick={() => navigate(`/app/candidatura/${app.id}`)}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-bold text-muted-foreground uppercase">
          {app.company_name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{app.role_title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {app.company_name} · {formatDate(app.created_at)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 ml-12">
        {app.match_score !== null && (
          <span className="font-mono text-sm font-bold text-primary">
            {app.match_score}%
          </span>
        )}
        {app.ats_score !== null && (
          <span className="font-mono text-sm font-bold text-info">
            ATS {app.ats_score}%
          </span>
        )}
        <StatusChip status={app.status} />
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Candidature</h1>
        <Button onClick={() => navigate("/app/nuova")} size="sm" className="gap-2">
          <Plus size={14} /> Nuova
        </Button>
      </div>

      {/* Drafts section */}
      {drafts.length > 0 && (
        <Card className="border-warning/30 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-warning flex items-center gap-2">
              <ArrowClockwise size={16} /> Bozze ({drafts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {drafts.map((draft, i) => (
              <motion.div
                key={draft.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/60 px-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-bold text-muted-foreground uppercase">
                    {draft.company_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{draft.role_title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {draft.company_name} · {formatDate(draft.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/app/nuova?draft=${draft.id}`)}
                    className="gap-1 text-xs"
                  >
                    Riprendi <ArrowRight size={12} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label={`Elimina bozza ${draft.role_title}`}
                      >
                        <Trash size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminare la bozza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          La bozza per {draft.role_title} — {draft.company_name} verrà eliminata permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(draft.id)}
                          disabled={deletingId === draft.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deletingId === draft.id ? "Eliminazione..." : "Elimina"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active applications */}
      {active.length > 0 && (
        <div className="space-y-3">
          {active.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <AppCard app={app} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Panel — Sheet on desktop, Drawer on mobile */}
      <ResponsiveDetailPanel
        open={selectedApp !== null}
        onOpenChange={(o) => !o && setSelectedApp(null)}
      >
        {selectedApp && (
          <DetailContent
            app={selectedApp}
            drawerStatus={drawerStatus}
            setDrawerStatus={setDrawerStatus}
            drawerNotes={drawerNotes}
            setDrawerNotes={setDrawerNotes}
            onSave={handleStatusSave}
            onDelete={async () => {
              await handleDelete(selectedApp.id);
              setSelectedApp(null);
            }}
            onExport={async () => {
              const { data: tcData } = await supabase
                .from("tailored_cvs")
                .select("tailored_data, ats_score, ats_checks, honest_score")
                .eq("application_id", selectedApp.id)
                .maybeSingle();
              if (tcData?.tailored_data) {
                setExportCv(tcData.tailored_data as Record<string, any>);
                setExportAtsScore(tcData.ats_score ?? undefined);
                setExportAtsChecks((tcData.ats_checks as any) ?? undefined);
                setExportHonestScore((tcData.honest_score as any) ?? undefined);
                setExportCompany(selectedApp.company_name);
                setExportAppId(selectedApp.id);
                setExportOpen(true);
              } else {
                toast.error("Nessun CV adattato trovato per questa candidatura.");
              }
            }}
            deletingId={deletingId}
          />
        )}
      </ResponsiveDetailPanel>

      {/* Export Drawer */}
      {exportCv && (
        <ExportDrawer
          open={exportOpen}
          onOpenChange={setExportOpen}
          tailoredCv={exportCv}
          atsScore={exportAtsScore}
          atsChecks={exportAtsChecks}
          honestScore={exportHonestScore}
          companyName={exportCompany}
          applicationId={exportAppId}
          userId={user?.id}
        />
      )}
    </div>
  );
}
