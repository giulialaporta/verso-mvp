import { useState } from "react";
import { AiLabel } from "@/components/AiLabel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle, XCircle, Warning,
  SpinnerGap, ShieldWarning, ChatTeardropDots,
} from "@phosphor-icons/react";
import { SalaryAnalysisCard } from "@/components/SalaryAnalysisCard";
import type { PrescreenResult } from "./wizard-types";

type StructuredAnswer = { level: string; detail: string };

const DEFAULT_OPTIONS = [
  { value: "expert", label: "Sì, molto" },
  { value: "some", label: "Un po'" },
  { value: "none", label: "No" },
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
  const [answers, setAnswers] = useState<Record<string, StructuredAnswer>>({});

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
      .filter((q) => answers[q.id]?.level)
      .map((q) => ({
        question: q.question,
        answer: `${answers[q.id].level}${answers[q.id].detail ? ` — ${answers[q.id].detail}` : ""}`,
        level: answers[q.id].level,
        detail: answers[q.id].detail || "",
      }));
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
              <div className="flex items-center gap-2"><ChatTeardropDots size={20} className="text-info" weight="fill" /><span className="text-sm font-medium">Aiutami a conoscerti meglio</span></div>
              <p className="text-xs text-muted-foreground">Seleziona il tuo livello per ogni domanda. Le risposte sono facoltative ma aiutano Verso a personalizzare il CV.</p>
              <div className="space-y-5">
                {prescreenResult.follow_up_questions.map((q) => {
                  const options = q.options || getOptionsForField(q.field);
                  const current = answers[q.id] || { level: "", detail: "" };
                  return (
                    <div key={q.id} className="space-y-2.5">
                      <p className="text-sm font-medium">{q.question}</p>
                      <p className="text-xs text-muted-foreground italic">{q.context}</p>
                      <RadioGroup
                        value={current.level}
                        onValueChange={(val) =>
                          setAnswers((prev) => ({ ...prev, [q.id]: { ...prev[q.id], level: val, detail: prev[q.id]?.detail || "" } }))
                        }
                        className="flex flex-wrap gap-2"
                      >
                        {options.map((opt) => (
                          <div key={opt.value} className="flex items-center">
                            <RadioGroupItem value={opt.value} id={`${q.id}-${opt.value}`} className="sr-only peer" />
                            <Label
                              htmlFor={`${q.id}-${opt.value}`}
                              className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary hover:border-muted-foreground/50"
                            >
                              {opt.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {current.level && current.level !== "none" && (
                        <Input
                          value={current.detail}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [q.id]: { ...prev[q.id], detail: e.target.value.slice(0, 200) } }))
                          }
                          placeholder="Dettaglio opzionale (max 200 car.)..."
                          maxLength={200}
                          className="text-sm h-9"
                        />
                      )}
                    </div>
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
