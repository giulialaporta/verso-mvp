import { motion } from "framer-motion";
import { ShieldCheck } from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type VersoScoreInput = {
  match_score: number | null;
  ats_score: number | null;
  honest_score: number | null; // confidence value 0-100
};

export function calcVersoScore(input: VersoScoreInput): number | null {
  const { match_score, ats_score, honest_score } = input;
  if (match_score == null && ats_score == null) return null;
  const m = match_score ?? 0;
  const a = ats_score ?? 0;
  const h = honest_score ?? 100;
  return Math.round(m * 0.4 + a * 0.35 + h * 0.25);
}

function getScoreConfig(score: number) {
  if (score >= 86) return { label: "Eccellente", colorClass: "text-primary", strokeClass: "stroke-primary" };
  if (score >= 66) return { label: "Forte", colorClass: "text-success", strokeClass: "stroke-success" };
  if (score >= 41) return { label: "Buono", colorClass: "text-warning", strokeClass: "stroke-warning" };
  return { label: "Da migliorare", colorClass: "text-destructive", strokeClass: "stroke-destructive" };
}

// ─── Large version (StepCompleta) ──────────────────────────
export function VersoScoreLarge({
  matchScore,
  atsScore,
  honestScore,
}: {
  matchScore: number | null;
  atsScore: number | null;
  honestScore: number | null;
}) {
  const score = calcVersoScore({ match_score: matchScore, ats_score: atsScore, honest_score: honestScore });
  if (score == null) return null;

  const config = getScoreConfig(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const showBadge = (honestScore ?? 0) >= 85;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ring */}
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" className="stroke-border" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r={radius}
            fill="none"
            className={config.strokeClass}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (circumference * score) / 100 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`font-mono text-4xl font-bold ${config.colorClass}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mt-0.5">
            {config.label}
          </span>
        </div>
      </div>

      {/* Honest Badge */}
      {showBadge && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5"
              >
                <ShieldCheck size={16} className="text-primary" weight="fill" />
                <span className="font-mono text-[11px] font-medium text-primary uppercase tracking-wider">
                  CV Onesto
                </span>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-[200px]">
                Il tuo CV è stato adattato senza informazioni inventate o esagerate.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Breakdown */}
      <div className="flex gap-4 text-center">
        {[
          { label: "Match", value: matchScore },
          { label: "ATS", value: atsScore },
          { label: "Onestà", value: honestScore },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-0.5">
            <span className="font-mono text-lg font-bold text-foreground">
              {item.value != null ? `${item.value}%` : "—"}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Compact version (cards) ───────────────────────────────
export function VersoScoreCompact({
  matchScore,
  atsScore,
  honestScore,
}: {
  matchScore: number | null;
  atsScore: number | null;
  honestScore: number | null;
}) {
  const score = calcVersoScore({ match_score: matchScore, ats_score: atsScore, honest_score: honestScore });
  if (score == null) return null;

  const config = getScoreConfig(score);
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const showBadge = (honestScore ?? 0) >= 85;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <svg className="w-7 h-7 -rotate-90" viewBox="0 0 30 30">
              <circle cx="15" cy="15" r={radius} fill="none" className="stroke-border" strokeWidth="3" />
              <circle
                cx="15" cy="15" r={radius}
                fill="none"
                className={config.strokeClass}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (circumference * score) / 100}
              />
            </svg>
            <span className={`font-mono text-sm font-bold ${config.colorClass}`}>
              {score}
            </span>
            {showBadge && (
              <ShieldCheck size={14} className="text-primary" weight="fill" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="space-y-1 text-xs">
            <p className="font-medium">Verso Score: {score} — {config.label}</p>
            <div className="flex gap-3 text-muted-foreground">
              <span>Match {matchScore ?? "—"}%</span>
              <span>ATS {atsScore ?? "—"}%</span>
              <span>Onestà {honestScore ?? "—"}%</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
