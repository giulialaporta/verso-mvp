import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChartLineUp,
  Warning,
  Plus,
  X,
  Lightbulb,
  User,
  TextAa,
} from "@phosphor-icons/react";
import type { ParsedCV } from "@/types/cv";

export interface OptimizationTip {
  category: "missing_kpi" | "missing_section" | "weak_bullets" | "generic_skills" | "missing_contact" | "summary_quality";
  message: string;
  priority: "high" | "medium" | "low";
  section?: string;
}

interface CVOptimizationTipsProps {
  tips: OptimizationTip[];
  onDismiss?: (index: number) => void;
  onAddSection?: (section: string) => void;
  data?: ParsedCV;
  onUpdate?: (data: ParsedCV) => void;
}

const CATEGORY_CONFIG: Record<
  OptimizationTip["category"],
  { icon: typeof Warning; label: string }
> = {
  missing_kpi: { icon: ChartLineUp, label: "KPI mancanti" },
  missing_section: { icon: Plus, label: "Sezione mancante" },
  weak_bullets: { icon: TextAa, label: "Bullet deboli" },
  generic_skills: { icon: Warning, label: "Skill generiche" },
  missing_contact: { icon: User, label: "Contatto mancante" },
  summary_quality: { icon: Lightbulb, label: "Summary" },
};

const PRIORITY_BORDER: Record<OptimizationTip["priority"], string> = {
  high: "border-l-primary",
  medium: "border-l-warning",
  low: "border-l-border",
};

export function CVOptimizationTips({
  tips,
  onDismiss,
}: CVOptimizationTipsProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  if (!tips.length) return null;

  const visibleTips = tips.filter((_, i) => !dismissed.has(i));
  if (!visibleTips.length) return null;

  const handleDismiss = (originalIndex: number) => {
    setDismissed((prev) => new Set(prev).add(originalIndex));
    onDismiss?.(originalIndex);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Suggerimenti AI per il tuo CV
      </p>
      <AnimatePresence>
        {tips.map((tip, i) => {
          if (dismissed.has(i)) return null;
          const config = CATEGORY_CONFIG[tip.category];
          const Icon = config.icon;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-3 rounded-lg border-l-[3px] ${PRIORITY_BORDER[tip.priority]} bg-surface p-3`}
            >
              <Icon
                size={16}
                weight="duotone"
                className={
                  tip.priority === "high"
                    ? "text-primary shrink-0 mt-0.5"
                    : tip.priority === "medium"
                    ? "text-warning shrink-0 mt-0.5"
                    : "text-muted-foreground shrink-0 mt-0.5"
                }
              />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-mono uppercase text-muted-foreground">
                  {config.label}
                </span>
                <p className="text-sm text-foreground leading-relaxed mt-0.5">
                  {tip.message}
                </p>
              </div>
              <button
                onClick={() => handleDismiss(i)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
                aria-label="Chiudi suggerimento"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
