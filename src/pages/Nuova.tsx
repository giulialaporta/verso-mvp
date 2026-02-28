import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  FloppyDisk,
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
} from "@phosphor-icons/react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ExportDrawer } from "@/components/ExportDrawer";
import { InlineEdit } from "@/components/InlineEdit";
import { EditableSkillChips } from "@/components/EditableSkillChips";

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

// --- NEW: AnalyzeResult (mode=analyze) ---
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

// --- TailorResult (mode=tailor) ---
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

// --- Step Indicator (5 steps) ---
function StepIndicator({ current }: { current: number }) {
  const steps = ["Annuncio", "Verifica", "Score", "Modifiche", "CV Adattato"];
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full font-mono text-xs font-medium transition-colors ${
              i < current
                ? "bg-primary text-primary-foreground"
                : i === current
                  ? "bg-primary/20 text-primary ring-2 ring-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i < current ? <CheckCircle size={14} weight="fill" /> : i + 1}
          </div>
          <span className={`hidden sm:inline text-xs sm:text-sm ${i === current ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {label}
          </span>
          {i < steps.length - 1 && <div className="w-4 sm:w-8 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

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

// --- Animated Counter Hook ---
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

// --- Step 0: Job Input ---
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
    if (!companyName.trim()) {
      toast.error("Inserisci il nome dell'azienda");
      return;
    }
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

      const { data, error } = await supabase.functions.invoke("scrape-job", {
        body,
        signal: controller.signal as AbortSignal,
      });
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
              <Input
                placeholder="Es. Google, Accenture, Intesa Sanpaolo..."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
                className="pl-9"
              />
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full">
                <TabsTrigger value="text" className="flex-1 gap-2">
                  <TextAa size={16} /> Testo
                </TabsTrigger>
                <TabsTrigger value="url" className="flex-1 gap-2 text-xs">
                  <LinkIcon size={16} /> URL
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">(solo alcuni siti)</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-4 space-y-3">
                <Textarea
                  placeholder="Incolla qui il testo completo dell'annuncio..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={loading}
                  rows={10}
                  className="resize-none"
                />
                <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                    <Info size={14} />
                    <span>Come copiare da LinkedIn, Indeed...</span>
                    <CaretDown size={12} className={`ml-auto transition-transform duration-200 ${guideOpen ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 rounded-lg border border-border/50 bg-surface p-4 space-y-3 text-xs text-muted-foreground"
                    >
                      <div className="flex items-start gap-2">
                        <LinkedinLogo size={16} className="text-secondary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-foreground font-medium mb-1">LinkedIn</p>
                          <ol className="list-decimal list-inside space-y-0.5">
                            <li>Apri l'annuncio su LinkedIn</li>
                            <li>Seleziona tutto il testo (Ctrl+A / ⌘+A)</li>
                            <li>Copia (Ctrl+C / ⌘+C)</li>
                            <li>Incolla qui</li>
                          </ol>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Globe size={16} className="text-secondary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-foreground font-medium mb-1">Indeed, InfoJobs, Monster, Glassdoor</p>
                          <p>Stesso metodo. Apri l'annuncio, seleziona il testo e incollalo qui.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 border-t border-border/30 pt-2">
                        <Info size={14} className="text-warning shrink-0 mt-0.5" />
                        <p>
                          <span className="text-foreground font-medium">Tip:</span> Puoi anche provare il tab URL incollando il link dell'annuncio. Se non funziona, il testo è sempre l'opzione più affidabile.
                        </p>
                      </div>
                    </motion.div>
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>

              <TabsContent value="url" className="mt-4">
                <Input
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                />
                <p className="text-[10px] text-muted-foreground mt-2">
                  Se l'URL non funziona, copia il testo dell'annuncio e usa il tab Testo.
                </p>
              </TabsContent>
            </Tabs>

            {loading ? (
              <Button onClick={handleCancel} variant="destructive" className="w-full gap-2">
                <XCircle size={16} /> Annulla
              </Button>
            ) : (
              <Button onClick={handleAnalyze} className="w-full gap-2">
                <MagicWand size={16} /> Analizza
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-primary/30 bg-card/80">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Buildings size={24} className="text-secondary mt-0.5 shrink-0" />
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
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Briefcase size={14} className="text-primary mt-0.5 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                {jobData.required_skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono text-primary">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setJobData(null)} className="gap-2">
                  <ArrowLeft size={16} /> Modifica
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => onConfirm(jobData, tab === "url" ? url : undefined, tab === "text" ? text : undefined)}
                >
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

// --- Step 1: Pre-screening ---
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
          <motion.div
            key={msg}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.8, duration: 0.4 }}
          >
            <Card className="border-border/30 bg-card/60">
              <CardContent className="py-5">
                <div className="flex items-center gap-3">
                  <SpinnerGap size={18} className="text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">{msg}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  if (!prescreenResult) return null;

  const feasibilityColors = {
    low: "text-destructive",
    medium: "text-warning",
    high: "text-primary",
  };
  const feasibilityLabels = {
    low: "Bassa",
    medium: "Media",
    high: "Alta",
  };

  const handleProceed = () => {
    const formattedAnswers = prescreenResult.follow_up_questions
      .filter((q) => answers[q.id]?.trim())
      .map((q) => ({ question: q.question, answer: answers[q.id].trim() }));
    onProceed(formattedAnswers);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="font-display text-2xl font-bold">Verifica compatibilità</h2>
          <p className="text-muted-foreground mt-1">Analisi onesta dei requisiti prima di procedere.</p>
        </div>
      </div>

      {/* Feasibility indicator */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Fattibilità candidatura</span>
              <span className={`font-mono text-lg font-bold ${feasibilityColors[prescreenResult.overall_feasibility]}`}>
                {feasibilityLabels[prescreenResult.overall_feasibility]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{prescreenResult.feasibility_note}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dealbreakers */}
      {prescreenResult.dealbreakers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-destructive/40 bg-card/80">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldWarning size={20} className="text-destructive" weight="fill" />
                <span className="text-sm font-medium text-destructive">Gap significativi</span>
              </div>
              <div className="space-y-3">
                {prescreenResult.dealbreakers.map((db, i) => (
                  <div key={i} className="border-l-2 border-destructive/40 pl-3 space-y-1">
                    <p className="text-sm font-medium">{db.requirement}</p>
                    <p className="text-sm text-muted-foreground">{db.message}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic pt-2 border-t border-border/30">
                Verso non ti impedisce di candidarti, ma vuole che tu sia consapevole di questi gap.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Requirements breakdown */}
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
                      req.priority === "mandatory"
                        ? "bg-destructive/10 text-destructive"
                        : req.priority === "preferred"
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {req.priority === "mandatory" ? "obbligatorio" : req.priority === "preferred" ? "preferito" : "gradito"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Follow-up questions */}
      {prescreenResult.follow_up_questions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-secondary/30 bg-card/80">
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <ChatTeardropDots size={20} className="text-secondary" weight="fill" />
                <span className="text-sm font-medium">Aiutaci a conoscerti meglio</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Rispondi alle domande per aiutare Verso a scoprire competenze non esplicite nel tuo CV. Le risposte sono facoltative.
              </p>
              <div className="space-y-4">
                {prescreenResult.follow_up_questions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-medium">{q.question}</p>
                    <p className="text-xs text-muted-foreground italic">{q.context}</p>
                    <Textarea
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="La tua risposta (facoltativa)..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft size={16} /> Indietro
        </Button>
        <Button className="flex-1 gap-2" onClick={handleProceed}>
          Prosegui con l'analisi <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}

// --- Utility: apply patches to original CV (frontend copy) ---
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
      if (!isNaN(idx)) {
        target = target[idx];
      } else {
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
    if (!isNaN(lastIdx)) {
      target[lastIdx] = value;
    } else {
      target[lastSeg] = value;
    }
  }
  return result;
}

// ==================== Step 2: Score (NEW) ====================
function StepScore({
  result,
  loading,
  onGenerateCv,
  onAbandon,
  onBack,
  tailoring,
}: {
  result: AnalyzeResult | null;
  loading: boolean;
  onGenerateCv: () => void;
  onAbandon: () => void;
  onBack: () => void;
  tailoring: boolean;
}) {
  const animatedScore = useAnimatedCounter(result?.match_score ?? 0);
  const animatedAts = useAnimatedCounter(result?.ats_score ?? 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Analisi in corso</h2>
          <p className="text-muted-foreground mt-1">Verso sta confrontando il tuo CV con l'annuncio...</p>
        </div>
        {["Confronto competenze...", "Calcolo match score...", "Analisi ATS..."].map((msg, i) => (
          <motion.div
            key={msg}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 1.2, duration: 0.4 }}
          >
            <Card className="border-border/30 bg-card/60">
              <CardContent className="py-6">
                <div className="flex items-center gap-3">
                  <SpinnerGap size={20} className="text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">{msg}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-destructive via-warning to-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ delay: i * 1.2, duration: 2, ease: "easeOut" }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  if (!result) return null;

  const isLowScore = result.match_score <= 25;

  const scoreBadge = result.match_score >= 80
    ? { label: "Ottimo match", className: "bg-primary/20 text-primary" }
    : result.match_score <= 40
      ? { label: "Gap significativi", className: "bg-destructive/20 text-destructive" }
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="font-display text-2xl font-bold">Risultato analisi</h2>
          <p className="text-muted-foreground mt-1">Ecco come il tuo CV si allinea con l'offerta.</p>
        </div>
      </div>

      {/* Animated Score Meter */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="py-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChartLineUp size={20} className="text-primary" />
                <span className="text-sm font-medium">Match Score</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-3xl font-bold text-primary">
                  {animatedScore}%
                </span>
                {scoreBadge && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ${scoreBadge.className}`}>
                    {scoreBadge.label}
                  </span>
                )}
              </div>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-destructive via-warning to-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${result.match_score}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            {result.score_note && (
              <p className="text-sm text-muted-foreground mt-2">{result.score_note}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dual Score */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50 bg-card/80 h-full">
            <CardContent className="py-4 text-center">
              <p className="text-xs font-mono text-muted-foreground uppercase mb-1">ATS Score</p>
              <span className="font-mono text-2xl font-bold text-secondary">
                {animatedAts}%
              </span>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50 bg-card/80 h-full">
            <CardContent className="py-4 text-center">
              <p className="text-xs font-mono text-muted-foreground uppercase mb-1">Seniority</p>
              <p className="text-sm font-medium">
                {result.seniority_match?.match ? (
                  <span className="text-primary">✓ Match</span>
                ) : (
                  <span className="text-warning">≠ {result.seniority_match?.candidate_level} → {result.seniority_match?.role_level}</span>
                )}
              </p>
              {result.seniority_match?.note && (
                <p className="text-xs text-muted-foreground mt-1">{result.seniority_match.note}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Skill Match */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-primary/20 bg-card/80 h-full">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <CheckCircle size={16} weight="fill" /> Hai già
              </div>
              <div className="flex flex-wrap gap-2">
                {result.skills_present.filter(s => s.has).map((s) => (
                  <span key={s.label} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono text-primary">
                    {s.label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-destructive/20 bg-card/80 h-full">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <XCircle size={16} weight="fill" /> Ti mancano
              </div>
              <div className="flex flex-wrap gap-2">
                {result.skills_missing.map((s) => (
                  <span key={s.label} className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-mono text-destructive flex items-center gap-1">
                    {s.label}
                    {(s.importance === "essential" || s.importance === "essenziale") && <Warning size={12} weight="fill" />}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Learning Suggestions */}
      {result.learning_suggestions && result.learning_suggestions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-secondary/20 bg-card/80">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                <GraduationCap size={18} weight="fill" /> Risorse per colmare i gap
              </div>
              <div className="space-y-2">
                {result.learning_suggestions.map((ls, i) => (
                  <a
                    key={i}
                    href={ls.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/30 hover:border-secondary/40 bg-surface/50 hover:bg-surface transition-colors group"
                  >
                    <GraduationCap size={18} className="text-secondary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-secondary transition-colors">{ls.resource_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] uppercase text-muted-foreground">{ls.skill}</span>
                        <span className="text-border">·</span>
                        <span className="font-mono text-[10px] uppercase text-muted-foreground">{ls.type}</span>
                        {ls.duration && (
                          <>
                            <span className="text-border">·</span>
                            <span className="font-mono text-[10px] text-muted-foreground">{ls.duration}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground group-hover:text-secondary mt-1 shrink-0 transition-colors" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ATS Checks */}
      {result.ats_checks && result.ats_checks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="pt-5 space-y-3">
              <p className="text-sm font-medium">Check ATS</p>
              <div className="space-y-2">
                {result.ats_checks.map((ch) => (
                  <div key={ch.check} className="flex items-center gap-2 text-sm">
                    {ch.status === "pass" ? (
                      <CheckCircle size={16} className="text-primary" weight="fill" />
                    ) : ch.status === "warning" ? (
                      <Warning size={16} className="text-warning" weight="fill" />
                    ) : (
                      <XCircle size={16} className="text-destructive" weight="fill" />
                    )}
                    <span className="flex-1">{ch.label}</span>
                    {ch.detail && <span className="text-xs text-muted-foreground">{ch.detail}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Low Score CTA */}
      {isLowScore && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="border-warning/40 bg-card/80">
            <CardContent className="py-6 space-y-4">
              <div className="flex items-start gap-3">
                <Target size={24} className="text-warning shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display text-lg font-bold">Forse non è la posizione giusta</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Il match con questo ruolo è basso. Non significa che non sei valido — significa che le tue competenze brillano altrove. 
                    Concentra le energie su posizioni dove puoi fare davvero la differenza.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={onAbandon} className="flex-1 gap-2">
                  <ArrowClockwise size={16} /> Cerca un'altra posizione
                </Button>
                <Button variant="outline" onClick={onGenerateCv} disabled={tailoring} className="gap-2">
                  {tailoring ? <SpinnerGap size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  Procedi comunque
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Normal Score: Generate CV button */}
      {!isLowScore && (
        <Button onClick={onGenerateCv} disabled={tailoring} className="w-full gap-2">
          {tailoring ? (
            <><SpinnerGap size={16} className="animate-spin" /> Generazione in corso...</>
          ) : (
            <><MagicWand size={16} /> Genera il CV adattato</>
          )}
        </Button>
      )}
    </div>
  );
}

// ==================== Step 3: Modifications (interactive approval) ====================
function StepModifiche({
  result,
  analyzeResult,
  loading,
  onNext,
  onBack,
}: {
  result: TailorResult | null;
  analyzeResult: AnalyzeResult | null;
  loading: boolean;
  onNext: (approvedCv: Record<string, unknown>) => void;
  onBack: () => void;
}) {
  const structCount = result?.structural_changes?.length ?? 0;
  const diffCount = result?.diff?.length ?? 0;
  const totalChanges = structCount + diffCount;

  const decisionsInitRef = useRef<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, "approved" | "rejected">>({});

  useEffect(() => {
    if (!result) return;
    const resultId = `${result.diff?.length}_${result.structural_changes?.length}`;
    if (decisionsInitRef.current === resultId) return;
    decisionsInitRef.current = resultId;
    const init: Record<string, "approved" | "rejected"> = {};
    (result.structural_changes ?? []).forEach((_, i) => { init[`s_${i}`] = "approved"; });
    (result.diff ?? []).forEach((_, i) => { init[`d_${i}`] = "approved"; });
    setDecisions(init);
  }, [result]);

  const approvedCount = Object.values(decisions).filter(v => v === "approved").length;

  const toggleDecision = (key: string) => {
    setDecisions(prev => ({ ...prev, [key]: prev[key] === "approved" ? "rejected" : "approved" }));
  };

  const setAll = (status: "approved" | "rejected") => {
    setDecisions(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) next[k] = status;
      return next;
    });
  };

  const handleNext = () => {
    if (!result) return;

    if (approvedCount === totalChanges) {
      onNext(result.tailored_cv);
      return;
    }

    const originalCv = result.original_cv || result.tailored_cv;
    const allPatches = result.tailored_patches || [];
    const approvedPaths = new Set<string>();

    (result.structural_changes ?? []).forEach((sc, i) => {
      if (decisions[`s_${i}`] === "approved") approvedPaths.add(sc.section);
    });
    (result.diff ?? []).forEach((d, i) => {
      if (decisions[`d_${i}`] === "approved" && d.patch_path) approvedPaths.add(d.patch_path);
    });

    const approvedPatches = allPatches.filter(p => approvedPaths.has(p.path));
    const finalCv = applyPatchesFrontend(originalCv, approvedPatches);
    onNext(finalCv);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Generazione modifiche</h2>
          <p className="text-muted-foreground mt-1">Verso sta adattando il tuo CV...</p>
        </div>
        {["Adattamento contenuti...", "Ottimizzazione ATS...", "Verifica onestà..."].map((msg, i) => (
          <motion.div
            key={msg}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 1.2, duration: 0.4 }}
          >
            <Card className="border-border/30 bg-card/60">
              <CardContent className="py-6">
                <div className="flex items-center gap-3">
                  <SpinnerGap size={20} className="text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">{msg}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-destructive via-warning to-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ delay: i * 1.2, duration: 2, ease: "easeOut" }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="font-display text-2xl font-bold">Modifiche suggerite</h2>
          <p className="text-muted-foreground mt-1">Approva o rifiuta ogni modifica prima di procedere.</p>
        </div>
      </div>

      {/* Score recap */}
      {analyzeResult && (
        <div className="flex gap-2">
          <span className="rounded-full bg-primary/20 px-3 py-1 font-mono text-sm font-bold text-primary">
            Match {analyzeResult.match_score}%
          </span>
          <span className="rounded-full bg-secondary/20 px-3 py-1 font-mono text-sm font-bold text-secondary">
            ATS {analyzeResult.ats_score}%
          </span>
        </div>
      )}

      {totalChanges > 0 && (
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <MagicWand size={18} className="text-primary" />
                <span className="text-sm font-medium">Modifiche</span>
                <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {approvedCount}/{totalChanges} approvate
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAll("approved")}
                  className="text-[11px] font-mono text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded border border-primary/20 hover:bg-primary/5"
                >
                  Approva tutte
                </button>
                <button
                  onClick={() => setAll("rejected")}
                  className="text-[11px] font-mono text-destructive hover:text-destructive/80 transition-colors px-2 py-1 rounded border border-destructive/20 hover:bg-destructive/5"
                >
                  Rifiuta tutte
                </button>
              </div>
            </div>

            {/* Structural changes */}
            {result.structural_changes && result.structural_changes.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-mono text-muted-foreground uppercase">Modifiche strutturali</p>
                {result.structural_changes.map((sc, i) => {
                  const key = `s_${i}`;
                  const isApproved = decisions[key] === "approved";
                  const actionLabels: Record<string, string> = { removed: "Rimossa", reordered: "Riordinata", condensed: "Condensata" };
                  const actionColors: Record<string, string> = { removed: "text-destructive", reordered: "text-secondary", condensed: "text-warning" };
                  return (
                    <div
                      key={key}
                      className={`rounded-lg border p-3 transition-all duration-200 ${isApproved ? "border-border/50 bg-card/60" : "border-destructive/30 bg-destructive/5 opacity-60"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-mono text-[10px] uppercase font-medium ${actionColors[sc.action] || "text-muted-foreground"}`}>
                              {actionLabels[sc.action] || sc.action}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground uppercase">{sc.section}</span>
                          </div>
                          <p className="text-sm font-medium">{sc.item}</p>
                          <p className="text-xs text-muted-foreground italic mt-1">{sc.reason}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => toggleDecision(key)} className={`p-1.5 rounded-md transition-colors ${isApproved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`} title="Approva">
                            <CheckCircle size={18} weight={isApproved ? "fill" : "regular"} />
                          </button>
                          <button onClick={() => toggleDecision(key)} className={`p-1.5 rounded-md transition-colors ${!isApproved ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"}`} title="Rifiuta">
                            <XCircle size={18} weight={!isApproved ? "fill" : "regular"} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Content diff */}
            {result.diff && result.diff.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-mono text-muted-foreground uppercase">Modifiche al contenuto</p>
                {result.diff.map((ch, i) => {
                  const key = `d_${i}`;
                  const isApproved = decisions[key] === "approved";
                  return (
                    <div
                      key={key}
                      className={`rounded-lg border p-3 transition-all duration-200 ${isApproved ? "border-border/50 bg-card/60" : "border-destructive/30 bg-destructive/5 opacity-60"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className="font-mono text-[10px] text-muted-foreground uppercase">{ch.section}</p>
                          <p className="text-sm line-through text-muted-foreground">{ch.original}</p>
                          <p className={`text-sm ${isApproved ? "text-primary" : "text-muted-foreground line-through"}`}>{ch.suggested}</p>
                          {ch.reason && <p className="text-xs text-muted-foreground italic">{ch.reason}</p>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => toggleDecision(key)} className={`p-1.5 rounded-md transition-colors ${isApproved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`} title="Approva">
                            <CheckCircle size={18} weight={isApproved ? "fill" : "regular"} />
                          </button>
                          <button onClick={() => toggleDecision(key)} className={`p-1.5 rounded-md transition-colors ${!isApproved ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"}`} title="Rifiuta">
                            <XCircle size={18} weight={!isApproved ? "fill" : "regular"} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button onClick={handleNext} className="w-full gap-2">
        Vedi il CV adattato <ArrowRight size={16} />
      </Button>
    </div>
  );
}

// ==================== Step 4: CV Preview + Export ====================
function StepCVAdattato({
  tailorResult,
  analyzeResult,
  jobData,
  applicationId,
  onBack,
  onTailoredCvChange,
}: {
  tailorResult: TailorResult;
  analyzeResult: AnalyzeResult | null;
  jobData: JobData;
  applicationId: string;
  onBack: () => void;
  onTailoredCvChange: (cv: Record<string, unknown>) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [diffTab, setDiffTab] = useState<string>("adattato");
  const [exportOpen, setExportOpen] = useState(false);

  const cv = tailorResult.tailored_cv;
  const matchScore = analyzeResult?.match_score ?? 0;
  const atsScore = analyzeResult?.ats_score ?? 0;
  const atsChecks = analyzeResult?.ats_checks ?? [];

  const updateCvField = (path: string, value: unknown) => {
    const updated = JSON.parse(JSON.stringify(cv));
    const segments = path.replace(/\[(\d+)\]/g, ".$1").split(".");
    let target = updated;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const idx = Number(seg);
      target = !isNaN(idx) ? target[idx] : target[seg];
    }
    const lastSeg = segments[segments.length - 1];
    const lastIdx = Number(lastSeg);
    if (!isNaN(lastIdx)) target[lastIdx] = value;
    else target[lastSeg] = value;
    onTailoredCvChange(updated);
  };

  const renderEditableCV = () => {
    const personal = cv.personal as Record<string, string> | undefined;
    const summary = cv.summary as string | undefined;
    const experience = cv.experience as Array<Record<string, any>> | undefined;
    const education = cv.education as Array<Record<string, any>> | undefined;
    const skills = cv.skills as any;
    const extraSections = cv.extra_sections as Array<{ title: string; items: string[] }> | undefined;

    const ensureArray = (val: unknown): string[] => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') return val.split(',').map((s: string) => s.trim()).filter(Boolean);
      return [];
    };

    return (
      <div className="space-y-4 text-sm">
        {personal?.name && (
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Dati personali</p>
            <p className="font-medium">{personal.name}</p>
            {personal.email && <p className="text-muted-foreground">{personal.email}</p>}
          </div>
        )}
        {summary !== undefined && (
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Profilo</p>
            <InlineEdit value={summary || ""} onChange={(v) => updateCvField("summary", v)} multiline placeholder="Aggiungi un profilo..." />
          </div>
        )}
        {Array.isArray(experience) && experience.length > 0 && (
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Esperienza</p>
            {experience.map((exp, i) => (
              <div key={i} className="mb-3">
                <p className="font-medium">{exp.role || exp.title} — {exp.company}</p>
                <p className="text-muted-foreground text-xs">
                  {exp.start || exp.period}{exp.end && ` – ${exp.end}`}{exp.current && " – Attuale"}{exp.location && ` · ${exp.location}`}
                </p>
                {exp.description !== undefined && (
                  <InlineEdit value={exp.description || ""} onChange={(v) => updateCvField(`experience[${i}].description`, v)} multiline placeholder="Aggiungi descrizione..." className="mt-1" />
                )}
                {Array.isArray(exp.bullets) && exp.bullets.length > 0 && (
                  <ul className="mt-1 space-y-1">
                    {exp.bullets.map((b: string, j: number) => (
                      <li key={j} className="flex items-start gap-1.5 text-xs">
                        <span className="text-muted-foreground mt-1">•</span>
                        <InlineEdit
                          value={b}
                          onChange={(v) => {
                            const newBullets = [...exp.bullets];
                            newBullets[j] = v;
                            updateCvField(`experience[${i}].bullets`, newBullets);
                          }}
                          showIcon={false}
                          className="flex-1"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
        {Array.isArray(education) && education.length > 0 && (
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Formazione</p>
            {education.map((ed, i) => (
              <div key={i} className="mb-2">
                <p className="font-medium">{ed.degree}{ed.field && ` in ${ed.field}`} — {ed.institution}</p>
                <p className="text-muted-foreground text-xs">{ed.start || ed.period}{ed.end && ` – ${ed.end}`}</p>
                {ed.grade && <p className="text-xs text-primary">{ed.grade}</p>}
              </div>
            ))}
          </div>
        )}
        {skills && (
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Competenze</p>
            {skills.technical && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">Tecniche</p>
                <EditableSkillChips items={ensureArray(skills.technical)} onChange={(v) => updateCvField("skills.technical", v)} variant="primary" />
              </div>
            )}
            {skills.soft && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">Soft</p>
                <EditableSkillChips items={ensureArray(skills.soft)} onChange={(v) => updateCvField("skills.soft", v)} variant="outline" />
              </div>
            )}
            {skills.tools && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Strumenti</p>
                <EditableSkillChips items={ensureArray(skills.tools)} onChange={(v) => updateCvField("skills.tools", v)} variant="outline" />
              </div>
            )}
          </div>
        )}
        {Array.isArray(extraSections) && extraSections.length > 0 && extraSections.map((sec, i) => (
          <div key={i}>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">{sec.title}</p>
            <ul className="list-disc list-inside text-xs">
              {(Array.isArray(sec.items) ? sec.items : []).map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const renderCV = (data: Record<string, unknown>) => {
    const personal = data.personal as Record<string, string> | undefined;
    const summary = data.summary as string | undefined;
    const experience = data.experience as Array<Record<string, any>> | undefined;
    const education = data.education as Array<Record<string, any>> | undefined;
    const skills = data.skills as any;
    const extraSections = data.extra_sections as Array<{ title: string; items: string[] }> | undefined;

    const ensureArray = (val: unknown): string[] => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') return val.split(',').map((s: string) => s.trim()).filter(Boolean);
      return [];
    };

    const renderSkills = () => {
      if (!skills) return null;
      const sections: { label: string; items: string[] }[] = [];
      if (skills.technical) sections.push({ label: "Tecniche", items: ensureArray(skills.technical) });
      if (skills.soft) sections.push({ label: "Soft", items: ensureArray(skills.soft) });
      if (skills.tools) sections.push({ label: "Strumenti", items: ensureArray(skills.tools) });
      if (sections.length === 0) return null;
      return (
        <div>
          <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Competenze</p>
          {sections.map((sec) => (
            <div key={sec.label} className="mb-1">
              <span className="text-xs text-muted-foreground">{sec.label}: </span>
              <span className="text-xs">{sec.items.join(", ")}</span>
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="space-y-4 text-sm">
        {personal?.name && (
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Dati personali</p>
            <p className="font-medium">{personal.name}</p>
            {personal.email && <p className="text-muted-foreground">{personal.email}</p>}
          </div>
        )}
        {summary && (
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Profilo</p>
            <p>{summary}</p>
          </div>
        )}
        {Array.isArray(experience) && experience.length > 0 && (
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Esperienza</p>
            {experience.map((exp, i) => (
              <div key={i} className="mb-2">
                <p className="font-medium">{exp.role || exp.title} — {exp.company}</p>
                <p className="text-muted-foreground text-xs">
                  {exp.start || exp.period}{exp.end && ` – ${exp.end}`}{exp.current && " – Attuale"}{exp.location && ` · ${exp.location}`}
                </p>
                {exp.description && <p className="mt-1">{exp.description}</p>}
                {Array.isArray(exp.bullets) && exp.bullets.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-xs">
                    {exp.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
        {Array.isArray(education) && education.length > 0 && (
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Formazione</p>
            {education.map((ed, i) => (
              <div key={i} className="mb-1">
                <p className="font-medium">{ed.degree}{ed.field && ` in ${ed.field}`} — {ed.institution}</p>
                <p className="text-muted-foreground text-xs">{ed.start || ed.period}{ed.end && ` – ${ed.end}`}</p>
                {ed.grade && <p className="text-xs text-primary">{ed.grade}</p>}
              </div>
            ))}
          </div>
        )}
        {renderSkills()}
        {Array.isArray(extraSections) && extraSections.length > 0 && extraSections.map((sec, i) => (
          <div key={i}>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">{sec.title}</p>
            <ul className="list-disc list-inside text-xs">
              {(Array.isArray(sec.items) ? sec.items : []).map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: appErr } = await supabase
        .from("applications")
        .update({
          status: "inviata",
          match_score: matchScore,
          ats_score: atsScore,
          template_id: "classico",
        } as any)
        .eq("id", applicationId);
      if (appErr) throw appErr;

      const { data: existingTc } = await supabase
        .from("tailored_cvs")
        .select("id")
        .eq("application_id", applicationId)
        .maybeSingle();

      const tcPayload = {
        user_id: user.id,
        application_id: applicationId,
        master_cv_id: tailorResult.master_cv_id,
        tailored_data: cv as unknown as import("@/integrations/supabase/types").Json,
        skills_match: {
          present: analyzeResult?.skills_present || [],
          missing: analyzeResult?.skills_missing || [],
        } as unknown as import("@/integrations/supabase/types").Json,
        suggestions: tailorResult.diff as unknown as import("@/integrations/supabase/types").Json,
        ats_score: atsScore,
        ats_checks: atsChecks as unknown as import("@/integrations/supabase/types").Json,
        seniority_match: analyzeResult?.seniority_match as unknown as import("@/integrations/supabase/types").Json,
        honest_score: tailorResult.honest_score as unknown as import("@/integrations/supabase/types").Json,
        diff: tailorResult.diff as unknown as import("@/integrations/supabase/types").Json,
      };

      const { error: cvErr } = existingTc
        ? await supabase.from("tailored_cvs").update(tcPayload as any).eq("id", existingTc.id)
        : await supabase.from("tailored_cvs").insert([tcPayload as any]);
      if (cvErr) throw cvErr;

      toast.success("Candidatura salvata!");
      navigate("/app/home");
    } catch (e) {
      console.error("Save error:", e);
      toast.error("Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  const [originalCV, setOriginalCV] = useState<Record<string, unknown> | null>(tailorResult.original_cv ?? null);

  useEffect(() => {
    if (originalCV) return;
    supabase
      .from("master_cvs")
      .select("parsed_data")
      .eq("id", tailorResult.master_cv_id)
      .single()
      .then(({ data }) => {
        if (data?.parsed_data) setOriginalCV(data.parsed_data as Record<string, unknown>);
      });
  }, [tailorResult.master_cv_id, originalCV]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24 px-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-2xl font-bold truncate">
            {jobData.role_title} — {jobData.company_name}
          </h2>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="rounded-full bg-primary/20 px-3 py-1 font-mono text-sm font-bold text-primary">
            {matchScore}%
          </span>
          <span className="rounded-full bg-secondary/20 px-3 py-1 font-mono text-sm font-bold text-secondary">
            ATS {atsScore}%
          </span>
        </div>
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden md:grid md:grid-cols-2 gap-4">
        <Card className="border-border/30 bg-card/60">
          <CardContent className="pt-5">
            <p className="font-mono text-xs text-muted-foreground uppercase mb-3">Originale</p>
            {originalCV ? renderCV(originalCV) : <p className="text-muted-foreground text-sm">Caricamento...</p>}
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-card/80">
          <CardContent className="pt-5">
            <p className="font-mono text-xs text-primary uppercase mb-3">Adattato — clicca per modificare</p>
            {renderEditableCV()}
          </CardContent>
        </Card>
      </div>

      {/* Mobile: tabs */}
      <div className="md:hidden">
        <Tabs value={diffTab} onValueChange={setDiffTab}>
          <TabsList className="w-full">
            <TabsTrigger value="originale" className="flex-1">Originale</TabsTrigger>
            <TabsTrigger value="adattato" className="flex-1">Adattato</TabsTrigger>
          </TabsList>
          <TabsContent value="originale" className="mt-4">
            <Card className="border-border/30 bg-card/60">
              <CardContent className="pt-5">
                {originalCV ? renderCV(originalCV) : <p className="text-muted-foreground text-sm">Caricamento...</p>}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="adattato" className="mt-4">
            <Card className="border-primary/30 bg-card/80">
              <CardContent className="pt-5">
                <p className="font-mono text-xs text-primary uppercase mb-3">Clicca per modificare</p>
                {renderEditableCV()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-14 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-md p-4 md:bottom-0 md:left-16">
        <div className="mx-auto max-w-4xl flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => setExportOpen(true)}>
            <DownloadSimple size={16} /> Scarica PDF
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
            {saving ? (
              <><SpinnerGap size={16} className="animate-spin" /> Salvataggio...</>
            ) : (
              <><FloppyDisk size={16} /> Salva candidatura</>
            )}
          </Button>
        </div>
      </div>

      <ExportDrawer
        open={exportOpen}
        onOpenChange={setExportOpen}
        tailoredCv={cv}
        atsScore={atsScore}
        atsChecks={atsChecks}
        honestScore={tailorResult.honest_score}
        companyName={jobData.company_name}
        applicationId={applicationId}
        userId={user?.id}
      />
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
    supabase
      .from("master_cvs")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .then(({ data }) => {
        setCvCheck(data && data.length > 0 ? "ok" : "missing");
      });
  }, [user]);

  // Draft resumption
  useEffect(() => {
    const draftId = searchParams.get("draft");
    if (!draftId || !user || draftLoadedId.current === draftId) return;
    draftLoadedId.current = draftId;

    (async () => {
      const { data: app } = await supabase
        .from("applications")
        .select("*")
        .eq("id", draftId)
        .single();

      if (!app) {
        toast.error("Bozza non trovata.");
        return;
      }

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

      const { data: tc } = await supabase
        .from("tailored_cvs")
        .select("*")
        .eq("application_id", draftId)
        .maybeSingle();

      if (tc?.tailored_data) {
        // Restore both analyze and tailor results from saved data
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
        const urlStep = parseInt(searchParams.get("step") || "4", 10);
        updateStep(urlStep >= 2 ? urlStep : 4);
      } else if (app.job_description) {
        updateStep(1);
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
          .from("applications")
          .insert({
            user_id: user.id,
            company_name: data.company_name,
            role_title: data.role_title,
            job_url: url || null,
            job_description: data.description,
            status: "draft",
          })
          .select("id")
          .single();

        if (draftErr) throw draftErr;
        appId = draftApp.id;
        setApplicationId(appId);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("draft", appId!);
          next.set("step", "1");
          return next;
        }, { replace: true });
      }

      const { data: result, error } = await supabase.functions.invoke("ai-prescreen", {
        body: { job_data: data },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      setPrescreenResult(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Errore durante il pre-screening";
      toast.error(msg);
      updateStep(0);
    } finally {
      setPrescreening(false);
    }
  };

  // Step 1 → Step 2: Run ANALYZE only
  const handleVerificaProceed = async (answers: { question: string; answer: string }[]) => {
    if (!user || !jobData) return;
    setUserAnswers(answers);
    updateStep(2);
    setAnalyzing(true);
    setAnalyzeResult(null);

    try {
      if (applicationId && answers.length > 0) {
        await supabase
          .from("applications")
          .update({ user_answers: answers } as any)
          .eq("id", applicationId);
      }

      const { data: result, error } = await supabase.functions.invoke("ai-tailor", {
        body: {
          job_data: jobData,
          user_answers: answers.length > 0 ? answers : undefined,
          mode: "analyze",
        },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      // Save scores to application
      if (applicationId) {
        await supabase
          .from("applications")
          .update({ match_score: result.match_score, ats_score: result.ats_score } as any)
          .eq("id", applicationId);
      }

      setAnalyzeResult(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Errore durante l'analisi AI";
      toast.error(msg);
      updateStep(1);
    } finally {
      setAnalyzing(false);
    }
  };

  // Step 2 → Step 3: Run TAILOR
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
          analyze_context: {
            match_score: analyzeResult.match_score,
            skills_missing: analyzeResult.skills_missing,
            detected_language: analyzeResult.detected_language,
          },
        },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      setTailorResult(result);
      updateStep(3);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Errore durante la generazione del CV";
      toast.error(msg);
    } finally {
      setTailoring(false);
    }
  };

  // Abandon: reset and go to new application
  const handleAbandon = () => {
    setStep(0);
    setJobData(null);
    setJobUrl(undefined);
    setPrescreenResult(null);
    setAnalyzeResult(null);
    setTailorResult(null);
    setApplicationId(null);
    setUserAnswers([]);
    setSearchParams({}, { replace: true });
  };

  // Handle inline CV edits in Step 4
  const handleTailoredCvChange = (updatedCv: Record<string, unknown>) => {
    if (tailorResult) {
      setTailorResult({ ...tailorResult, tailored_cv: updatedCv });
    }
  };

  if (cvCheck === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerGap size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (cvCheck === "missing") {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-6">
        <FileArrowUp size={48} className="text-primary mx-auto" />
        <div>
          <h2 className="font-display text-2xl font-bold">CV necessario</h2>
          <p className="text-muted-foreground mt-2">
            Per creare una candidatura, devi prima caricare il tuo CV. Verso lo userà per adattarlo all'annuncio.
          </p>
        </div>
        <Button onClick={() => navigate("/onboarding")} className="gap-2">
          Carica il tuo CV <ArrowRight size={16} />
        </Button>
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
            <StepScore
              result={analyzeResult}
              loading={analyzing}
              onGenerateCv={handleGenerateCv}
              onAbandon={handleAbandon}
              onBack={() => updateStep(1)}
              tailoring={tailoring}
            />
          )}
          {step === 3 && (
            <StepModifiche
              result={tailorResult}
              analyzeResult={analyzeResult}
              loading={tailoring && !tailorResult}
              onNext={(approvedCv) => {
                if (tailorResult) {
                  setTailorResult({ ...tailorResult, tailored_cv: approvedCv });
                }
                updateStep(4);
              }}
              onBack={() => updateStep(2)}
            />
          )}
          {step === 4 && tailorResult && jobData && applicationId && (
            <StepCVAdattato
              tailorResult={tailorResult}
              analyzeResult={analyzeResult}
              jobData={jobData}
              applicationId={applicationId}
              onBack={() => updateStep(3)}
              onTailoredCvChange={handleTailoredCvChange}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
