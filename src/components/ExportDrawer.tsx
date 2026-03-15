import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  CheckCircle,
  Warning,
  XCircle,
  X,
  SpinnerGap,
  CaretDown,
  Info,
  Printer,
  Lock,
  Crown,
} from "@phosphor-icons/react";
import { TEMPLATES, type TemplateId } from "@/components/cv-templates";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AiLabel } from "@/components/AiLabel";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

// --- Italian fallback labels for ATS checks ---
const ATS_LABELS_IT: Record<string, string> = {
  keywords: "Parole chiave",
  format: "Formato",
  dates: "Date",
  measurable: "Risultati misurabili",
  cliches: "Frasi fatte",
  sections: "Sezioni standard",
  action_verbs: "Verbi d'azione",
};

const ATS_SUGGESTIONS_IT: Record<string, string> = {
  measurable: "Aggiungi risultati misurabili ai tuoi bullet point (numeri, percentuali, metriche concrete).",
  action_verbs: "Inizia ogni bullet point con un verbo d'azione forte (es. 'Implementato', 'Ottimizzato', 'Guidato').",
  keywords: "Il CV non contiene abbastanza parole chiave dall'annuncio. Verifica di aver incluso i termini chiave del ruolo.",
  cliches: "Sostituisci le frasi generiche con descrizioni specifiche e concrete delle tue responsabilità.",
  sections: "Assicurati che il CV contenga tutte le sezioni standard (Profilo, Esperienza, Formazione, Competenze).",
};

type AtsCheck = {
  check: string;
  label: string;
  status: "pass" | "warning" | "fail";
  detail?: string;
};

type HonestScore = {
  confidence: number;
  experiences_added: number;
  skills_invented: number;
  dates_modified: number;
  bullets_repositioned: number;
  bullets_rewritten: number;
  sections_removed: number;
  flags: string[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tailoredCv: Record<string, any>;
  atsScore?: number;
  atsChecks?: AtsCheck[];
  honestScore?: HonestScore;
  companyName: string;
  applicationId?: string;
  userId?: string;
  lang?: string;
};

// --- Mini CV Preview for drawer ---
function DrawerCVPreview({ cv, templateId, lang }: { cv: Record<string, unknown>; templateId: string; lang: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.functions
      .invoke("render-cv", {
        body: { cv, template_id: templateId, format: "html", lang },
      })
      .then(({ data, error }) => {
        if (error || !data) {
          setLoading(false);
          return;
        }
        setHtml(typeof data === "string" ? data : "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [cv, templateId, lang]);

  if (loading) return <Skeleton className="w-full aspect-[1/1.414] rounded-lg" />;
  if (!html) return null;

  return (
    <div className="w-full rounded-lg border border-border/30 overflow-hidden bg-white" style={{ aspectRatio: "1/1.414" }}>
      <iframe
        srcDoc={html}
        className="w-full h-full border-0"
        sandbox="allow-same-origin"
        title="CV Preview"
      />
    </div>
  );
}

export function ExportDrawer({
  open,
  onOpenChange,
  tailoredCv,
  atsScore,
  atsChecks,
  honestScore,
  companyName,
  applicationId,
  userId,
  lang,
}: Props) {
  const { isPro } = useSubscription();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("classico");
  const [downloading, setDownloading] = useState(false);
  const [honestOpen, setHonestOpen] = useState(false);

  const failingChecks = (atsChecks || []).filter(ch => ch.status === "warning" || ch.status === "fail");

  const handleTemplateSelect = (templateId: TemplateId) => {
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (tpl && !tpl.free && !isPro) {
      toast("Sblocca questo template con Verso Pro", {
        action: { label: "Upgrade", onClick: () => navigate("/upgrade") },
      });
      return;
    }
    setSelectedTemplate(templateId);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("render-cv", {
        body: { cv: tailoredCv, template_id: selectedTemplate, format: "html", lang: lang || "it" },
      });
      if (error || !data) throw new Error("Errore nel rendering del CV");

      const htmlStr = typeof data === "string" ? data : "";
      const printWindow = window.open("", "_blank", "width=800,height=1100");
      if (!printWindow) throw new Error("Popup bloccato dal browser");

      printWindow.document.open();
      printWindow.document.write(htmlStr);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => printWindow.print(), 400);
      };
      setTimeout(() => printWindow.print(), 1500);

      toast.success("Finestra di stampa aperta — salva come PDF.");
      onOpenChange(false);
    } catch (e) {
      console.error("PDF generation error:", e);
      toast.error("Errore durante la generazione del PDF. Verifica che i popup non siano bloccati.");
    } finally {
      setDownloading(false);
    }
  };

  const effectiveLang = lang || "it";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex items-center justify-between">
          <DrawerTitle className="font-display text-lg font-bold">Scarica CV</DrawerTitle>
          <DrawerClose asChild>
            <button className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
              <X size={18} />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 pb-2">
          <div className="space-y-5">
            {/* ATS Check Panel */}
            {atsScore !== undefined && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Punteggio ATS
                  </span>
                  <span className="font-mono text-lg font-bold text-info">{atsScore}%</span>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-info/5 border border-info/10">
                  <Info size={14} className="text-info shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Il punteggio ATS misura quanto il tuo CV è leggibile dai sistemi automatici di screening usati dalle aziende.
                  </p>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-destructive via-warning to-primary transition-all"
                    style={{ width: `${atsScore}%` }}
                  />
                </div>
                {atsChecks && atsChecks.length > 0 && (
                  <div className="space-y-1.5">
                    {atsChecks.map((ch) => (
                      <div key={ch.check} className="flex items-center gap-2 text-sm">
                        {ch.status === "pass" ? (
                          <CheckCircle size={14} className="text-primary" weight="fill" />
                        ) : ch.status === "warning" ? (
                          <Warning size={14} className="text-warning" weight="fill" />
                        ) : (
                          <XCircle size={14} className="text-destructive" weight="fill" />
                        )}
                        <span className="flex-1 text-xs">{ATS_LABELS_IT[ch.check] || ch.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {failingChecks.length > 0 && (
                  <div className="space-y-2 mt-2 p-3 rounded-lg border border-warning/20 bg-warning/5">
                    <p className="text-xs font-medium text-warning">Suggerimenti per migliorare</p>
                    {failingChecks.map((ch) => {
                      const suggestion = ATS_SUGGESTIONS_IT[ch.check];
                      if (!suggestion) return null;
                      return (
                        <p key={ch.check} className="text-[11px] text-muted-foreground leading-relaxed">
                          • {suggestion}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Honest Score (Collapsed) */}
            {honestScore && (
              <Collapsible open={honestOpen} onOpenChange={setHonestOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Punteggio di Onestà
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary">
                      {honestScore.confidence}%
                    </span>
                    <CaretDown
                      size={14}
                      className={`text-muted-foreground transition-transform ${honestOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-1 mt-2 text-xs text-muted-foreground">
                    <p>Esperienze aggiunte: {honestScore.experiences_added}</p>
                    <p>Competenze inventate: {honestScore.skills_invented}</p>
                    <p>Date modificate: {honestScore.dates_modified}</p>
                    <p>Bullet riscritti: {honestScore.bullets_rewritten}</p>
                    <p>Bullet riposizionati: {honestScore.bullets_repositioned}</p>
                    <p>Sezioni rimosse: {honestScore.sections_removed}</p>
                    {honestScore.flags.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {honestScore.flags.map((f, i) => (
                          <p key={i} className="text-warning">⚠ {f}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Template Picker — all 4 templates */}
            <div className="space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Template
              </span>
              <div className="grid grid-cols-4 gap-2">
                {TEMPLATES.map((t) => {
                  const isSelected = selectedTemplate === t.id;
                  const isLocked = !t.free && !isPro;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleTemplateSelect(t.id)}
                      className={[
                        "relative rounded-lg border-2 p-3 text-center transition-all",
                        isLocked ? "border-border/30 opacity-70"
                        : isSelected ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                        : "border-border/50 hover:border-primary/40",
                      ].join(" ")}
                    >
                      {isLocked && (
                        <div className="absolute top-1 right-1 z-20">
                          <Lock size={10} className="text-muted-foreground" weight="fill" />
                        </div>
                      )}
                      <p className="text-xs font-medium">{t.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mini CV Preview */}
            <DrawerCVPreview cv={tailoredCv} templateId={selectedTemplate} lang={effectiveLang} />
          </div>
        </ScrollArea>

        <DrawerFooter>
          <p className="text-[11px] text-muted-foreground/70 text-center mb-2">
            Scaricando questo documento confermi di averlo revisionato e di assumerne la responsabilità.
          </p>
          <AiLabel text="Documento generato con AI — l'utente è responsabile della revisione" className="justify-center mb-2" />
          <Button onClick={handleDownload} disabled={downloading} className="w-full gap-2">
            {downloading ? (
              <>
                <SpinnerGap size={16} className="animate-spin" /> Generazione...
              </>
            ) : (
              <>
                <Printer size={16} /> Stampa / Salva PDF
              </>
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
