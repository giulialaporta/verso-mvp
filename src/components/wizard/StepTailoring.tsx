import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle, XCircle, Warning,
  ChartLineUp, MagicWand, SpinnerGap, GraduationCap, Globe, Target, ArrowClockwise, Plus,
} from "@phosphor-icons/react";
import { useAnimatedCounter, ATS_LABELS_IT } from "./wizard-utils";
import type { AnalyzeResult } from "./wizard-types";
import { AiLabel } from "@/components/AiLabel";

export function StepTailoring({
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
