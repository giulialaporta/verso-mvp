import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, DownloadSimple, SpinnerGap, Lock, Crown, FileDoc } from "@phosphor-icons/react";
import { ClassicoTemplate, MinimalTemplate, ExecutiveTemplate, ModernoTemplate, TEMPLATES, type TemplateId } from "@/components/cv-templates";
import { generateDocx } from "@/components/cv-templates/docx-generator";
import { computeConfidence } from "./wizard-utils";
import type { AnalyzeResult, TailorResult, JobData } from "./wizard-types";

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

  const handleTemplateSelect = (templateId: string) => {
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (tpl && !tpl.free && !isPro) {
      toast("Sblocca questo template con Verso Pro", {
        action: { label: "Upgrade", onClick: () => navigate("/upgrade") },
      });
      return;
    }
    setSelectedTemplate(templateId);
  };

  const personalName = (tailoredCv?.personal as any)?.name || "CV";
  const matchScore = analyzeResult?.match_score ?? 0;
  const atsScore = analyzeResult?.ats_score ?? 0;

  const stats = useMemo(() =>
    computeConfidence(tailorResult.original_cv ?? null, tailoredCv, tailorResult.diff),
    [tailorResult.original_cv, tailoredCv, tailorResult.diff]
  );

  const fileBaseName = `CV-${personalName.replace(/\s+/g, "-")}-${jobData.company_name.replace(/\s+/g, "-")}`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const templateMap: Record<string, typeof ClassicoTemplate> = {
        classico: ClassicoTemplate,
        minimal: MinimalTemplate,
        executive: ExecutiveTemplate,
        moderno: ModernoTemplate,
      };
      const TemplateComponent = templateMap[selectedTemplate] || ClassicoTemplate;
      const blob = await pdf(<TemplateComponent cv={tailoredCv} lang={cvLang} />).toBlob();
      const fileName = `${fileBaseName}.pdf`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (user?.id && applicationId) {
        const storagePath = `${user.id}/${applicationId}/${fileName}`;
        await supabase.storage.from("cv-exports").upload(storagePath, blob, { contentType: "application/pdf", upsert: true });
        await supabase.from("tailored_cvs").update({ pdf_url: storagePath, template_id: selectedTemplate } as any).eq("application_id", applicationId);
      }

      toast.success("PDF scaricato!");
      trackEvent("pdf_downloaded", { template: selectedTemplate });
      onNext();
    } catch (e) {
      console.error("PDF generation error:", e);
      toast.error("Errore durante la generazione del PDF.");
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
      const blob = await generateDocx(tailoredCv as Record<string, any>, cvLang, selectedTemplate);
      const fileName = `${fileBaseName}-${selectedTemplate}.docx`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (user?.id && applicationId) {
        const storagePath = `${user.id}/${applicationId}/${fileName}`;
        await supabase.storage.from("cv-exports").upload(storagePath, blob, {
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          upsert: true,
        });
      }

      toast.success("DOCX scaricato!");
      trackEvent("docx_downloaded", { template: selectedTemplate });
    } catch (e) {
      console.error("DOCX generation error:", e);
      toast.error("Errore durante la generazione del DOCX.");
    } finally {
      setDownloadingDocx(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4">
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
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((t) => {
            const isSelected = selectedTemplate === t.id;
            const isLocked = !t.free && !isPro;
            return (
              <button
                key={t.id}
                onClick={() => handleTemplateSelect(t.id)}
                className={`relative rounded-xl border-2 p-6 text-center transition-all ${
                  isLocked ? "border-border/30 opacity-70"
                  : isSelected ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border/50 hover:border-primary/40"
                }`}
              >
                {/* Pro badge + lock overlay */}
                {isLocked && (
                  <>
                    <div className="absolute inset-0 rounded-xl backdrop-blur-[2px] bg-background/40 z-10 flex items-center justify-center">
                      <Lock size={24} className="text-muted-foreground" weight="fill" />
                    </div>
                    <span className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[11px] text-primary font-bold">
                      <Crown size={10} weight="fill" /> Pro
                    </span>
                  </>
                )}
                <div className="h-16 flex items-center justify-center mb-3">
                  {t.id === "classico" && (
                    <div className="w-12 h-16 rounded border border-primary/30 flex flex-row overflow-hidden">
                      <div className="w-[30%] bg-[hsl(var(--surface))]" />
                      <div className="w-[70%] bg-card" />
                    </div>
                  )}
                  {t.id === "minimal" && (
                    <div className="w-12 h-16 rounded border border-border flex flex-row overflow-hidden">
                      <div className="w-[26%] bg-background border-r border-border/50" />
                      <div className="w-[74%] bg-background" />
                    </div>
                  )}
                  {t.id === "executive" && (
                    <div className="w-12 h-16 rounded border border-border bg-background overflow-hidden p-1">
                      <div className="w-full h-1 bg-info rounded-full mb-1" />
                      <div className="w-3/4 h-0.5 bg-muted-foreground/30 rounded mb-1" />
                      <div className="w-full h-0.5 bg-muted-foreground/20 rounded mb-0.5" />
                      <div className="w-full h-0.5 bg-muted-foreground/20 rounded" />
                    </div>
                  )}
                  {t.id === "moderno" && (
                    <div className="w-12 h-16 rounded border border-info/30 flex flex-row overflow-hidden">
                      <div className="w-[35%] bg-info/20" />
                      <div className="w-[65%] bg-card" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium">{t.name}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact badges */}
      <div className="flex gap-2 flex-wrap">
        <span className="rounded-full bg-primary/15 px-3 py-1 font-mono text-xs text-primary">Match {matchScore}%</span>
        <span className="rounded-full bg-info/15 px-3 py-1 font-mono text-xs text-info">ATS {atsScore}%</span>
        <span className={`rounded-full px-3 py-1 font-mono text-xs ${stats.confidence >= 90 ? "bg-primary/15 text-primary" : "bg-warning/15 text-warning"}`}>
          Confidence {stats.confidence}%
        </span>
      </div>

      {/* Download buttons */}
      <div className="space-y-3">
        <Button onClick={handleDownload} disabled={downloading} className="w-full gap-2 h-12 text-base">
          {downloading ? <><SpinnerGap size={18} className="animate-spin" /> Generazione...</> : <><DownloadSimple size={18} /> Scarica PDF</>}
        </Button>

        <Button
          variant="outline"
          onClick={handleDownloadDocx}
          disabled={downloadingDocx}
          className="w-full gap-2 h-11 relative"
        >
          {!isPro && <Lock size={14} className="text-muted-foreground" />}
          {downloadingDocx ? (
            <><SpinnerGap size={16} className="animate-spin" /> Generazione DOCX...</>
          ) : (
            <><FileDoc size={16} /> Scarica DOCX</>
          )}
          {!isPro && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary font-bold">
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
