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
  FileDoc, CheckCircle, CaretDown, CaretUp, Pencil, Printer
} from "@phosphor-icons/react";
import { type TemplateId } from "@/components/cv-templates";
import { generateDocx } from "@/components/cv-templates/docx-generator";
import { h } from "@/components/cv-templates/template-utils";
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

// --- Word Preview helpers ---

function wSan(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/\u2014/g, "-").replace(/\u2013/g, "-")
    .replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
}

function wDate(d: string | undefined | null): string {
  if (!d) return "";
  const s = String(d).trim();
  if (/^\d{2}\/\d{4}$/.test(s)) return s;
  const iso = s.match(/^(\d{4})-(\d{2})/);
  if (iso) return `${iso[2]}/${iso[1]}`;
  const months: Record<string, string> = {
    gen:"01",gennaio:"01",jan:"01",january:"01",feb:"02",febbraio:"02",february:"02",
    mar:"03",marzo:"03",march:"03",apr:"04",aprile:"04",april:"04",
    mag:"05",maggio:"05",may:"05",giu:"06",giugno:"06",jun:"06",june:"06",
    lug:"07",luglio:"07",jul:"07",july:"07",ago:"08",agosto:"08",aug:"08",august:"08",
    set:"09",settembre:"09",sep:"09",september:"09",ott:"10",ottobre:"10",oct:"10",october:"10",
    nov:"11",novembre:"11",november:"11",dic:"12",dicembre:"12",dec:"12",december:"12",
  };
  const m = s.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (m) { const mm = months[m[1].toLowerCase()]; if (mm) return `${mm}/${m[2]}`; }
  if (/^\d{4}$/.test(s)) return s;
  return wSan(s);
}

function wClean(v: unknown): string {
  if (typeof v !== "string") return "";
  const t = v.trim();
  return ["None","none","null","N/A","n/a","undefined","N/D","n/d"].includes(t) ? "" : t;
}

function generateWordHtml(cv: Record<string, any>, _templateId: string, lang: string): string {
  const ws = { sectionColor: "#111111", accentColor: "#111111", bulletChar: "•", uppercase: true, borderBottom: true, nameAlign: "left", headerRule: false, nameSize: "18pt" };

  const sec = (title: string) => {
    const display = ws.uppercase ? title.toUpperCase() : title;
    const border = ws.borderBottom ? `border-bottom:1.5px solid ${ws.accentColor};padding-bottom:2pt;` : "";
    return `<p style="font-size:11pt;font-weight:bold;color:${ws.sectionColor};${border}margin:14pt 0 5pt 0">${wSan(display)}</p>`;
  };

  const personal = cv.personal || {};
  const name = wSan(wClean(personal.name));
  const contactParts = [personal.email, personal.phone, personal.location, personal.linkedin, personal.website]
    .map(wClean).filter(Boolean);
  const summary = wSan(wClean(cv.summary));
  const experiences: any[] = Array.isArray(cv.experience) ? cv.experience : [];
  const education: any[] = Array.isArray(cv.education) ? cv.education : [];
  const skills = cv.skills;
  const allSkills: string[] = skills
    ? (Array.isArray(skills)
        ? skills
        : [...(Array.isArray(skills.technical) ? skills.technical : []),
           ...(Array.isArray(skills.soft) ? skills.soft : []),
           ...(Array.isArray(skills.tools) ? skills.tools : [])]
      ).filter(Boolean)
    : [];
  const languages: any[] = skills?.languages && Array.isArray(skills.languages) ? skills.languages : [];
  const certifications: any[] = Array.isArray(cv.certifications) ? cv.certifications : [];
  const projects: any[] = Array.isArray(cv.projects) ? cv.projects : [];
  const extraSections: any[] = Array.isArray(cv.extra_sections) ? cv.extra_sections : [];

  let body = "";

  // Name
  body += `<p style="font-size:${ws.nameSize};font-weight:bold;text-align:${ws.nameAlign};margin:0 0 3pt 0;color:#111">${name}</p>`;

  // Contacts
  if (contactParts.length > 0) {
    body += `<p style="font-size:9pt;color:#666;text-align:${ws.nameAlign};margin:0 0 ${ws.headerRule ? "8pt" : "14pt"} 0">${wSan(contactParts.join("  ·  "))}</p>`;
  }

  // Header rule (executive / moderno)
  if (ws.headerRule) {
    body += `<div style="border-top:3px solid ${ws.accentColor};margin:0 0 12pt 0"></div>`;
  }

  // Summary
  if (summary) {
    body += sec(h("profile", lang));
    body += `<p style="font-size:11pt;line-height:1.45;margin:0 0 8pt 0">${summary}</p>`;
  }

  // Experience
  if (experiences.length > 0) {
    body += sec(h("experience", lang));
    for (const exp of experiences) {
      const role = wSan(wClean(exp.role) || wClean(exp.title));
      const company = wSan(wClean(exp.company));
      const start = wDate(exp.start || exp.period);
      const end = exp.end ? wDate(exp.end) : (exp.current ? h("present", lang) : "");
      const period = [start, end].filter(Boolean).join(" - ");
      const location = wSan(wClean(exp.location));
      const description = wSan(wClean(exp.description));
      const bullets: string[] = Array.isArray(exp.bullets) ? exp.bullets.filter((b: any) => wClean(String(b))) : [];

      body += `<p style="font-size:11pt;font-weight:bold;margin:10pt 0 2pt 0">${role}</p>`;
      if (company) body += `<p style="font-size:10pt;font-weight:bold;color:#333;margin:0 0 2pt 0">${company}${location ? `&nbsp;&nbsp;·&nbsp;&nbsp;${location}` : ""}</p>`;
      if (period) body += `<p style="font-size:9pt;color:#666;font-style:italic;margin:0 0 4pt 0">${period}</p>`;
      if (description) body += `<p style="font-size:10pt;margin:0 0 3pt 0;line-height:1.4">${description}</p>`;
      for (const b of bullets) {
        body += `<p style="font-size:10pt;margin:0 0 2pt 0;padding-left:10pt">${ws.bulletChar}&nbsp;${wSan(String(b))}</p>`;
      }
    }
  }

  // Education
  if (education.length > 0) {
    body += sec(h("education", lang));
    for (const ed of education) {
      const degreeField = wSan(`${wClean(ed.degree)}${wClean(ed.field) ? ` in ${wClean(ed.field)}` : ""}`);
      const institution = wSan(wClean(ed.institution));
      const start = wDate(ed.start || ed.period);
      const end = ed.end ? wDate(ed.end) : "";
      const period = [start, end].filter(Boolean).join(" - ");
      const grade = wSan(wClean(ed.grade));

      body += `<p style="font-size:11pt;font-weight:bold;margin:10pt 0 2pt 0">${degreeField}</p>`;
      if (institution) body += `<p style="font-size:10pt;font-style:italic;color:#333;margin:0 0 2pt 0">${institution}</p>`;
      const metaParts = [period, grade].filter(Boolean);
      if (metaParts.length > 0) body += `<p style="font-size:9pt;color:#666;margin:0 0 4pt 0">${metaParts.join("  ·  ")}</p>`;
    }
  }

  // Skills
  if (allSkills.length > 0) {
    body += sec(h("skills", lang));
    body += `<p style="font-size:10pt;margin:0 0 8pt 0">${allSkills.map(wSan).join("  ·  ")}</p>`;
  }

  // Languages
  if (languages.length > 0) {
    body += sec(h("languages", lang));
    for (const l of languages) {
      body += `<p style="font-size:10pt;margin:0 0 2pt 0">${wSan(`${wClean(l.language)}${wClean(l.level) ? ` - ${wClean(l.level)}` : ""}`)}</p>`;
    }
  }

  // Certifications
  if (certifications.length > 0) {
    body += sec(h("certifications", lang));
    for (const cert of certifications) {
      const line = `<b>${wSan(cert.name)}</b>${wClean(cert.issuer) ? ` - ${wSan(cert.issuer)}` : ""}${wClean(cert.year) ? ` (${wSan(cert.year)})` : ""}`;
      body += `<p style="font-size:10pt;margin:0 0 3pt 0">${line}</p>`;
    }
  }

  // Projects
  if (projects.length > 0) {
    body += sec(h("projects", lang));
    for (const proj of projects) {
      body += `<p style="font-size:11pt;font-weight:bold;margin:8pt 0 2pt 0">${wSan(wClean(proj.name))}</p>`;
      if (wClean(proj.description)) body += `<p style="font-size:10pt;margin:0 0 3pt 0">${wSan(proj.description)}</p>`;
    }
  }

  // Extra sections
  for (const xsec of extraSections) {
    if (!xsec.title) continue;
    body += sec(wSan(xsec.title));
    const items: string[] = Array.isArray(xsec.items) ? xsec.items.filter((i: string) => wClean(i)) : [];
    for (const item of items) {
      body += `<p style="font-size:10pt;margin:0 0 2pt 0;padding-left:10pt">${ws.bulletChar}&nbsp;${wSan(item)}</p>`;
    }
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: white; padding: 18mm 16mm; font-family: Calibri, Arial, sans-serif; color: #111; -webkit-font-smoothing: antialiased; }
  </style></head><body>${body}</body></html>`;
}

function WordPreview({ cv, templateId, lang }: { cv: Record<string, any>; templateId: string; lang: string }) {
  const html = useMemo(() => generateWordHtml(cv, templateId, lang), [cv, templateId, lang]);
  return (
    <div className="w-full rounded-xl border border-border/30 overflow-hidden shadow-lg bg-white" style={{ aspectRatio: "1/1.414" }}>
      <iframe
        srcDoc={html}
        className="w-full h-full border-0"
        sandbox="allow-same-origin"
        title="Word Preview"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

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
  const selectedTemplate: TemplateId = "classico";
  const [downloading, setDownloading] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [previewMode, setPreviewMode] = useState<"pdf" | "word">("pdf");
  const trackEvent = useTrackEvent();

  // Formal review state
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("idle");
  const [reviewFixes, setReviewFixes] = useState<ReviewFix[]>([]);
  const [reviewedCv, setReviewedCv] = useState<Record<string, unknown> | null>(null);
  const [fixesOpen, setFixesOpen] = useState(false);
  const reviewCalledRef = useRef(false);
  const MAX_REVIEW_RETRIES = 3;
  const RETRY_DELAY_MS = 2000;

  // Launch review in background on mount with retry logic
  useEffect(() => {
    if (reviewCalledRef.current) return;
    reviewCalledRef.current = true;

    async function runReview(attempt: number) {
      setReviewStatus("reviewing");
      try {
        const { data, error } = await supabase.functions.invoke("cv-formal-review", {
          body: { cv: tailoredCv, template_id: selectedTemplate, lang: cvLang || "it" },
        });
        if (error || !data) {
          throw new Error(error?.message || "Review failed");
        }
        const fixes = (data.fixes as ReviewFix[]) || [];
        setReviewFixes(fixes);
        setReviewedCv(data.revised_cv || tailoredCv);
        setReviewStatus("done");
        if (fixes.length > 0) setFixesOpen(true);
      } catch (e) {
        console.error(`cv-formal-review attempt ${attempt} error:`, e);
        if (attempt < MAX_REVIEW_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
          return runReview(attempt + 1);
        }
        // All retries exhausted — silently fall back to original CV
        setReviewStatus("done");
        setReviewFixes([]);
        setReviewedCv(null);
      }
    }

    runReview(1);
  }, [tailoredCv, selectedTemplate, cvLang]);

  // The CV to use for downloads: reviewed if available, otherwise original
  const activeCv = reviewedCv || tailoredCv;

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
    setDownloadingDocx(true);
    try {
      const blob = await generateDocx(activeCv as Record<string, any>, effectiveLang, selectedTemplate);
      const fileName = fileBaseName + ".docx";

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
          <p className="text-muted-foreground mt-1">Anteprima e download del tuo CV.</p>
        </div>
      </div>

      {/* Preview mode toggle */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        <button
          onClick={() => setPreviewMode("pdf")}
          className={["px-3 py-1.5 text-xs font-medium rounded-md transition-colors", previewMode === "pdf" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"].join(" ")}
        >
          PDF
        </button>
        <button
          onClick={() => setPreviewMode("word")}
          className={["px-3 py-1.5 text-xs font-medium rounded-md transition-colors", previewMode === "word" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"].join(" ")}
        >
          Word
        </button>
      </div>

      {/* Live CV Preview */}
      {previewMode === "pdf"
        ? <CVPreview cv={activeCv} templateId={selectedTemplate} lang={effectiveLang} />
        : <WordPreview cv={activeCv as Record<string, any>} templateId={selectedTemplate} lang={effectiveLang} />
      }

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
          {downloadingDocx ? (
            <><SpinnerGap size={16} className="animate-spin" /> Generazione DOCX...</>
          ) : (
            <><FileDoc size={16} /> Scarica DOCX</>
          )}
          {!isPro && (
            <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[11px] text-primary font-bold">
              Pro
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
