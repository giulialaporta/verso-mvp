import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, DownloadSimple, SpinnerGap,
  Lock, Crown, FileDoc, CheckCircle, CaretDown, CaretUp, Pencil, Printer
} from "@phosphor-icons/react";
import { TEMPLATES, type TemplateId } from "@/components/cv-templates";
import { generateDocx } from "@/components/cv-templates/docx-generator";
import { computeConfidence } from "./wizard-utils";
import type { AnalyzeResult, TailorResult, JobData } from "./wizard-types";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

type ReviewFix = {
  section: string;
  field: string;
  problem: string;
  correction: string;
};

type ReviewStatus = "idle" | "reviewing" | "done" | "error";

// --- CV Preview component ---
function CVPreview({ cv, templateId, lang }: { cv: Record<string, unknown>; templateId: string; lang: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    supabase.functions
      .invoke("render-cv", {
        body: { cv, template_id: templateId, format: "html", lang },
      })
      .then(({ data, error: err }) => {
        if (err || !data) {
          console.error("render-cv error:", err);
          setError(true);
          setLoading(false);
          return;
        }
        const htmlStr = typeof data === "string" ? data : "";
        setHtml(htmlStr);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [cv, templateId, lang]);

  if (loading) {
    return <Skeleton className="w-full aspect-[1/1.414] rounded-xl" />;
  }

  if (error || !html) {
    return (
      <div className="w-full aspect-[1/1.414] rounded-xl border border-border/30 bg-card/50 flex items-center justify-center text-sm text-muted-foreground">
        Preview non disponibile
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-border/30 overflow-hidden shadow-lg bg-white" style={{ aspectRatio: "1/1.414" }}>
      <iframe
        srcDoc={html}
        className="w-full h-full border-0"
        sandbox="allow-same-origin"
        title="CV Preview"
        style={{
          transform: "scale(1)",
          transformOrigin: "top left",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}

/** Fetch rendered HTML from render-cv and open print dialog for PDF save */
async function printCvAsPdf(
  cv: Record<string, unknown>,
  templateId: string,
  lang: string
): Promise<void> {
  const { data, error } = await supabase.functions.invoke("render-cv", {
    body: { cv, template_id: templateId, format: "html", lang },
  });
  if (error || !data) throw new Error("Errore nel rendering del CV");

  const htmlStr = typeof data === "string" ? data : "";
  const printWindow = window.open("", "_blank", "width=800,height=1100");
  if (!printWindow) throw new Error("Popup bloccato dal browser");

  printWindow.document.open();
  printWindow.document.write(htmlStr);
  printWindow.document.close();

  // Wait for fonts/styles to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };
  // Fallback if onload doesn't fire
  setTimeout(() => {
    printWindow.print();
  }, 1500);
}

export function StepExport({
  tailoredCv,
  analyzeResult,
  tailorResult,
  jobData,
  applicationId,
  cvLang,
  onBack,
  onNext,
}: {
  tailoredCv: Record<string, unknown>;
  analyzeResult: AnalyzeResult | null;
  tailorResult: TailorResult;
  jobData: JobData;
  applicationId: string;
  cvLang?: string;
  onBack: () => void;
  onNext: () => void;
}) {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("classico");
  const [downloading, setDownloading] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const trackEvent = useTrackEvent();

  // Formal review state
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("idle");
  const [reviewFixes, setReviewFixes] = useState<ReviewFix[]>([]);
  const [reviewedCv, setReviewedCv] = useState<Record<string, unknown> | null>(null);
  const [fixesOpen, setFixesOpen] = useState(false);
  const reviewCalledRef = useRef(false);

  // Launch review in background on mount
  useEffect(() => {
    if (reviewCalledRef.current) return;
    reviewCalledRef.current = true;
    setReviewStatus("reviewing");

    supabase.functions
      .invoke("cv-formal-review", {
        body: { cv: tailoredCv, template_id: selectedTemplate, lang: cvLang || "it" },
      })
      .then(({ data, error }) => {
        if (error || !data) {
          console.error("cv-formal-review error:", error);
          setReviewStatus("error");
          return;
        }
        const fixes = (data.fixes as ReviewFix[]) || [];
        setReviewFixes(fixes);
        setReviewedCv(data.revised_cv || tailoredCv);
        setReviewStatus("done");

        if (fixes.length > 0) {
          setFixesOpen(true);
        }
      })
      .catch((e) => {
        console.error("cv-formal-review fetch error:", e);
        setReviewStatus("error");
      });
  }, [tailoredCv, selectedTemplate]);

  // The CV to use for downloads: reviewed if available, otherwise original
  const activeCv = reviewedCv || tailoredCv;

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

  const personalName = (activeCv?.personal as any)?.name || "CV";
  const matchScore = analyzeResult?.match_score ?? 0;
  const atsScore = analyzeResult?.ats_score ?? 0;

  const stats = useMemo(() =>
    computeConfidence(tailorResult.original_cv ?? null, activeCv, tailorResult.diff),
    [tailorResult.original_cv, activeCv, tailorResult.diff]
  );

  const fileBaseName = "CV-" + personalName.replace(/\s+/g, "-") + "-" + jobData.company_name.replace(/\s+/g, "-");
  const effectiveLang = cvLang || "it";

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await printCvAsPdf(activeCv, selectedTemplate, effectiveLang);

      // Track event (PDF saved via print dialog)
      trackEvent("pdf_downloaded", { template: selectedTemplate, formal_review: reviewStatus === "done", method: "print" });

      toast.success("Finestra di stampa aperta — salva come PDF.");
    } catch (e) {
      console.error("PDF generation error:", e);
      toast.error("Errore durante la generazione del PDF. Verifica che i popup non siano bloccati.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!isPro) {
      toast("Export DOCX disponibile con Verso Pro", {
        action: { label: "Upgrade", onClick: () => navigate("/upgrade") },
      });
      return;
    }
    setDownloadingDocx(true);
    try {
      const blob = await generateDocx(activeCv as Record<string, any>, effectiveLang, selectedTemplate);
      const fileName = fileBaseName + "-" + selectedTemplate + ".docx";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (user?.id && applicationId) {
        const storagePath = user.id + "/" + applicationId + "/" + fileName;
        await supabase.storage.from("cv-exports").upload(storagePath, blob, {
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          upsert: true,
        });
      }

      toast.success("DOCX scaricato!");
      trackEvent("docx_downloaded", { template: selectedTemplate, formal_review: reviewStatus === "done" });
    } catch (e) {
      console.error("DOCX generation error:", e);
      toast.error("Errore durante la generazione del DOCX.");
    } finally {
      setDownloadingDocx(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={20} /></button>
        <div>
          <h2 className="font-display text-2xl font-bold">Scarica il tuo CV</h2>
          <p className="text-muted-foreground mt-1">Scegli il template e scarica il PDF.</p>
        </div>
      </div>

      {/* Template selector */}
      <div className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Template</p>
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
                  : "border-border/50 hover:border-primary/40"
                ].join(" ")}
              >
                {isLocked && (
                  <div className="absolute top-1 right-1 z-20">
                    <Lock size={12} className="text-muted-foreground" weight="fill" />
                  </div>
                )}
                <p className="text-xs font-medium">{t.name}</p>
                {t.atsSafe && (
                  <p className="mt-0.5 font-mono text-[9px] text-info/80 uppercase tracking-wide">ATS-Safe</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live CV Preview */}
      <CVPreview cv={activeCv} templateId={selectedTemplate} lang={effectiveLang} />

      {/* Compact badges */}
      <div className="flex gap-2 flex-wrap">
        <span className="rounded-full bg-primary/15 px-3 py-1 font-mono text-xs text-primary">Match {matchScore}%</span>
        <span className="rounded-full bg-info/15 px-3 py-1 font-mono text-xs text-info">ATS {atsScore}%</span>
        <span className={[
          "rounded-full px-3 py-1 font-mono text-xs",
          stats.confidence >= 90 ? "bg-primary/15 text-primary" : "bg-warning/15 text-warning"
        ].join(" ")}>
          Confidence {stats.confidence}%
        </span>

        {reviewStatus === "reviewing" && (
          <span className="rounded-full bg-info/15 px-3 py-1 font-mono text-xs text-info flex items-center gap-1.5">
            <SpinnerGap size={12} className="animate-spin" /> Revisione...
          </span>
        )}
        {reviewStatus === "done" && reviewFixes.length === 0 && (
          <span className="rounded-full bg-primary/15 px-3 py-1 font-mono text-xs text-primary flex items-center gap-1.5">
            <CheckCircle size={12} weight="fill" /> Revisione OK
          </span>
        )}
        {reviewStatus === "done" && reviewFixes.length > 0 && (
          <span className="rounded-full bg-warning/15 px-3 py-1 font-mono text-xs text-warning flex items-center gap-1.5">
            <Pencil size={12} /> {reviewFixes.length} correzioni
          </span>
        )}
        {reviewStatus === "error" && (
          <span className="rounded-full bg-destructive/15 px-3 py-1 font-mono text-xs text-destructive">
            Revisione non disponibile
          </span>
        )}
      </div>

      {/* Formal review fixes panel */}
      {reviewStatus === "done" && reviewFixes.length > 0 && (
        <Collapsible open={fixesOpen} onOpenChange={setFixesOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 w-full rounded-lg border border-border/50 bg-card px-4 py-3 text-sm font-medium text-foreground hover:border-primary/30 transition-colors">
              <Pencil size={16} className="text-warning" />
              <span>{reviewFixes.length} correzioni formali applicate</span>
              <span className="ml-auto">
                {fixesOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
              </span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2">
              {reviewFixes.map((fix, i) => (
                <div key={i} className="rounded-lg border border-border/30 bg-card/50 px-4 py-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 rounded bg-warning/15 px-1.5 py-0.5 font-mono text-[11px] text-warning uppercase">
                      {fix.section}
                    </span>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {fix.field}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">{fix.problem}</p>
                  <p className="mt-1 text-foreground">{fix.correction}</p>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {reviewStatus === "done" && reviewFixes.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <CheckCircle size={18} weight="fill" />
          Nessuna correzione necessaria — il tuo CV è pronto.
        </div>
      )}

      {/* Download buttons */}
      <div className="space-y-3">
        <Button onClick={handleDownload} disabled={downloading} className="w-full gap-2 h-12 text-base active:scale-[0.98] transition-transform">
          {downloading ? <><SpinnerGap size={18} className="animate-spin" /> Generazione...</> : <><Printer size={18} /> Stampa / Salva PDF</>}
        </Button>

        <Button
          variant="outline"
          onClick={handleDownloadDocx}
          disabled={downloadingDocx}
          className="w-full gap-2 h-11 relative active:scale-[0.98] transition-transform"
        >
          {!isPro && <Lock size={14} className="text-muted-foreground" />}
          {downloadingDocx ? (
            <><SpinnerGap size={16} className="animate-spin" /> Generazione DOCX...</>
          ) : (
            <><FileDoc size={16} /> Scarica DOCX</>
          )}
          {!isPro && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[11px] text-primary font-bold">
              <Crown size={8} weight="fill" /> Pro
            </span>
          )}
        </Button>
      </div>

      <Button variant="outline" onClick={onNext} className="w-full gap-2 text-muted-foreground">
        Salta per ora <ArrowRight size={16} />
      </Button>
    </div>
  );
}
