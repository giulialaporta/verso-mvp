import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Briefcase,
  ArrowRight,
  Trash,
  ArrowClockwise,
  Plus,
  X,
  FloppyDisk,
  CalendarBlank,
  ChartLineUp,
  DownloadSimple,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ExportDrawer } from "@/components/ExportDrawer";


type AppRow = {
  id: string;
  company_name: string;
  role_title: string;
  match_score: number | null;
  status: string;
  created_at: string;
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-muted/40", text: "text-muted-foreground" },
  inviata: { bg: "bg-secondary/15", text: "text-secondary" },
  visualizzata: { bg: "bg-warning/15", text: "text-warning" },
  contattato: { bg: "bg-primary/15", text: "text-primary" },
  "follow-up": { bg: "bg-warning/20", text: "text-warning" },
  ko: { bg: "bg-destructive/15", text: "text-destructive" },
};

function StatusChip({ status }: { status: string }) {
  const s = STATUS_STYLES[status.toLowerCase()] ?? STATUS_STYLES.draft;
  return (
    <span className={`${s.bg} ${s.text} rounded-full px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider`}>
      {status}
    </span>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });
}

const STATUSES = ["inviata", "visualizzata", "contattato", "follow-up", "ko"] as const;

export default function Candidature() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<AppRow[] | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<AppRow | null>(null);
  const [drawerStatus, setDrawerStatus] = useState("");
  const [drawerNotes, setDrawerNotes] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportCv, setExportCv] = useState<Record<string, any> | null>(null);
  const [exportAtsScore, setExportAtsScore] = useState<number | undefined>();
  const [exportAtsChecks, setExportAtsChecks] = useState<any>(undefined);
  const [exportHonestScore, setExportHonestScore] = useState<any>(undefined);
  const [exportCompany, setExportCompany] = useState("");
  const [exportAppId, setExportAppId] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("applications")
      .select("id, company_name, role_title, match_score, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setApps((data as unknown as AppRow[]) ?? []);
      });
  }, [user]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      // Delete related tailored_cvs first
      await supabase.from("tailored_cvs").delete().eq("application_id", id);
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw error;
      setApps((prev) => prev?.filter((a) => a.id !== id));
      toast.success("Candidatura eliminata.");
    } catch (e: any) {
      toast.error(e.message || "Errore durante l'eliminazione.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenDetail = (app: AppRow) => {
    setSelectedApp(app);
    setDrawerStatus(app.status.toLowerCase());
    setDrawerNotes("");
  };

  const handleStatusSave = async () => {
    if (!selectedApp) return;
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: drawerStatus })
        .eq("id", selectedApp.id);
      if (error) throw error;
      setApps((prev) =>
        prev?.map((a) => (a.id === selectedApp.id ? { ...a, status: drawerStatus } : a))
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

  const AppCard = ({ app }: { app: AppRow }) => (
    <div
      className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/60 px-3 py-3 cursor-pointer hover:border-primary/40 transition-colors"
      onClick={() => handleOpenDetail(app)}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-bold text-muted-foreground uppercase">
        {app.company_name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{app.role_title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {app.company_name} · {formatDate(app.created_at)}
        </p>
      </div>
      {app.match_score !== null && (
        <span className="font-mono text-sm font-bold text-primary">
          {app.match_score}%
        </span>
      )}
      <StatusChip status={app.status} />
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
        <div className="space-y-2">
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

      {/* Detail Drawer */}
      <Drawer open={selectedApp !== null} onOpenChange={(o) => !o && setSelectedApp(null)}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="flex items-center justify-between">
            <DrawerTitle className="font-display text-lg font-bold">
              Dettaglio candidatura
            </DrawerTitle>
            <DrawerClose asChild>
              <button className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </DrawerClose>
          </DrawerHeader>

          {selectedApp && (
            <ScrollArea className="flex-1 px-4 pb-2">
              <div className="space-y-5">
                {/* Info */}
                <div className="space-y-1">
                  <p className="font-display text-xl font-bold">{selectedApp.role_title}</p>
                  <p className="text-sm text-muted-foreground">{selectedApp.company_name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="inline-flex items-center gap-1">
                      <CalendarBlank size={12} /> {formatDate(selectedApp.created_at)}
                    </span>
                    {selectedApp.match_score !== null && (
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-primary">
                        <ChartLineUp size={12} /> {selectedApp.match_score}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Status selector */}
                <div className="space-y-2">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Stato
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => {
                      const style = STATUS_STYLES[s] ?? STATUS_STYLES.draft;
                      const isActive = drawerStatus === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setDrawerStatus(s)}
                          className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all ${
                            isActive
                              ? `${style.bg} ${style.text} ring-2 ring-current`
                              : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Note
                  </label>
                  <Textarea
                    value={drawerNotes}
                    onChange={(e) => setDrawerNotes(e.target.value)}
                    placeholder="Aggiungi note..."
                    rows={3}
                    className="resize-none bg-surface border-border"
                  />
                </div>
              </div>
            </ScrollArea>
          )}

          <DrawerFooter className="space-y-2">
            <Button onClick={handleStatusSave} className="w-full gap-2">
              <FloppyDisk size={16} /> Salva
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={async () => {
                if (!selectedApp) return;
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
            >
              <DownloadSimple size={16} /> Scarica PDF
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash size={16} /> Elimina candidatura
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminare la candidatura?</AlertDialogTitle>
                  <AlertDialogDescription>
                    La candidatura per {selectedApp?.role_title} — {selectedApp?.company_name} verrà eliminata permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      if (!selectedApp) return;
                      await handleDelete(selectedApp.id);
                      setSelectedApp(null);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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
