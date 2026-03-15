import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Warning, Eye, CaretDown, ListChecks, Wrench, SpinnerGap } from "@phosphor-icons/react";
import { AiLabel } from "@/components/AiLabel";
import { computeConfidence } from "./wizard-utils";
import { SkillManager, skillsToManaged, managedToSkills, type ManagedSkill } from "./SkillManager";
import type { TailorResult, AnalyzeResult } from "./wizard-types";

export function StepRevisione({
  tailorResult,
  analyzeResult,
  originalCv,
  onNext,
  onBack,
  onUpdateSkills,
  tailoring,
}: {
  tailorResult: TailorResult | null;
  analyzeResult: AnalyzeResult | null;
  originalCv: Record<string, unknown> | null;
  onNext: () => void;
  onBack: () => void;
  onUpdateSkills?: (skills: any) => void;
  tailoring?: boolean;
}) {
  const [diffOpen, setDiffOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);

  const initialManaged = useMemo(
    () => skillsToManaged((tailorResult?.tailored_cv as any)?.skills),
    [tailorResult?.tailored_cv]
  );
  const [managedSkills, setManagedSkills] = useState<ManagedSkill[]>(initialManaged);

  const handleSkillsChange = (updated: ManagedSkill[]) => {
    setManagedSkills(updated);
    if (onUpdateSkills && tailorResult) {
      const originalSkills = (tailorResult.tailored_cv as any)?.skills;
      onUpdateSkills(managedToSkills(updated, originalSkills));
    }
  };

  const stats = useMemo(() =>
    tailorResult ? computeConfidence(originalCv, tailorResult.tailored_cv, tailorResult.diff) : null,
    [originalCv, tailorResult]
  );

  // Tailoring loading state — shown when user clicked "Genera CV" and we advanced here
  if (tailoring || !tailorResult || !stats) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Adattamento CV</h2>
          <p className="text-muted-foreground mt-1">Sto adattando il tuo CV al ruolo...</p>
        </div>
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

  const matchScore = analyzeResult?.match_score ?? 0;
  const atsScore = analyzeResult?.ats_score ?? 0;
  const totalDiffs = tailorResult.diff?.length ?? 0;
  const structChanges = tailorResult.structural_changes?.length ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={20} /></button>
        <div>
          <h2 className="font-display text-2xl font-bold">CV Adattato</h2>
          <p className="text-muted-foreground mt-1">Riepilogo delle modifiche effettuate.</p>
        </div>
      </div>
      <AiLabel text="Punteggi calcolati con AI — valore indicativo" />

      {/* Compact scores */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="py-4 text-center space-y-1">
            <p className="text-[11px] font-mono text-muted-foreground uppercase">Match</p>
            <p className="font-mono text-xl font-bold text-primary">{matchScore}%</p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-destructive via-warning to-primary" style={{ width: `${matchScore}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="py-4 text-center space-y-1">
            <p className="text-[11px] font-mono text-muted-foreground uppercase">ATS</p>
            <p className="font-mono text-xl font-bold text-info">{atsScore}%</p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-info" style={{ width: `${atsScore}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change counters */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="py-5 space-y-3">
          <div className="flex items-center gap-2">
            <ListChecks size={18} className="text-primary" />
            <span className="text-sm font-medium">Cosa ho cambiato</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/30 p-3 text-center">
              <p className="font-mono text-lg font-bold text-foreground">{stats.bulletsRewritten}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Bullet riscritti</p>
            </div>
            <div className="rounded-lg border border-border/30 p-3 text-center">
              <p className="font-mono text-lg font-bold text-foreground">{stats.bulletsAdded}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Bullet aggiunti</p>
            </div>
            <div className="rounded-lg border border-border/30 p-3 text-center">
              <p className="font-mono text-lg font-bold text-foreground">{stats.sectionsRemoved}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Esperienze rimosse</p>
            </div>
            <div className="rounded-lg border border-border/30 p-3 text-center">
              <p className="font-mono text-lg font-bold text-foreground">{structChanges}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Modifiche strutturali</p>
            </div>
            <div className="rounded-lg border border-border/30 p-3 text-center">
              <p className="font-mono text-lg font-bold text-foreground">{stats.experiencesKept}/{stats.experiencesOriginal}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Esperienze mantenute</p>
            </div>
            <div className="rounded-lg border border-border/30 p-3 text-center">
              <p className="font-mono text-lg font-bold text-foreground">{totalDiffs}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Modifiche contenuto</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill manager */}
      {managedSkills.length > 0 && (
        <Collapsible open={skillsOpen} onOpenChange={setSkillsOpen}>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="py-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Wrench size={16} className="text-primary" />
                  <span className="text-sm font-medium">Gestisci competenze</span>
                  <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {managedSkills.filter(s => s.visible).length}/{managedSkills.length}
                  </span>
                </div>
                <CaretDown size={14} className={`text-muted-foreground transition-transform ${skillsOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4">
                  <SkillManager skills={managedSkills} onChange={handleSkillsChange} />
                </div>
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>
      )}

      {/* Collapsible diff */}
      {totalDiffs > 0 && (
        <Collapsible open={diffOpen} onOpenChange={setDiffOpen}>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="py-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-primary" />
                  <span className="text-sm font-medium">Dettaglio modifiche</span>
                  <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{totalDiffs}</span>
                </div>
                <CaretDown size={14} className={`text-muted-foreground transition-transform ${diffOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3 mt-4">
                  {tailorResult.diff.map((ch, i) => (
                    <div key={i} className="rounded-lg border border-border/30 p-3 space-y-1.5">
                      <p className="font-mono text-[11px] text-muted-foreground uppercase">{ch.section}</p>
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

      <Button onClick={onNext} className="w-full gap-2 active:scale-[0.98] transition-transform">
        Procedi al download <ArrowRight size={16} />
      </Button>
    </div>
  );
}
