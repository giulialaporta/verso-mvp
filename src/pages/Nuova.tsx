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
} from "@phosphor-icons/react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ExportDrawer } from "@/components/ExportDrawer";

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

type TailorResult = {
  match_score: number;
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
  tailored_cv: Record<string, unknown>;
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
  }[];
  master_cv_id: string;
};

// --- Step Indicator ---
function StepIndicator({ current }: { current: number }) {
  const steps = ["Annuncio", "Analisi", "CV Adattato"];
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-medium transition-colors ${
              i < current
                ? "bg-primary text-primary-foreground"
                : i === current
                  ? "bg-primary/20 text-primary ring-2 ring-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i < current ? <CheckCircle size={16} weight="fill" /> : i + 1}
          </div>
          <span className={`hidden sm:inline text-sm ${i === current ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {label}
          </span>
          {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
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

// --- Step 1: Job Input ---
function Step1({
  onConfirm,
}: {
  onConfirm: (data: JobData, jobUrl?: string, jobText?: string) => void;
}) {
  const [tab, setTab] = useState<string>("text");
  const [guideOpen, setGuideOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [companyName, setCompanyName] = useState("");
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
                  Conferma e analizza <ArrowRight size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// --- Step 2: AI Analysis ---
function Step2({
  result,
  loading,
  onNext,
  onBack,
}: {
  result: TailorResult | null;
  loading: boolean;
  onNext: () => void;
  onBack: () => void;
}) {
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Analisi in corso</h2>
          <p className="text-muted-foreground mt-1">Verso sta confrontando il tuo CV con l'annuncio...</p>
        </div>
        {["Confronto competenze...", "Calcolo match score...", "Adattamento CV..."].map((msg, i) => (
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
          <h2 className="font-display text-2xl font-bold">Risultato analisi</h2>
          <p className="text-muted-foreground mt-1">Ecco come il tuo CV si allinea con l'offerta.</p>
        </div>
      </div>

      {/* Score Meter */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="py-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartLineUp size={20} className="text-primary" />
              <span className="text-sm font-medium">Match Score</span>
            </div>
            <motion.span
              className="font-mono text-2xl font-bold text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {result.match_score}%
            </motion.span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-destructive via-warning to-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${result.match_score}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dual Score */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="py-4 text-center">
            <p className="text-xs font-mono text-muted-foreground uppercase mb-1">ATS Score</p>
            <motion.span
              className="font-mono text-2xl font-bold text-secondary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {result.ats_score}%
            </motion.span>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
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
      </div>

      {/* Skill Match */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-primary/20 bg-card/80">
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

        <Card className="border-destructive/20 bg-card/80">
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
      </div>

      {/* ATS Checks */}
      {result.ats_checks && result.ats_checks.length > 0 && (
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
      )}

      {/* Diff / Suggestions */}
      {result.diff && result.diff.length > 0 && (
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-5 space-y-4">
            <p className="text-sm font-medium">Modifiche suggerite</p>
            {result.diff.slice(0, 6).map((ch, i) => (
              <div key={i} className="space-y-1 border-l-2 border-primary/30 pl-3">
                <p className="text-xs font-mono text-muted-foreground uppercase">{ch.section}</p>
                <p className="text-sm line-through text-muted-foreground">{ch.original}</p>
                <p className="text-sm text-primary">{ch.suggested}</p>
                {ch.reason && <p className="text-xs text-muted-foreground italic">{ch.reason}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button onClick={onNext} className="w-full gap-2">
        Vedi il CV adattato <ArrowRight size={16} />
      </Button>
    </div>
  );
}

// --- Step 3: Diff View ---
function Step3({
  result,
  jobData,
  applicationId,
  onBack,
}: {
  result: TailorResult;
  jobData: JobData;
  applicationId: string;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [diffTab, setDiffTab] = useState<string>("adattato");
  const [exportOpen, setExportOpen] = useState(false);

  // Render sections from a CV object
  const renderCV = (cv: Record<string, unknown>) => {
    const personal = cv.personal as Record<string, string> | undefined;
    const summary = cv.summary as string | undefined;
    const experience = cv.experience as Array<Record<string, any>> | undefined;
    const education = cv.education as Array<Record<string, any>> | undefined;
    const skills = cv.skills as any;
    const extraSections = cv.extra_sections as Array<{ title: string; items: string[] }> | undefined;

    // Render skills - handle both flat array (legacy) and structured object
    const renderSkills = () => {
      if (!skills) return null;
      if (Array.isArray(skills)) {
        return (
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Competenze</p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s: string) => (
                <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">{s}</span>
              ))}
            </div>
          </div>
        );
      }
      const ensureArray = (val: unknown): string[] => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') return val.split(',').map((s: string) => s.trim()).filter(Boolean);
        return [];
      };
      const all = [
        ...ensureArray(skills.technical),
        ...ensureArray(skills.soft),
        ...ensureArray(skills.tools),
      ];
      return all.length > 0 ? (
        <div>
          <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Competenze</p>
          <div className="flex flex-wrap gap-1.5">
            {all.map((s: string) => (
              <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">{s}</span>
            ))}
          </div>
          {skills.languages && skills.languages.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.languages.map((l: any, i: number) => (
                <span key={i} className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground">
                  {l.language}{l.level && ` — ${l.level}`}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : null;
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
        {experience && experience.length > 0 && (
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Esperienza</p>
            {experience.map((exp, i) => (
              <div key={i} className="mb-2">
                <p className="font-medium">{exp.role || exp.title} — {exp.company}</p>
                <p className="text-muted-foreground text-xs">
                  {exp.start || exp.period}
                  {exp.end && ` – ${exp.end}`}
                  {exp.current && " – Attuale"}
                  {exp.location && ` · ${exp.location}`}
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
        {education && education.length > 0 && (
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">Formazione</p>
            {education.map((ed, i) => (
              <div key={i} className="mb-1">
                <p className="font-medium">
                  {ed.degree}{ed.field && ` in ${ed.field}`} — {ed.institution}
                </p>
                <p className="text-muted-foreground text-xs">
                  {ed.start || ed.period}
                  {ed.end && ` – ${ed.end}`}
                </p>
                {ed.grade && <p className="text-xs text-primary">{ed.grade}</p>}
              </div>
            ))}
          </div>
        )}
        {renderSkills()}
        {extraSections && extraSections.length > 0 && extraSections.map((sec, i) => (
          <div key={i}>
            <p className="font-mono text-xs text-muted-foreground uppercase mb-1">{sec.title}</p>
            <ul className="list-disc list-inside text-xs">
              {sec.items.map((item, j) => <li key={j}>{item}</li>)}
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
      // Update draft application to "inviata" with ats_score
      const { error: appErr } = await supabase
        .from("applications")
        .update({
          status: "inviata",
          ats_score: result.ats_score,
          template_id: "classico",
        } as any)
        .eq("id", applicationId);

      if (appErr) throw appErr;

      // Create tailored CV with all new fields
      const { error: cvErr } = await supabase.from("tailored_cvs").insert([{
        user_id: user.id,
        application_id: applicationId,
        master_cv_id: result.master_cv_id,
        tailored_data: result.tailored_cv as unknown as import("@/integrations/supabase/types").Json,
        skills_match: {
          present: result.skills_present,
          missing: result.skills_missing,
        } as unknown as import("@/integrations/supabase/types").Json,
        suggestions: result.diff as unknown as import("@/integrations/supabase/types").Json,
        ats_score: result.ats_score,
        ats_checks: result.ats_checks as unknown as import("@/integrations/supabase/types").Json,
        seniority_match: result.seniority_match as unknown as import("@/integrations/supabase/types").Json,
        honest_score: result.honest_score as unknown as import("@/integrations/supabase/types").Json,
        diff: result.diff as unknown as import("@/integrations/supabase/types").Json,
      } as any]);

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

  // Fetch original CV for diff (we stored it in result context)
  // We'll get it from the master_cvs table
  const [originalCV, setOriginalCV] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    supabase
      .from("master_cvs")
      .select("parsed_data")
      .eq("id", result.master_cv_id)
      .single()
      .then(({ data }) => {
        if (data?.parsed_data) setOriginalCV(data.parsed_data as Record<string, unknown>);
      });
  }, [result.master_cv_id]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24 px-4">
      {/* Header */}
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
            {result.match_score}%
          </span>
          <span className="rounded-full bg-secondary/20 px-3 py-1 font-mono text-sm font-bold text-secondary">
            ATS {result.ats_score}%
          </span>
        </div>
      </div>

      {/* Desktop: side-by-side, Mobile: tabs */}
      <div className="hidden md:grid md:grid-cols-2 gap-4">
        <Card className="border-border/30 bg-card/60">
          <CardContent className="pt-5">
            <p className="font-mono text-xs text-muted-foreground uppercase mb-3">Originale</p>
            {originalCV ? renderCV(originalCV) : <p className="text-muted-foreground text-sm">Caricamento...</p>}
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-card/80">
          <CardContent className="pt-5">
            <p className="font-mono text-xs text-primary uppercase mb-3">Adattato</p>
            {renderCV(result.tailored_cv)}
          </CardContent>
        </Card>
      </div>

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
                {renderCV(result.tailored_cv)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-md p-4 md:pl-64">
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
        tailoredCv={result.tailored_cv}
        atsScore={result.ats_score}
        atsChecks={result.ats_checks}
        honestScore={result.honest_score}
        companyName={jobData.company_name}
        applicationId={applicationId}
        userId={user?.id}
      />
    </div>
  );
}

// --- Main Wizard ---
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
  const [tailorResult, setTailorResult] = useState<TailorResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [cvCheck, setCvCheck] = useState<"loading" | "ok" | "missing">("loading");
  const [applicationId, setApplicationId] = useState<string | null>(
    searchParams.get("draft")
  );
  const draftLoaded = useRef(false);

  // Sync step to URL for persistence across desktop/mobile remounts
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

  // Draft resumption: load application + tailored_cv from DB
  useEffect(() => {
    const draftId = searchParams.get("draft");
    if (!draftId || !user || draftLoaded.current) return;
    draftLoaded.current = true;

    (async () => {
      // Load the application
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

      // Check if tailored_cv exists
      const { data: tc } = await supabase
        .from("tailored_cvs")
        .select("*")
        .eq("application_id", draftId)
        .maybeSingle();

      if (tc?.tailored_data) {
        // Restore full result from saved data
        setTailorResult({
          match_score: app.match_score ?? 0,
          ats_score: tc.ats_score ?? 0,
          skills_present: (tc.skills_match as any)?.present || [],
          skills_missing: (tc.skills_match as any)?.missing || [],
          seniority_match: tc.seniority_match as any || { candidate_level: "", role_level: "", match: true, note: "" },
          ats_checks: (tc.ats_checks as any) || [],
          tailored_cv: tc.tailored_data as Record<string, unknown>,
          honest_score: (tc.honest_score as any) || { confidence: 100, experiences_added: 0, skills_invented: 0, dates_modified: 0, bullets_repositioned: 0, bullets_rewritten: 0, sections_removed: 0, flags: [] },
          diff: (tc.diff as any) || [],
          master_cv_id: tc.master_cv_id,
        });
        // Jump to step from URL or default to step 2 (results)
        const urlStep = parseInt(searchParams.get("step") || "2", 10);
        updateStep(urlStep >= 1 ? urlStep : 2);
      } else if (app.job_description) {
        // Has job data but no tailored CV — rerun AI
        updateStep(1);
        setAnalyzing(true);
        try {
          const jobDataForAI: JobData = {
            company_name: app.company_name,
            role_title: app.role_title,
            description: app.job_description,
            key_requirements: [],
            required_skills: [],
          };
          const { data: result, error } = await supabase.functions.invoke("ai-tailor", {
            body: { job_data: jobDataForAI },
          });
          if (error) throw error;
          if (result?.error) throw new Error(result.error);

          await supabase
            .from("applications")
            .update({ match_score: result.match_score, ats_score: result.ats_score } as any)
            .eq("id", app.id);

          setTailorResult(result);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Errore durante l'analisi AI");
          updateStep(0);
        } finally {
          setAnalyzing(false);
        }
      }
      // else: no job_description — stay on step 0
    })();
  }, [searchParams, user, updateStep]);

  const handleStep1Confirm = async (data: JobData, url?: string, _text?: string) => {
    if (!user) return;
    setJobData(data);
    setJobUrl(url);
    updateStep(1);
    setAnalyzing(true);
    setTailorResult(null);

    try {
      // 1. Save draft application immediately (only if no existing draft)
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

      // 2. Run AI analysis
      const { data: result, error } = await supabase.functions.invoke("ai-tailor", {
        body: { job_data: data },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      // 3. Update draft with match_score and ats_score
      await supabase
        .from("applications")
        .update({ match_score: result.match_score, ats_score: result.ats_score } as any)
        .eq("id", appId);

      setTailorResult(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Errore durante l'analisi AI";
      toast.error(msg);
      updateStep(0);
    } finally {
      setAnalyzing(false);
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
          {step === 0 && <Step1 onConfirm={handleStep1Confirm} />}
          {step === 1 && (
            <Step2
              result={tailorResult}
              loading={analyzing}
              onNext={() => updateStep(2)}
              onBack={() => updateStep(0)}
            />
          )}
          {step === 2 && tailorResult && jobData && applicationId && (
            <Step3
              result={tailorResult}
              jobData={jobData}
              applicationId={applicationId}
              onBack={() => updateStep(1)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
