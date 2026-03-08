import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Trash,
  FloppyDisk,
  CalendarBlank,
  ChartLineUp,
  DownloadSimple,
} from "@phosphor-icons/react";
import { StatusChip, STATUS_STYLES } from "@/components/StatusChip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRow = {
  id: string;
  company_name: string;
  role_title: string;
  match_score: number | null;
  ats_score: number | null;
  status: string;
  created_at: string;
  notes: string | null;
};

const STATUSES = ["inviata", "visualizzata", "contattato", "follow-up", "ko"] as const;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });
}

interface DetailContentProps {
  app: AppRow;
  drawerStatus: string;
  setDrawerStatus: (s: string) => void;
  drawerNotes: string;
  setDrawerNotes: (s: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onExport: () => void;
  deletingId: string | null;
}

export function DetailContent({
  app,
  drawerStatus,
  setDrawerStatus,
  drawerNotes,
  setDrawerNotes,
  onSave,
  onDelete,
  onExport,
  deletingId,
}: DetailContentProps) {
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4 pb-2">
        <div className="space-y-5">
          {/* Info */}
          <div className="space-y-1">
            <p className="font-display text-xl font-bold">{app.role_title}</p>
            <p className="text-sm text-muted-foreground">{app.company_name}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="inline-flex items-center gap-1">
                <CalendarBlank size={12} /> {formatDate(app.created_at)}
              </span>
              {app.match_score !== null && (
                <span className="inline-flex items-center gap-1 font-mono font-bold text-primary">
                  <ChartLineUp size={12} /> {app.match_score}%
                </span>
              )}
            </div>
          </div>

          {/* Status selector */}
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Stato
            </label>
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
              {STATUSES.map((s) => {
                const style = STATUS_STYLES[s] ?? STATUS_STYLES.draft;
                const isActive = drawerStatus === s;
                return (
                  <button
                    key={s}
                    onClick={() => setDrawerStatus(s)}
                    className={`rounded-full px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-all min-h-[44px] ${
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

      <div className="space-y-2 p-4 pt-2">
        <Button onClick={onSave} className="w-full gap-2">
          <FloppyDisk size={16} /> Salva
        </Button>
        <Button variant="outline" className="w-full gap-2" onClick={onExport}>
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
                La candidatura per {app.role_title} — {app.company_name} verrà eliminata permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
