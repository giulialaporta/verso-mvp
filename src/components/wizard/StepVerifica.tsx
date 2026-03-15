import { useState } from "react";
import { AiLabel } from "@/components/AiLabel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle, XCircle, Warning,
  SpinnerGap, ShieldWarning, ChatTeardropDots, Check,
} from "@phosphor-icons/react";
import { SalaryAnalysisCard } from "@/components/SalaryAnalysisCard";
import type { PrescreenResult } from "./wizard-types";

const DEFAULT_OPTIONS = [
  { value: "yes", label: "Sì" },
  { value: "some", label: "Un po'" },
  { value: "no", label: "No" },
];

export function StepVerifica({
  prescreenResult,
  loading,
  onProceed,
  onBack,
}: {
  prescreenResult: PrescreenResult | null;
  loading: boolean;
  onProceed: (answers: { question: string; answer: string; level?: string; detail?: string }[]) => void;
  onBack: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Pre-screening</h2>
          <p className="text-muted-foreground mt-1">Sto analizzando i requisiti dell'annuncio...</p>
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
      .filter((q) => answers[q.id])
      .map((q) => {
        const selectedValue = answers[q.id];
        const selectedOption = (q.options || DEFAULT_OPTIONS).find(o => o.value === selectedValue);
        return {
          question: q.question,
          answer: selectedOption?.label || selectedValue,
          level: selectedValue,
          detail: "",
        };
      });
    onProceed(formattedAnswers);
  };

  const selectAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === value ? "" : value, // toggle
    }));
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
      <AiLabel text="Analisi generata con AI — verifica i risultati" />

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
              <p className="text-xs text-muted-foreground italic pt-2 border-t border-border/30">Non ti impedisco di candidarti, ma voglio che tu sia consapevole di questi gap.</p>
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
                    <span className={`ml-2 font-mono text-[11px] uppercase px-1.5 py-0.5 rounded-full ${
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
            <CardContent className="pt-5 space-y-5">
              <div>
                <div className="flex items-center gap-2">
                  <ChatTeardropDots size={20} className="text-info" weight="fill" />
                  <span className="text-sm font-medium">Aiutami a conoscerti meglio</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Tocca la risposta più vicina alla tua esperienza. Facoltativo ma migliora il CV.</p>
              </div>
              <div className="space-y-4">
                {prescreenResult.follow_up_questions.map((q, qi) => {
                  const options = q.options?.length ? q.options : DEFAULT_OPTIONS;
                  const selected = answers[q.id];
                  return (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + qi * 0.1 }}
                      className="space-y-2"
                    >
                      <p className="text-sm font-medium leading-snug">{q.question}</p>
                      <p className="text-[11px] text-muted-foreground">{q.context}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {options.map((opt) => {
                          const isSelected = selected === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => selectAnswer(q.id, opt.value)}
                              className={`
                                inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium
                                transition-all duration-150 border
                                ${isSelected
                                  ? "border-primary bg-primary/15 text-primary"
                                  : "border-border bg-background/50 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                                }
                              `}
                            >
                              <AnimatePresence mode="wait">
                                {isSelected && (
                                  <motion.span
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 14, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden"
                                  >
                                    <Check size={14} weight="bold" />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
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
