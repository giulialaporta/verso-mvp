import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Link as LinkIcon,
  TextAa,
  Buildings,
  Briefcase,
  CheckCircle,
  XCircle,
  Warning,
  ChartLineUp,
  MagicWand,
  DownloadSimple,
  SpinnerGap,
  FileArrowUp,
  LinkedinLogo,
  Globe,
  Info,
  CaretDown,
  GraduationCap,
  ShieldWarning,
  ChatTeardropDots,
  Target,
  ArrowClockwise,
  Lock,
  PaperPlaneTilt,
  Clock,
  Plus,
  Eye,
  Pencil,
  ListChecks,
} from "@phosphor-icons/react";
import { ClassicoTemplate, MinimalTemplate, TEMPLATES } from "@/components/cv-templates";
import { InlineEdit } from "@/components/InlineEdit";
import { EditableSkillChips } from "@/components/EditableSkillChips";
import { SalaryAnalysisCard, type SalaryAnalysis } from "@/components/SalaryAnalysisCard";

// ==================== Types ====================

type JobData = {
  company_name: string;
  role_title: string;
  location?: string;
  job_type?: string;
  description: string;
  key_requirements: string[];
  required_skills: string[];
  nice_to_have?: string[];
};

type PrescreenResult = {
  detected_language: string;
  requirements_analysis: {
    requirement: string;
    priority: "mandatory" | "preferred" | "nice_to_have";
    candidate_has: boolean;
    gap_type: "none" | "bridgeable" | "unbridgeable";
    explanation: string;
  }[];
  dealbreakers: {
    requirement: string;
    severity: "critical" | "significant";
    message: string;
  }[];
  follow_up_questions: {
    id: string;
    question: string;
    context: string;
    field: string;
  }[];
  overall_feasibility: "low" | "medium" | "high";
  feasibility_note: string;
  salary_analysis?: SalaryAnalysis;
};

type LearningSuggestion = {
  skill: string;
  resource_name: string;
  url: string;
  type: "course" | "certification" | "tutorial";
  duration?: string;
};

type StructuralChange = {
  action: "removed" | "reordered" | "condensed";
  section: string;
  item: string;
  reason: string;
};

type AnalyzeResult = {
  match_score: number;
  score_note?: string;
  ats_score: number;
  skills_present: { label: string; has: boolean }[];
  skills_missing: { label: string; importance: string }[];
  seniority_match: {
    candidate_level: string;
    role_level: string;
    match: boolean;
    note: string;
  };
  ats_checks: {
    check: string;
    label: string;
    status: "pass" | "warning" | "fail";
    detail?: string;
  }[];
  suggestions?: { type: string; message: string }[];
  learning_suggestions?: LearningSuggestion[];
  detected_language: string;
  master_cv_id: string;
};

type TailorResult = {
  tailored_cv: Record<string, unknown>;
  tailored_patches?: Array<{ path: string; value: unknown }>;
  original_cv?: Record<string, unknown>;
  structural_changes?: StructuralChange[];
  honest_score: {
    confidence: number;
    experiences_added: number;
    skills_invented: number;
    dates_modified: number;
    bullets_repositioned: number;
    bullets_rewritten: number;
    sections_removed: number;
    flags: string[];
  };
  diff: {
    section: string;
    index?: number;
    original: string;
    suggested: string;
    reason: string;
    patch_path?: string;
  }[];
  master_cv_id: string;
};

// ==================== Step Indicator (6 steps) ====================
function StepIndicator({ current }: { current: number }) {
  const steps = ["Annuncio", "Analisi", "Tailoring", "Revisione", "Export", "Completa"];
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1 sm:gap-1.5">
          <div
            className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full font-mono text-[10px] sm:text-xs font-medium transition-colors ${
              i < current
                ? "bg-primary text-primary-foreground"
                : i === current
                  ? "bg-primary/20 text-primary ring-2 ring-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i < current ? <CheckCircle size={12} weight="fill" /> : i + 1}
          </div>
          <span className={`hidden lg:inline text-[11px] ${i === current ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {label}
          </span>
          {i < steps.length - 1 && <div className="w-3 sm:w-6 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

// ==================== Utilities ====================

const PROBLEMATIC_DOMAINS = [
  { pattern: "glassdoor.com", hint: "Glassdoor richiede login e potrebbe bloccare lo scraping." },
  { pattern: "ashbyhq.com", hint: "Ashby usa pagine dinamiche che bloccano lo scraping." },
  { pattern: "lever.co", hint: "Lever potrebbe bloccare le richieste automatiche." },
  { pattern: "greenhouse.io", hint: "Greenhouse usa pagine dinamiche difficili da leggere." },
];

function getDomainHint(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const match = PROBLEMATIC_DOMAINS.find((d) => hostname.includes(d.pattern));
    if (match) return `${match.hint} Prova a copiare il testo.`;
  } catch { /* invalid URL */ }
  return null;
}

function useAnimatedCounter(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prevTargetRef = useRef<number | null>(null);
  useEffect(() => {
    if (target <= 0) return;
    if (prevTargetRef.current === target) return;
    prevTargetRef.current = target;
    setValue(0);
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return value;
}

function applyPatchesFrontend(
  original: Record<string, unknown>,
  patches: Array<{ path: string; value: unknown }>
): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(original));
  for (const patch of patches) {
    const { path, value } = patch;
    const segments = path.replace(/\[(\d+)\]/g, ".$1").split(".");
    let target = result;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const idx = Number(seg);
      if (!isNaN(idx)) target = target[idx];
      else {
        if (target[seg] === undefined || target[seg] === null) {
          const nextSeg = segments[i + 1];
          target[seg] = !isNaN(Number(nextSeg)) ? [] : {};
        }
        target = target[seg];
      }
      if (target === undefined || target === null) break;
    }
    if (target === undefined || target === null) continue;
    const lastSeg = segments[segments.length - 1];
    const lastIdx = Number(lastSeg);
    if (!isNaN(lastIdx)) target[lastIdx] = value;
    else target[lastSeg] = value;
  }
  return result;
}

/** Deterministic confidence calculation from CV comparison */
function computeConfidence(
  original: Record<string, unknown> | null,
  tailored: Record<string, unknown>,
  diff: TailorResult["diff"]
): { confidence: number; bulletsRewritten: number; bulletsAdded: number; sectionsRemoved: number; experiencesKept: number; experiencesOriginal: number } {
  const origExp = Array.isArray((original as any)?.experience) ? (original as any).experience : [];
  const tailExp = Array.isArray((tailored as any)?.experience) ? (tailored as any).experience : [];

  const experiencesOriginal = origExp.length;
  const experiencesKept = tailExp.length;
  const sectionsRemoved = Math.max(0, experiencesOriginal - experiencesKept);

  // Count bullet changes from diff
  const bulletDiffs = diff.filter(d => d.section?.toLowerCase().includes("experience") || d.section?.toLowerCase().includes("esperienza"));
  const bulletsRewritten = bulletDiffs.length;

  // Count added bullets (bullets in tailored not in original)
  let bulletsAdded = 0;
  tailExp.forEach((exp: any, i: number) => {
    const origBulletsArr = Array.isArray(origExp[i]?.bullets) ? origExp[i].bullets : [];
    const tailBulletsArr = Array.isArray(exp?.bullets) ? exp.bullets : [];
    const origBullets = origBulletsArr.length;
    const tailBullets = tailBulletsArr.length;
    if (tailBullets > origBullets) bulletsAdded += tailBullets - origBullets;
  });

  // Deterministic confidence: starts at 100, penalize for aggressive changes
  let confidence = 100;
  confidence -= sectionsRemoved * 8;
  confidence -= bulletsRewritten * 2;
  confidence -= bulletsAdded * 5;
  confidence = Math.max(0, Math.min(100, Math.round(confidence)));

  return { confidence, bulletsRewritten, bulletsAdded, sectionsRemoved, experiencesKept, experiencesOriginal };
}

// ==================== Step 0: Job Input ====================
function StepAnnuncio({
  onConfirm,
  initialJobData,
}: {
  onConfirm: (data: JobData, jobUrl?: string, jobText?: string) => void;
  initialJobData?: JobData | null;
}) {
  const [tab, setTab] = useState<string>("text");
  const [guideOpen, setGuideOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState(initialJobData?.description || "");
  const [companyName, setCompanyName] = useState(initialJobData?.company_name || "");
  const [loading, setLoading] = useState(false);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setLoading(false);
    toast.error("Il sito non risponde. Copia il testo dell'annuncio e usa il tab Testo.");
    setTab("text");
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!companyName.trim()) { toast.error("Inserisci il nome dell'azienda"); return; }
    setLoading(true);
    setJobData(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = tab === "url" ? setTimeout(() => controller.abort(), 25000) : undefined;

    try {
      const body: Record<string, string> = {};
      if (tab === "url") {
        if (!url.trim()) { toast.error("Inserisci un URL"); setLoading(false); return; }
        body.url = url.trim();
      } else {
        if (text.trim().length < 30) { toast.error("Il testo è troppo corto"); setLoading(false); return; }
        body.text = text.trim();
      }
      const { data, error } = await supabase.functions.invoke("scrape-job", { body, signal: controller.signal as AbortSignal });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const merged = { ...data.job_data, company_name: companyName.trim() || data.job_data.company_name };
      setJobData(merged);
    } catch (e: unknown) {
      if (controller.signal.aborted) {
        toast.error("Il sito non risponde. Copia il testo dell'annuncio e usa il tab Testo.");
        setTab("text");
        return;
      }
      const msg = e instanceof Error ? e.message : "Errore durante l'analisi";
      if (tab === "url") {
        const domainHint = getDomainHint(url);
        toast.error(domainHint || msg);
        setTab("text");
        toast.info("Prova a incollare il testo dell'annuncio direttamente.");
      } else {
        toast.error(msg);
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setLoading(false);
    }
  }, [tab, url, text, companyName]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4">
      <div>
        <h2 className="font-display text-2xl font-bold">L'annuncio</h2>
        <p className="text-muted-foreground mt-1">Incolla il link o il testo dell'offerta di lavoro.</p>
      </div>

      {!jobData ? (
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Buildings size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Es. Google, Accenture, Intesa Sanpaolo..." value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={loading} className="pl-9" />
            </div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full">
                <TabsTrigger value="text" className="flex-1 gap-2"><TextAa size={16} /> Testo</TabsTrigger>
                <TabsTrigger value="url" className="flex-1 gap-2 text-xs"><LinkIcon size={16} /> URL <span className="text-[10px] text-muted-foreground hidden sm:inline">(solo alcuni siti)</span></TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="mt-4 space-y-3">
                <Textarea placeholder="Incolla qui il testo completo dell'annuncio..." value={text} onChange={(e) => setText(e.target.value)} disabled={loading} rows={10} className="resize-none" />
                <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                    <Info size={14} /><span>Come copiare da LinkedIn, Indeed...</span>
                    <CaretDown size={12} className={`ml-auto transition-transform duration-200 ${guideOpen ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="mt-3 rounded-lg border border-border/50 bg-surface p-4 space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <LinkedinLogo size={16} className="text-info shrink-0 mt-0.5" />
                        <div>
                          <p className="text-foreground font-medium mb-1">LinkedIn</p>
                          <ol className="list-decimal list-inside space-y-0.5">
                            <li>Apri l'annuncio su LinkedIn</li><li>Seleziona tutto il testo (Ctrl+A / ⌘+A)</li><li>Copia (Ctrl+C / ⌘+C)</li><li>Incolla qui</li>
                          </ol>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Globe size={16} className="text-info shrink-0 mt-0.5" />
                        <div>
                          <p className="text-foreground font-medium mb-1">Indeed, InfoJobs, Monster, Glassdoor</p>
                          <p>Stesso metodo. Apri l'annuncio, seleziona il testo e incollalo qui.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 border-t border-border/30 pt-2">
                        <Info size={14} className="text-warning shrink-0 mt-0.5" />
                        <p><span className="text-foreground font-medium">Tip:</span> Puoi anche provare il tab URL incollando il link dell'annuncio. Se non funziona, il testo è sempre l'opzione più affidabile.</p>
                      </div>
                    </motion.div>
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>
              <TabsContent value="url" className="mt-4">
                <Input placeholder="https://www.linkedin.com/jobs/view/..." value={url} onChange={(e) => setUrl(e.target.value)} disabled={loading} />
                <p className="text-[10px] text-muted-foreground mt-2">Se l'URL non funziona, copia il testo dell'annuncio e usa il tab Testo.</p>
              </TabsContent>
            </Tabs>
            {loading ? (
              <Button onClick={handleCancel} variant="destructive" className="w-full gap-2"><XCircle size={16} /> Annulla</Button>
            ) : (
              <Button onClick={handleAnalyze} className="w-full gap-2"><MagicWand size={16} /> Analizza</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-primary/30 bg-card/80">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Buildings size={24} className="text-info mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold">{jobData.company_name}</h3>
                  <p className="text-primary font-medium">{jobData.role_title}</p>
                  {jobData.location && <p className="text-sm text-muted-foreground">{jobData.location}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Requisiti chiave</p>
                <ul className="space-y-1">
                  {jobData.key_requirements.slice(0, 5).map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><Briefcase size={14} className="text-primary mt-0.5 shrink-0" /><span>{req}</span></li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobData.required_skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono text-primary">{skill}</span>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setJobData(null)} className="gap-2"><ArrowLeft size={16} /> Modifica</Button>
                <Button className="flex-1 gap-2" onClick={() => onConfirm(jobData, tab === "url" ? url : undefined, tab === "text" ? text : undefined)}>
                  Conferma e verifica <ArrowRight size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ==================== Step 1: Pre-screening ====================
function StepVerifica({
  prescreenResult,
  loading,
  onProceed,
  onBack,
}: {
  prescreenResult: PrescreenResult | null;
  loading: boolean;
  onProceed: (answers: { question: string; answer: string }[]) => void;
  onBack: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Pre-screening</h2>
          <p className="text-muted-foreground mt-1">Verso sta analizzando i requisiti dell'annuncio...</p>
        </div>
        {["Classificazione requisiti...", "Analisi gap...", "Generazione domande..."].map((msg, i) => (
          <motion.div key={msg} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.8, duration: 0.4 }}>
            <Card className="border-border/30 bg-card/60">
              <CardContent className="py-5">
                <div className="flex items-center gap-3"><SpinnerGap size={18} className="text-primary animate-spin" /><span className="text-sm text-muted-foreground">{msg}</span></div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  if (!prescreenResult) return null;

  const feasibilityColors = { low: "text-destructive", medium: "text-warning", high: "text-primary" };
  const feasibilityLabels = { low: "Bassa", medium: "Media", high: "Alta" };

  const handleProceed = () => {
    const formattedAnswers = prescreenResult.follow_up_questions
      .filter((q) => answers[q.id]?.trim())
      .map((q) => ({ question: q.question, answer: answers[q.id].trim() }));
    onProceed(formattedAnswers);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={20} /></button>
        <div>
          <h2 className="font-display text-2xl font-bold">Verifica compatibilità</h2>
          <p className="text-muted-foreground mt-1">Analisi onesta dei requisiti prima di procedere.</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Fattibilità candidatura</span>
              <span className={`font-mono text-lg font-bold ${feasibilityColors[prescreenResult.overall_feasibility]}`}>{feasibilityLabels[prescreenResult.overall_feasibility]}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{prescreenResult.feasibility_note}</p>
          </CardContent>
        </Card>
      </motion.div>

      {prescreenResult.dealbreakers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-destructive/40 bg-card/80">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2"><ShieldWarning size={20} className="text-destructive" weight="fill" /><span className="text-sm font-medium text-destructive">Gap significativi</span></div>
              <div className="space-y-3">
                {prescreenResult.dealbreakers.map((db, i) => (
                  <div key={i} className="border-l-2 border-destructive/40 pl-3 space-y-1">
                    <p className="text-sm font-medium">{db.requirement}</p>
                    <p className="text-sm text-muted-foreground">{db.message}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic pt-2 border-t border-border/30">Verso non ti impedisce di candidarti, ma vuole che tu sia consapevole di questi gap.</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-5 space-y-3">
            <p className="text-sm font-medium">Requisiti analizzati</p>
            <div className="space-y-2">
              {prescreenResult.requirements_analysis.map((req, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {req.candidate_has ? (
                    <CheckCircle size={16} className="text-primary mt-0.5 shrink-0" weight="fill" />
                  ) : req.gap_type === "unbridgeable" ? (
                    <XCircle size={16} className="text-destructive mt-0.5 shrink-0" weight="fill" />
                  ) : (
                    <Warning size={16} className="text-warning mt-0.5 shrink-0" weight="fill" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span>{req.requirement}</span>
                    <span className={`ml-2 font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-full ${
                      req.priority === "mandatory" ? "bg-destructive/10 text-destructive"
                      : req.priority === "preferred" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                    }`}>{req.priority === "mandatory" ? "obbligatorio" : req.priority === "preferred" ? "preferito" : "gradito"}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {prescreenResult.salary_analysis && (
        <SalaryAnalysisCard data={prescreenResult.salary_analysis} delay={0.35} />
      )}

      {prescreenResult.follow_up_questions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-info/30 bg-card/80">
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-2"><ChatTeardropDots size={20} className="text-info" weight="fill" /><span className="text-sm font-medium">Aiutaci a conoscerti meglio</span></div>
              <p className="text-xs text-muted-foreground">Rispondi alle domande per aiutare Verso a scoprire competenze non esplicite nel tuo CV. Le risposte sono facoltative.</p>
              <div className="space-y-4">
                {prescreenResult.follow_up_questions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-medium">{q.question}</p>
                    <p className="text-xs text-muted-foreground italic">{q.context}</p>
                    <Textarea value={answers[q.id] || ""} onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))} placeholder="La tua risposta (facoltativa)..." rows={2} className="resize-none" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2"><ArrowLeft size={16} /> Indietro</Button>
        <Button className="flex-1 gap-2" onClick={handleProceed}>Prosegui con l'analisi <ArrowRight size={16} /></Button>
      </div>
    </div>
  );
}

// ==================== Step 2: Score + Tailoring trigger ====================
function StepTailoring({
  analyzeResult,
  analyzeLoading,
  tailoring,
  onGenerateCv,
  onAbandon,
  onBack,
  selectedLanguage,
  onLanguageChange,
  overriddenSkills,
  onToggleSkill,
}: {
  analyzeResult: AnalyzeResult | null;
  analyzeLoading: boolean;
  tailoring: boolean;
  onGenerateCv: () => void;
  onAbandon: () => void;
  onBack: () => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  overriddenSkills: Set<string>;
  onToggleSkill: (skill: string) => void;
}) {
  const animatedScore = useAnimatedCounter(analyzeResult?.match_score ?? 0);
  const animatedAts = useAnimatedCounter(analyzeResult?.ats_score ?? 0);

  if (analyzeLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        <div><h2 className="font-display text-2xl font-bold">Analisi in corso</h2><p className="text-muted-foreground mt-1">Verso sta confrontando il tuo CV con l'annuncio...</p></div>
        {["Confronto competenze...", "Calcolo match score...", "Analisi ATS..."].map((msg, i) => (
          <motion.div key={msg} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 1.2, duration: 0.4 }}>
            <Card className="border-border/30 bg-card/60"><CardContent className="py-6">
              <div className="flex items-center gap-3"><SpinnerGap size={20} className="text-primary animate-spin" /><span className="text-sm text-muted-foreground">{msg}</span></div>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-destructive via-warning to-primary" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ delay: i * 1.2, duration: 2, ease: "easeOut" }} /></div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>
    );
  }

  if (tailoring) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        <div><h2 className="font-display text-2xl font-bold">Adattamento CV</h2><p className="text-muted-foreground mt-1">Verso sta adattando il tuo CV al ruolo...</p></div>
        {["Adattamento contenuti...", "Ottimizzazione ATS...", "Verifica onestà..."].map((msg, i) => (
          <motion.div key={msg} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 1.2, duration: 0.4 }}>
            <Card className="border-border/30 bg-card/60"><CardContent className="py-6">
              <div className="flex items-center gap-3"><SpinnerGap size={20} className="text-primary animate-spin" /><span className="text-sm text-muted-foreground">{msg}</span></div>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-destructive via-warning to-primary" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ delay: i * 1.2, duration: 2, ease: "easeOut" }} /></div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>
    );
  }

  if (!analyzeResult) return null;

  const isLowScore = analyzeResult.match_score <= 25;
  const scoreBadge = analyzeResult.match_score >= 80
    ? { label: "Ottimo match", className: "bg-primary/20 text-primary" }
    : analyzeResult.match_score <= 40
      ? { label: "Gap significativi", className: "bg-destructive/20 text-destructive" }
      : null;

  const ATS_LABELS_IT: Record<string, string> = {
    keywords: "Parole chiave", format: "Formato", dates: "Date",
    measurable: "Risultati misurabili", cliches: "Frasi fatte",
    sections: "Sezioni standard", action_verbs: "Verbi d'azione",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={20} /></button>
        <div><h2 className="font-display text-2xl font-bold">Risultato analisi</h2><p className="text-muted-foreground mt-1">Ecco come il tuo CV si allinea con l'offerta.</p></div>
      </div>

      {/* Score Meter */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <Card className="border-border/50 bg-card/80"><CardContent className="py-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><ChartLineUp size={20} className="text-primary" /><span className="text-sm font-medium">Match Score</span></div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-3xl font-bold text-primary">{animatedScore}%</span>
              {scoreBadge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ${scoreBadge.className}`}>{scoreBadge.label}</span>}
            </div>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-destructive via-warning to-primary" initial={{ width: "0%" }} animate={{ width: `${analyzeResult.match_score}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          {analyzeResult.score_note && <p className="text-sm text-muted-foreground mt-2">{analyzeResult.score_note}</p>}
        </CardContent></Card>
      </motion.div>

      {/* Dual Score */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50 bg-card/80 h-full"><CardContent className="py-4 text-center">
            <p className="text-xs font-mono text-muted-foreground uppercase mb-1">Punteggio ATS</p>
            <span className="font-mono text-2xl font-bold text-info">{animatedAts}%</span>
          </CardContent></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50 bg-card/80 h-full"><CardContent className="py-4 text-center">
            <p className="text-xs font-mono text-muted-foreground uppercase mb-1">Seniority</p>
            <p className="text-sm font-medium">
              {analyzeResult.seniority_match?.match
                ? <span className="text-primary">✓ Match</span>
                : <span className="text-warning">≠ {analyzeResult.seniority_match?.candidate_level} → {analyzeResult.seniority_match?.role_level}</span>}
            </p>
          </CardContent></Card>
        </motion.div>
      </div>

      {/* Skills — with toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-primary/20 bg-card/80 h-full"><CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-primary"><CheckCircle size={16} weight="fill" /> Hai già</div>
            <div className="flex flex-wrap gap-2">
              {analyzeResult.skills_present.filter(s => s.has).map((s) => <span key={s.label} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono text-primary">{s.label}</span>)}
              {/* Overridden skills shown in green with dashed border */}
              {Array.from(overriddenSkills).map((skill) => (
                <button
                  key={`override-${skill}`}
                  onClick={() => onToggleSkill(skill)}
                  className="rounded-full border border-dashed border-primary/40 bg-primary/10 px-3 py-1 text-xs font-mono text-primary flex items-center gap-1 hover:border-primary/60 transition-colors cursor-pointer"
                  title="Clicca per annullare"
                >
                  {skill}
                  <XCircle size={12} weight="fill" className="text-primary/50" />
                </button>
              ))}
            </div>
          </CardContent></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-destructive/20 bg-card/80 h-full"><CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive"><XCircle size={16} weight="fill" /> Ti mancano</div>
            <div className="flex flex-wrap gap-2">
              {analyzeResult.skills_missing
                .filter((s) => !overriddenSkills.has(s.label))
                .map((s) => (
                  <button
                    key={s.label}
                    onClick={() => onToggleSkill(s.label)}
                    className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-mono text-destructive flex items-center gap-1 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                    title="Ce l'ho — sposta in verde"
                  >
                    {s.label}
                    {(s.importance === "essential" || s.importance === "essenziale") && <Warning size={12} weight="fill" />}
                    <Plus size={12} weight="bold" className="ml-0.5" />
                  </button>
                ))}
            </div>
            {analyzeResult.skills_missing.length > 0 && (
              <p className="text-[10px] text-muted-foreground italic">Clicca su una skill per dire che ce l'hai</p>
            )}
          </CardContent></Card>
        </motion.div>
      </div>

      {/* Learning Suggestions */}
      {analyzeResult.learning_suggestions && analyzeResult.learning_suggestions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-info/20 bg-card/80"><CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-info"><GraduationCap size={18} weight="fill" /> Risorse per colmare i gap</div>
            <div className="space-y-2">
              {analyzeResult.learning_suggestions.map((ls, i) => (
                <a key={i} href={ls.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-lg border border-border/30 hover:border-info/40 bg-surface/50 hover:bg-surface transition-colors group">
                  <GraduationCap size={18} className="text-info mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-info transition-colors">{ls.resource_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">{ls.skill}</span>
                      <span className="text-border">·</span>
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">{ls.type}</span>
                      {ls.duration && <><span className="text-border">·</span><span className="font-mono text-[10px] text-muted-foreground">{ls.duration}</span></>}
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground group-hover:text-info mt-1 shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          </CardContent></Card>
        </motion.div>
      )}

      {/* ATS Checks */}
      {analyzeResult.ats_checks && analyzeResult.ats_checks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="border-border/50 bg-card/80"><CardContent className="pt-5 space-y-3">
            <p className="text-sm font-medium">Check ATS</p>
            <div className="space-y-2">
              {analyzeResult.ats_checks.map((ch) => (
                <div key={ch.check} className="flex items-center gap-2 text-sm">
                  {ch.status === "pass" ? <CheckCircle size={16} className="text-primary" weight="fill" /> : ch.status === "warning" ? <Warning size={16} className="text-warning" weight="fill" /> : <XCircle size={16} className="text-destructive" weight="fill" />}
                  <span className="flex-1">{ATS_LABELS_IT[ch.check] || ch.label}</span>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </motion.div>
      )}

      {/* Low score warning */}
      {isLowScore && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="border-warning/40 bg-card/80"><CardContent className="py-6 space-y-4">
            <div className="flex items-start gap-3">
              <Target size={24} className="text-warning shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-lg font-bold">Forse non è la posizione giusta</h3>
                <p className="text-sm text-muted-foreground mt-2">Il match con questo ruolo è basso. Concentra le energie su posizioni dove puoi fare la differenza.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={onAbandon} className="flex-1 gap-2"><ArrowClockwise size={16} /> Cerca un'altra posizione</Button>
              <Button variant="outline" onClick={onGenerateCv} className="gap-2"><ArrowRight size={16} /> Procedi comunque</Button>
            </div>
          </CardContent></Card>
        </motion.div>
      )}

      {/* Language selector */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="py-5 space-y-3">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-info" />
              <span className="text-sm font-medium">Lingua del CV</span>
              <span className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Rilevata: {analyzeResult.detected_language === "en" ? "English" : "Italiano"}
              </span>
            </div>
            <div className="flex gap-2">
              {[{ code: "it", label: "Italiano" }, { code: "en", label: "English" }].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onLanguageChange(lang.code)}
                  className={`rounded-full px-4 py-1.5 text-xs font-mono font-medium transition-all ${
                    selectedLanguage === lang.code
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-muted/50 text-muted-foreground border border-border/50 hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {!isLowScore && (
        <Button onClick={onGenerateCv} className="w-full gap-2">
          <MagicWand size={16} /> Genera il CV adattato
        </Button>
      )}
    </div>
  );
}

// ==================== Step 3: Revisione (NEW) ====================
function StepRevisione({
  tailorResult,
  analyzeResult,
  originalCv,
  onNext,
  onBack,
}: {
  tailorResult: TailorResult;
  analyzeResult: AnalyzeResult | null;
  originalCv: Record<string, unknown> | null;
  onNext: () => void;
  onBack: () => void;
}) {
  const [diffOpen, setDiffOpen] = useState(false);

  const stats = useMemo(() =>
    computeConfidence(originalCv, tailorResult.tailored_cv, tailorResult.diff),
    [originalCv, tailorResult.tailored_cv, tailorResult.diff]
  );

  const matchScore = analyzeResult?.match_score ?? 0;
  const atsScore = analyzeResult?.ats_score ?? 0;
  const totalDiffs = tailorResult.diff?.length ?? 0;
  const structChanges = tailorResult.structural_changes?.length ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={20} /></button>
        <div>
          <h2 className="font-display text-2xl font-bold">Revisione</h2>
          <p className="text-muted-foreground mt-1">Riepilogo delle modifiche effettuate dal tailoring.</p>
        </div>
      </div>

      {/* Compact scores */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="py-4 text-center space-y-1">
            <p className="text-[10px] font-mono text-muted-foreground uppercase">Match</p>
            <p className="font-mono text-xl font-bold text-primary">{matchScore}%</p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-destructive via-warning to-primary" style={{ width: `${matchScore}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="py-4 text-center space-y-1">
            <p className="text-[10px] font-mono text-muted-foreground uppercase">ATS</p>
            <p className="font-mono text-xl font-bold text-info">{atsScore}%</p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-info" style={{ width: `${atsScore}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="py-4 text-center space-y-1">
            <p className="text-[10px] font-mono text-muted-foreground uppercase">Confidence</p>
            <p className={`font-mono text-xl font-bold ${stats.confidence >= 90 ? "text-primary" : stats.confidence >= 70 ? "text-warning" : "text-destructive"}`}>{stats.confidence}%</p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${stats.confidence >= 90 ? "bg-primary" : stats.confidence >= 70 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${stats.confidence}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change counters */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="py-5 space-y-3">
          <div className="flex items-center gap-2">
            <ListChecks size={18} className="text-primary" />
            <span className="text-sm font-medium">Cosa abbiamo cambiato</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/30 p-3 text-center">
              <p className="font-mono text-lg font-bold text-foreground">{stats.bulletsRewritten}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Bullet riscritti</p>
            </div>
            <div className="rounded-lg border border-border/30 p-3 text-center">
              <p className="font-mono text-lg font-bold text-foreground">{stats.bulletsAdded}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Bullet aggiunti</p>
            </div>
            <div className="rounded-lg border border-border/30 p-3 text-center">
              <p className="font-mono text-lg font-bold text-foreground">{stats.sectionsRemoved}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Esperienze rimosse</p>
            </div>
            <div className="rounded-lg border border-border/30 p-3 text-center">
              <p className="font-mono text-lg font-bold text-foreground">{structChanges}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Modifiche strutturali</p>
            </div>
            <div className="rounded-lg border border-border/30 p-3 text-center">
              <p className="font-mono text-lg font-bold text-foreground">{stats.experiencesKept}/{stats.experiencesOriginal}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Esperienze mantenute</p>
            </div>
            <div className="rounded-lg border border-border/30 p-3 text-center">
              <p className="font-mono text-lg font-bold text-foreground">{totalDiffs}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Modifiche contenuto</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collapsible diff */}
      {totalDiffs > 0 && (
        <Collapsible open={diffOpen} onOpenChange={setDiffOpen}>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="py-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-primary" />
                  <span className="text-sm font-medium">Dettaglio modifiche</span>
                  <span className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{totalDiffs}</span>
                </div>
                <CaretDown size={14} className={`text-muted-foreground transition-transform ${diffOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3 mt-4">
                  {tailorResult.diff.map((ch, i) => (
                    <div key={i} className="rounded-lg border border-border/30 p-3 space-y-1.5">
                      <p className="font-mono text-[10px] text-muted-foreground uppercase">{ch.section}</p>
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

      {stats.confidence < 90 && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-warning/20 bg-warning/5">
          <Warning size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">Confidence sotto il 90%. Rivedi le modifiche nel dettaglio prima di procedere.</p>
        </div>
      )}

      <Button onClick={onNext} className="w-full gap-2">
        Procedi all'export <ArrowRight size={16} />
      </Button>
    </div>
  );
}

// ==================== Step 4: Export (full-page) ====================
function StepExport({
  tailoredCv,
  analyzeResult,
  tailorResult,
  jobData,
  applicationId,
  onBack,
  onNext,
}: {
  tailoredCv: Record<string, unknown>;
  analyzeResult: AnalyzeResult | null;
  tailorResult: TailorResult;
  jobData: JobData;
  applicationId: string;
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
      const cvLang = analyzeResult?.detected_language;
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
        // Store the storage path (not a public URL) for private bucket access
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

// ==================== Step 5: Completa (NEW) ====================
function StepCompleta({
  jobData,
  applicationId,
  onMarkSent,
  onKeepDraft,
  onNewApplication,
}: {
  jobData: JobData;
  applicationId: string;
  onMarkSent: () => void;
  onKeepDraft: () => void;
  onNewApplication: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-8 px-4 py-8 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-primary" weight="fill" />
        </div>
        <h2 className="font-display text-2xl font-bold">CV pronto!</h2>
        <p className="text-muted-foreground mt-2">
          Il tuo CV per <span className="text-foreground font-medium">{jobData.role_title}</span> presso <span className="text-foreground font-medium">{jobData.company_name}</span> è stato preparato.
        </p>
      </motion.div>

      <div className="space-y-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button onClick={onMarkSent} className="w-full gap-2 h-12">
            <PaperPlaneTilt size={18} /> Ho inviato la candidatura
          </Button>
          <p className="text-[10px] text-muted-foreground mt-1">Segna come inviata e vai alle candidature</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button variant="outline" onClick={onKeepDraft} className="w-full gap-2">
            <Clock size={16} /> La invierò dopo
          </Button>
          <p className="text-[10px] text-muted-foreground mt-1">Resta come bozza, torna alla home</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Button variant="ghost" onClick={onNewApplication} className="w-full gap-2 text-muted-foreground">
            <Plus size={16} /> Nuova candidatura
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

// ==================== Main Wizard ====================
export default function Nuova() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState(() => {
    const s = parseInt(searchParams.get("step") || "0", 10);
    return isNaN(s) ? 0 : s;
  });
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [jobUrl, setJobUrl] = useState<string | undefined>();
  const [prescreenResult, setPrescreenResult] = useState<PrescreenResult | null>(null);
  const [prescreening, setPrescreening] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [tailorResult, setTailorResult] = useState<TailorResult | null>(null);
  const [tailoring, setTailoring] = useState(false);
  const [cvCheck, setCvCheck] = useState<"loading" | "ok" | "missing">("loading");
  const [applicationId, setApplicationId] = useState<string | null>(searchParams.get("draft"));
  const [userAnswers, setUserAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [originalCv, setOriginalCv] = useState<Record<string, unknown> | null>(null);
  const [languageOverride, setLanguageOverride] = useState<string | null>(null);
  const [overriddenSkills, setOverriddenSkills] = useState<Set<string>>(new Set());
  const draftLoadedId = useRef<string | null>(null);

  const updateStep = useCallback((newStep: number) => {
    setStep(newStep);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("step", String(newStep));
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // CV Guard
  useEffect(() => {
    if (!user) return;
    supabase.from("master_cvs").select("id").eq("user_id", user.id).eq("is_active", true).limit(1)
      .then(({ data }) => setCvCheck(data && data.length > 0 ? "ok" : "missing"));
  }, [user]);

  // Draft resumption
  useEffect(() => {
    const draftId = searchParams.get("draft");
    if (!draftId || !user || draftLoadedId.current === draftId) return;
    draftLoadedId.current = draftId;

    (async () => {
      const { data: app } = await supabase.from("applications").select("*").eq("id", draftId).single();
      if (!app) { toast.error("Bozza non trovata."); return; }

      setApplicationId(app.id);
      setJobData({
        company_name: app.company_name,
        role_title: app.role_title,
        description: app.job_description || "",
        location: "",
        key_requirements: [],
        required_skills: [],
      });
      if (app.job_url) setJobUrl(app.job_url);
      if ((app as any).user_answers) setUserAnswers((app as any).user_answers);

      const { data: tc } = await supabase.from("tailored_cvs").select("*").eq("application_id", draftId).maybeSingle();

      if (tc?.tailored_data) {
        setAnalyzeResult({
          match_score: app.match_score ?? 0,
          ats_score: tc.ats_score ?? 0,
          skills_present: (tc.skills_match as any)?.present || [],
          skills_missing: (tc.skills_match as any)?.missing || [],
          seniority_match: tc.seniority_match as any || { candidate_level: "", role_level: "", match: true, note: "" },
          ats_checks: (tc.ats_checks as any) || [],
          detected_language: "it",
          master_cv_id: tc.master_cv_id,
        });
        setTailorResult({
          tailored_cv: tc.tailored_data as Record<string, unknown>,
          honest_score: (tc.honest_score as any) || { confidence: 100, experiences_added: 0, skills_invented: 0, dates_modified: 0, bullets_repositioned: 0, bullets_rewritten: 0, sections_removed: 0, flags: [] },
          diff: (tc.diff as any) || [],
          master_cv_id: tc.master_cv_id,
        });
        // Fetch original CV for comparison
        supabase.from("master_cvs").select("parsed_data").eq("id", tc.master_cv_id).single()
          .then(({ data: mcv }) => { if (mcv?.parsed_data) setOriginalCv(mcv.parsed_data as Record<string, unknown>); });

        const urlStep = parseInt(searchParams.get("step") || "3", 10);
        updateStep(urlStep >= 3 ? urlStep : 3);
      } else if (app.job_description) {
        updateStep(1);
        setPrescreening(true);
        // Fetch salary for draft resumption too
        const { data: draftProfile } = await supabase.from("profiles").select("salary_expectations").eq("user_id", user.id).single();
        const draftBody: Record<string, unknown> = { job_data: { company_name: app.company_name, role_title: app.role_title, description: app.job_description, location: "", key_requirements: [], required_skills: [] } };
        if (draftProfile?.salary_expectations) draftBody.salary_expectations = draftProfile.salary_expectations;
        supabase.functions.invoke("ai-prescreen", {
          body: draftBody,
        }).then(({ data: result, error }) => {
          if (error || result?.error) { toast.error("Errore durante il pre-screening"); updateStep(0); }
          else setPrescreenResult(result);
        }).finally(() => setPrescreening(false));
      }
    })();
  }, [searchParams, user, updateStep]);

  // Step 0 → Step 1: Run pre-screening
  const handleAnnuncioConfirm = async (data: JobData, url?: string, _text?: string) => {
    if (!user) return;
    setJobData(data);
    setJobUrl(url);
    updateStep(1);
    setPrescreening(true);
    setPrescreenResult(null);

    try {
      let appId = applicationId;
      if (!appId) {
        const { data: draftApp, error: draftErr } = await supabase
          .from("applications").insert({ user_id: user.id, company_name: data.company_name, role_title: data.role_title, job_url: url || null, job_description: data.description, status: "draft" })
          .select("id").single();
        if (draftErr) throw draftErr;
        appId = draftApp.id;
        setApplicationId(appId);
        setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set("draft", appId!); next.set("step", "1"); return next; }, { replace: true });
      }

      // Fetch salary_expectations from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("salary_expectations")
        .eq("user_id", user.id)
        .single();
      
      const body: Record<string, unknown> = { job_data: data };
      if (profile?.salary_expectations) {
        body.salary_expectations = profile.salary_expectations;
      }

      const { data: result, error } = await supabase.functions.invoke("ai-prescreen", { body });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      setPrescreenResult(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante il pre-screening");
      updateStep(0);
    } finally {
      setPrescreening(false);
    }
  };

  // Step 1 → Step 2: Run ANALYZE
  const handleVerificaProceed = async (answers: { question: string; answer: string }[]) => {
    if (!user || !jobData) return;
    setUserAnswers(answers);
    updateStep(2);
    setAnalyzing(true);
    setAnalyzeResult(null);

    try {
      if (applicationId && answers.length > 0) {
        await supabase.from("applications").update({ user_answers: answers } as any).eq("id", applicationId);
      }

      const { data: result, error } = await supabase.functions.invoke("ai-tailor", {
        body: { job_data: jobData, user_answers: answers.length > 0 ? answers : undefined, mode: "analyze" },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      if (applicationId) {
        await supabase.from("applications").update({ match_score: result.match_score, ats_score: result.ats_score } as any).eq("id", applicationId);
      }

      setAnalyzeResult(result);
      setLanguageOverride(result.detected_language || "it");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante l'analisi AI");
      updateStep(1);
    } finally {
      setAnalyzing(false);
    }
  };

  // Step 2 → Step 3: Run TAILOR + REVIEW
  const handleGenerateCv = async () => {
    if (!user || !jobData || !analyzeResult) return;
    setTailoring(true);
    setTailorResult(null);

    try {
      const { data: result, error } = await supabase.functions.invoke("ai-tailor", {
        body: {
          job_data: jobData,
          user_answers: userAnswers.length > 0 ? userAnswers : undefined,
          mode: "tailor",
          analyze_context: { match_score: analyzeResult.match_score, skills_missing: analyzeResult.skills_missing.filter(s => !overriddenSkills.has(s.label)), detected_language: languageOverride || analyzeResult.detected_language, skills_overridden: Array.from(overriddenSkills) },
        },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      // Run HR review agent on the tailored CV (non-blocking on failure)
      let reviewedCv = result.tailored_cv;
      try {
        const { data: reviewResult } = await supabase.functions.invoke("cv-review", {
          body: {
            cv: result.tailored_cv,
            detected_language: analyzeResult.detected_language || "it",
            role_title: jobData.role_title,
          },
        });
        if (reviewResult?.reviewed_cv && !reviewResult?.review_failed) {
          reviewedCv = reviewResult.reviewed_cv;
          console.log("CV review applied successfully");
        }
      } catch (reviewErr) {
        console.warn("CV review failed, using original tailored CV:", reviewErr);
      }

      const finalResult = { ...result, tailored_cv: reviewedCv };
      setTailorResult(finalResult);

      // Fetch original CV for comparison
      if (result.original_cv) {
        setOriginalCv(result.original_cv);
      } else if (result.master_cv_id) {
        const { data: mcv } = await supabase.from("master_cvs").select("parsed_data").eq("id", result.master_cv_id).single();
        if (mcv?.parsed_data) setOriginalCv(mcv.parsed_data as Record<string, unknown>);
      }

      // Save tailored CV (with reviewed version)
      if (applicationId) {
        const tcPayload = {
          user_id: user.id,
          application_id: applicationId,
          master_cv_id: result.master_cv_id,
          tailored_data: reviewedCv as any,
          skills_match: { present: analyzeResult.skills_present || [], missing: analyzeResult.skills_missing || [] } as any,
          suggestions: result.diff as any,
          ats_score: analyzeResult.ats_score,
          ats_checks: analyzeResult.ats_checks as any,
          seniority_match: analyzeResult.seniority_match as any,
          honest_score: result.honest_score as any,
          diff: result.diff as any,
        };

        const { data: existingTc } = await supabase.from("tailored_cvs").select("id").eq("application_id", applicationId).maybeSingle();
        if (existingTc) {
          await supabase.from("tailored_cvs").update(tcPayload as any).eq("id", existingTc.id);
        } else {
          await supabase.from("tailored_cvs").insert([tcPayload as any]);
        }
      }

      updateStep(3);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante la generazione del CV");
    } finally {
      setTailoring(false);
    }
  };

  // Step 5 actions
  const handleMarkSent = async () => {
    if (applicationId) {
      await supabase.from("applications").update({ status: "inviata" } as any).eq("id", applicationId);
    }
    toast.success("Candidatura segnata come inviata!");
    navigate("/app/candidature");
  };

  const handleKeepDraft = () => {
    toast.success("Bozza salvata.");
    navigate("/app/home");
  };

  const handleNewApplication = () => {
    setStep(0);
    setJobData(null);
    setJobUrl(undefined);
    setPrescreenResult(null);
    setAnalyzeResult(null);
    setTailorResult(null);
    setOriginalCv(null);
    setApplicationId(null);
    setUserAnswers([]);
    setSearchParams({}, { replace: true });
  };

  // Abandon
  const handleAbandon = () => {
    handleNewApplication();
  };

  if (cvCheck === "loading") {
    return <div className="flex items-center justify-center py-20"><SpinnerGap size={32} className="text-primary animate-spin" /></div>;
  }

  if (cvCheck === "missing") {
    const draftId = searchParams.get("draft");
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-6">
        <FileArrowUp size={48} className="text-primary mx-auto" />
        <div>
          <h2 className="font-display text-2xl font-bold">{draftId && jobData ? `Per riprendere "${jobData.role_title}" serve il tuo CV` : "CV necessario"}</h2>
          <p className="text-muted-foreground mt-2">{draftId ? "Il CV master è stato rimosso. Ricaricalo per continuare con questa candidatura." : "Per creare una candidatura, devi prima caricare il tuo CV."}</p>
        </div>
        <Button onClick={() => navigate("/onboarding")} className="gap-2"><FileArrowUp size={16} /> Carica il tuo CV</Button>
      </div>
    );
  }

  return (
    <div className="py-6 px-2">
      <StepIndicator current={step} />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && <StepAnnuncio onConfirm={handleAnnuncioConfirm} initialJobData={jobData} />}
          {step === 1 && (
            <StepVerifica
              prescreenResult={prescreenResult}
              loading={prescreening}
              onProceed={handleVerificaProceed}
              onBack={() => updateStep(0)}
            />
          )}
          {step === 2 && (
            <StepTailoring
              analyzeResult={analyzeResult}
              analyzeLoading={analyzing}
              tailoring={tailoring}
              onGenerateCv={handleGenerateCv}
              onAbandon={handleAbandon}
              onBack={() => updateStep(1)}
              selectedLanguage={languageOverride || analyzeResult?.detected_language || "it"}
              onLanguageChange={setLanguageOverride}
              overriddenSkills={overriddenSkills}
              onToggleSkill={(skill) => setOverriddenSkills((prev) => {
                const next = new Set(prev);
                if (next.has(skill)) next.delete(skill);
                else next.add(skill);
                return next;
              })}
            />
          )}
          {step === 3 && tailorResult && (
            <StepRevisione
              tailorResult={tailorResult}
              analyzeResult={analyzeResult}
              originalCv={originalCv}
              onNext={() => updateStep(4)}
              onBack={() => updateStep(2)}
            />
          )}
          {step === 4 && tailorResult && jobData && applicationId && (
            <StepExport
              tailoredCv={tailorResult.tailored_cv}
              analyzeResult={analyzeResult}
              tailorResult={tailorResult}
              jobData={jobData}
              applicationId={applicationId}
              onBack={() => updateStep(3)}
              onNext={() => updateStep(5)}
            />
          )}
          {step === 5 && jobData && applicationId && (
            <StepCompleta
              jobData={jobData}
              applicationId={applicationId}
              onMarkSent={handleMarkSent}
              onKeepDraft={handleKeepDraft}
              onNewApplication={handleNewApplication}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
