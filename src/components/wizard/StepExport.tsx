import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, DownloadSimple, SpinnerGap } from "@phosphor-icons/react";
import { ClassicoTemplate, MinimalTemplate, TEMPLATES } from "@/components/cv-templates";
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
  const [selectedTemplate, setSelectedTemplate] = useState<string>("classico");
  const [downloading, setDownloading] = useState(false);

  const personalName = (tailoredCv?.personal as any)?.name || "CV";
  const matchScore = analyzeResult?.match_score ?? 0;
  const atsScore = analyzeResult?.ats_score ?? 0;

  const stats = useMemo(() =>
    computeConfidence(tailorResult.original_cv ?? null, tailoredCv, tailorResult.diff),
    [tailorResult.original_cv, tailoredCv, tailorResult.diff]
  );

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const TemplateComponent = selectedTemplate === "minimal" ? MinimalTemplate : ClassicoTemplate;
      const blob = await pdf(<TemplateComponent cv={tailoredCv} lang={cvLang} />).toBlob();
      const fileName = `CV-${personalName.replace(/\s+/g, "-")}-${jobData.company_name.replace(/\s+/g, "-")}.pdf`;

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
      onNext();
    } catch (e) {
      console.error("PDF generation error:", e);
      toast.error("Errore durante la generazione del PDF.");
    } finally {
      setDownloading(false);
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
            const isLocked = !t.free;
            return (
              <button
                key={t.id}
                disabled={isLocked}
                onClick={() => setSelectedTemplate(t.id)}
                className={`relative rounded-xl border-2 p-6 text-center transition-all ${
                  isSelected ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : isLocked ? "border-border/30 bg-muted/20 opacity-50 cursor-not-allowed"
                  : "border-border/50 hover:border-primary/40"
                }`}
              >
                {isLocked && <Lock size={14} className="absolute top-2 right-2 text-muted-foreground" />}
                <div className="h-16 flex items-center justify-center mb-3">
                  <div className={`w-12 h-16 rounded border ${t.id === "classico" ? "bg-gradient-to-b from-card to-background border-primary/30" : "bg-background border-border"}`} />
                </div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{isLocked ? "Pro" : "Free"}</p>
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

      {/* Download button */}
      <Button onClick={handleDownload} disabled={downloading} className="w-full gap-2 h-12 text-base">
        {downloading ? <><SpinnerGap size={18} className="animate-spin" /> Generazione...</> : <><DownloadSimple size={18} /> Scarica PDF</>}
      </Button>

      <Button variant="outline" onClick={onNext} className="w-full gap-2 text-muted-foreground">
        Salta per ora <ArrowRight size={16} />
      </Button>
    </div>
  );
}
