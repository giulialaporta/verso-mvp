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
  ArrowLeft, ArrowRight, SpinnerGap,
  Lock, FileDoc, CheckCircle, CaretDown, CaretUp, Pencil, Printer
} from "@phosphor-icons/react";
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

// --- CV Preview with responsive scaling ---
function CVPreview({
  cv, templateId, lang, onHtmlLoaded
}: {
  cv: Record<string, unknown>;
  templateId: string;
  lang: string;
  onHtmlLoaded?: (html: string) => void;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  // Fetch HTML
  useEffect(() => {
    setLoading(true);
    setError(false);
    supabase.functions
      .invoke("render-cv", {
        body: { cv, template_id: templateId, format: "html", lang },
      })
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError(true);
          setLoading(false);
          return;
        }
        const h = typeof data === "string" ? data : "";
        setHtml(h);
        onHtmlLoaded?.(h);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [cv, templateId, lang]);

  // Responsive scale via ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 400;
      setScale(w / 794);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (loading) return <Skeleton className="w-full aspect-[1/1.414] rounded-xl" />;
  if (error || !html) {
    return (
      <div className="w-full aspect-[1/1.414] rounded-xl border border-border/30 bg-card/50 flex items-center justify-center text-sm text-muted-foreground">
        Preview non disponibile
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl border border-border/30 overflow-hidden shadow-lg bg-white"
      style={{ aspectRatio: "1/1.414" }}
    >
      <iframe
        srcDoc={html}
        className="border-0"
        sandbox="allow-same-origin"
        title="CV Preview"
        style={{
          width: "794px",
          height: "1123px",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

// --- ATS text preview ---
function ATSPreview({ cv, lang }: { cv: Record<string, any>; lang: string }) {
  const personal = cv.personal || {};
  const experience = Array.isArray(cv.experience) ? cv.experience : [];
  const education = Array.isArray(cv.education) ? cv.education : [];
  const skills = cv.skills;
  const certifications = Array.isArray(cv.certifications) ? cv.certifications : [];
  const h = lang === "en"
    ? { profile: "Professional Profile", experience: "Experience", education: "Education", skills: "Skills", certifications: "Certifications", languages: "Languages" }
    : { profile: "Profilo professionale", experience: "Esperienze", education: "Formazione", skills: "Competenze", certifications: "Certificazioni", languages: "Lingue" };

  const allSkills = skills
    ? Array.isArray(skills)
      ? skills
      : [...(skills.technical || []), ...(skills.soft || []), ...(skills.tools || [])]
    : [];
  const languages = skills?.languages || [];

  return (
    <div className="w-full rounded-xl border border-border/30 bg-card/80 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground overflow-auto max-h-[400px] space-y-3">
      <p className="text-foreground font-bold text-sm">{personal.name || "Nome Cognome"}</p>
      <p className="text-[10px]">{[personal.email, personal.phone, personal.location].filter(Boolean).join(" | ")}</p>

      {cv.summary && (
        <>
          <p className="text-primary font-bold uppercase tracking-wider text-[10px] border-b border-primary/30 pb-1 mt-2">{h.profile}</p>
          <p className="text-foreground/70">{String(cv.summary).slice(0, 200)}...</p>
        </>
      )}

      {experience.length > 0 && (
        <>
          <p className="text-primary font-bold uppercase tracking-wider text-[10px] border-b border-primary/30 pb-1">{h.experience}</p>
          {experience.slice(0, 3).map((exp: any, i: number) => (
            <div key={i}>
              <p className="text-foreground/90 font-medium">{exp.role || exp.title}</p>
              <p className="text-[10px]">{exp.company} | {exp.start} - {exp.end || "Attuale"}</p>
            </div>
          ))}
        </>
      )}

      {education.length > 0 && (
        <>
          <p className="text-primary font-bold uppercase tracking-wider text-[10px] border-b border-primary/30 pb-1">{h.education}</p>
          {education.slice(0, 2).map((ed: any, i: number) => (
            <p key={i} className="text-foreground/80">{ed.degree} - {ed.institution}</p>
          ))}
        </>
      )}

      {allSkills.length > 0 && (
        <>
          <p className="text-primary font-bold uppercase tracking-wider text-[10px] border-b border-primary/30 pb-1">{h.skills}</p>
          <p className="text-foreground/70">{allSkills.slice(0, 10).join(", ")}</p>
        </>
      )}

      {certifications.length > 0 && (
        <>
          <p className="text-primary font-bold uppercase tracking-wider text-[10px] border-b border-primary/30 pb-1">{h.certifications}</p>
          {certifications.map((c: any, i: number) => (
            <p key={i} className="text-foreground/70">{c.name}{c.year ? ` (${c.year})` : ""}</p>
          ))}
        </>
      )}

      {languages.length > 0 && (
        <>
          <p className="text-primary font-bold uppercase tracking-wider text-[10px] border-b border-primary/30 pb-1">{h.languages}</p>
          <p className="text-foreground/70">{languages.map((l: any) => `${l.language} (${l.level || ""})`).join(", ")}</p>
        </>
      )}
    </div>
  );
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
  const [downloading, setDownloading] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const trackEvent = useTrackEvent();

  // Shared HTML for preview + print
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const printIframeRef = useRef<HTMLIFrameElement>(null);

  // Formal review state
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("idle");
  const [reviewFixes, setReviewFixes] = useState<ReviewFix[]>([]);
  const [reviewedCv, setReviewedCv] = useState<Record<string, unknown> | null>(null);
  const [fixesOpen, setFixesOpen] = useState(false);
  const reviewCalledRef = useRef(false);

  useEffect(() => {
    if (reviewCalledRef.current) return;
    reviewCalledRef.current = true;
    setReviewStatus("reviewing");

    supabase.functions
      .invoke("cv-formal-review", { body: { cv: tailoredCv, template_id: "visual" } })
      .then(({ data, error }) => {
        if (error || !data) {
          setReviewStatus("error");
          return;
        }
        const fixes = (data.fixes as ReviewFix[]) || [];
        setReviewFixes(fixes);
        setReviewedCv(data.revised_cv || tailoredCv);
        setReviewStatus("done");
        if (fixes.length > 0) setFixesOpen(true);
      })
      .catch(() => setReviewStatus("error"));
  }, [tailoredCv]);

  const activeCv = reviewedCv || tailoredCv;
  const personalName = (activeCv?.personal as any)?.name || "CV";
  const matchScore = analyzeResult?.match_score ?? 0;
  const atsScore = analyzeResult?.ats_score ?? 0;
  const effectiveLang = cvLang || "it";

  const stats = useMemo(() =>
    computeConfidence(tailorResult.original_cv ?? null, activeCv, tailorResult.diff),
    [tailorResult.original_cv, activeCv, tailorResult.diff]
  );

  const fileBaseName = "CV-" + personalName.replace(/\s+/g, "-") + "-" + jobData.company_name.replace(/\s+/g, "-");

  // PDF via hidden iframe print — no popup
  const handleDownloadPdf = useCallback(() => {
    if (!previewHtml) {
      toast.error("Preview non ancora caricata. Riprova tra un momento.");
      return;
    }
    setDownloading(true);
    const iframe = printIframeRef.current;
    if (!iframe) { setDownloading(false); return; }

    iframe.srcdoc = previewHtml;
    iframe.onload = () => {
      try {
        iframe.contentWindow?.print();
        trackEvent("pdf_downloaded", { template: "visual", formal_review: reviewStatus === "done", method: "iframe_print" });
        toast.success("Finestra di stampa aperta — salva come PDF.");
      } catch (e) {
        console.error("Print error:", e);
        toast.error("Errore durante la stampa.");
      } finally {
        setDownloading(false);
      }
    };
  }, [previewHtml, reviewStatus, trackEvent]);

  const handleDownloadDocx = async () => {
    setDownloadingDocx(true);
    try {
      const blob = await generateDocx(activeCv as Record<string, any>, effectiveLang);
      const fileName = fileBaseName + "-ATS.docx";

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
      trackEvent("docx_downloaded", { template: "ats", formal_review: reviewStatus === "done" });
    } catch (e) {
      console.error("DOCX generation error:", e);
      toast.error("Errore durante la generazione del DOCX.");
    } finally {
      setDownloadingDocx(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={20} /></button>
        <div>
          <h2 className="font-display text-2xl font-bold">Scarica il tuo CV</h2>
          <p className="text-muted-foreground mt-1">Due versioni ottimizzate per ogni scenario.</p>
        </div>
      </div>

      {/* Review status banner */}
      {reviewStatus === "reviewing" && (
        <div className="flex items-center gap-2 rounded-lg border border-info/20 bg-info/5 px-4 py-3 text-sm text-info">
          <SpinnerGap size={16} className="animate-spin" /> Revisione formale in corso...
        </div>
      )}
      {reviewStatus === "done" && reviewFixes.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <CheckCircle size={18} weight="fill" /> Nessuna correzione necessaria — il tuo CV è pronto.
        </div>
      )}

      {/* Fixes panel */}
      {reviewStatus === "done" && reviewFixes.length > 0 && (
        <Collapsible open={fixesOpen} onOpenChange={setFixesOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 w-full rounded-lg border border-border/50 bg-card px-4 py-3 text-sm font-medium text-foreground hover:border-primary/30 transition-colors">
              <Pencil size={16} className="text-warning" />
              <span>{reviewFixes.length} correzioni formali applicate</span>
              <span className="ml-auto">{fixesOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2">
              {reviewFixes.map((fix, i) => (
                <div key={i} className="rounded-lg border border-border/30 bg-card/50 px-4 py-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 rounded bg-warning/15 px-1.5 py-0.5 font-mono text-[11px] text-warning uppercase">{fix.section}</span>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">{fix.field}</span>
                  </div>
                  <p className="mt-2 text-muted-foreground">{fix.problem}</p>
                  <p className="mt-1 text-foreground">{fix.correction}</p>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

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
      </div>

      {/* Download buttons — always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button onClick={handleDownloadPdf} disabled={downloading || !previewHtml} className="gap-2 h-12 active:scale-[0.98] transition-transform text-base">
          {downloading ? <><SpinnerGap size={18} className="animate-spin" /> Generazione...</> : <><Printer size={18} /> Stampa / Salva PDF</>}
        </Button>
        <Button variant="outline" onClick={handleDownloadDocx} disabled={downloadingDocx} className="gap-2 h-12 active:scale-[0.98] transition-transform text-base">
          {downloadingDocx ? <><SpinnerGap size={18} className="animate-spin" /> Generazione DOCX...</> : <><FileDoc size={18} /> Scarica DOCX</>}
        </Button>
      </div>

      {/* 2-card layout — previews only */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold">CV Recruiter</h3>
              <p className="text-xs text-muted-foreground">Template visual per recruiter</p>
            </div>
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 font-mono text-[11px] text-primary font-bold">PDF</span>
          </div>
          <CVPreview cv={activeCv} templateId="visual" lang={effectiveLang} onHtmlLoaded={setPreviewHtml} />
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold">CV ATS</h3>
              <p className="text-xs text-muted-foreground">Formato Word per sistemi automatici</p>
            </div>
            <span className="rounded-full bg-info/15 px-2.5 py-0.5 font-mono text-[11px] text-info font-bold">DOCX</span>
          </div>
          <ATSPreview cv={activeCv as Record<string, any>} lang={effectiveLang} />
        </div>
      </div>

      {/* Template teaser */}
      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Altri template recruiter</p>
        <div className="grid grid-cols-3 gap-2">
          {["Executive", "Minimal", "Moderno"].map((name) => (
            <div key={name} className="relative rounded-lg border border-border/30 bg-card/50 p-4 text-center opacity-50">
              <Lock size={20} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">{name}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Prossimamente con Verso Pro</p>
            </div>
          ))}
        </div>
      </div>

      <Button variant="outline" onClick={onNext} className="w-full gap-2 text-muted-foreground">
        Salta per ora <ArrowRight size={16} />
      </Button>

      {/* Hidden iframe for printing — no popup needed */}
      <iframe
        ref={printIframeRef}
        style={{ position: "absolute", left: "-9999px", width: "794px", height: "1123px" }}
        sandbox="allow-same-origin allow-modals"
        title="Print CV"
      />
    </div>
  );
}
