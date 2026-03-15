import { motion } from "framer-motion";
import { ShieldCheck } from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function getScoreConfig(score: number) {
  if (score >= 86) return { label: "Eccellente", colorClass: "text-primary", strokeClass: "stroke-primary" };
  if (score >= 66) return { label: "Forte", colorClass: "text-success", strokeClass: "stroke-success" };
  if (score >= 41) return { label: "Buono", colorClass: "text-warning", strokeClass: "stroke-warning" };
  return { label: "Da migliorare", colorClass: "text-destructive", strokeClass: "stroke-destructive" };
}

// ─── Large ring (StepCompleta) ─────────────────────────────
export function MatchScoreRing({
  matchScore,
  atsScore,
  isHonest,
}: {
  matchScore: number | null;
  atsScore: number | null;
  isHonest: boolean;
}) {
  if (matchScore == null) return null;

  const config = getScoreConfig(matchScore);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

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
            animate={{ strokeDashoffset: circumference - (circumference * matchScore) / 100 }}
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
            {matchScore}
          </motion.span>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono mt-0.5">
            {config.label}
          </span>
        </div>
      </div>

      {/* ATS secondary */}
      {atsScore != null && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-muted-foreground font-mono"
        >
          ATS {atsScore}%
        </motion.p>
      )}

      {/* Honest Badge */}
      {isHonest && (
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
    </div>
  );
}

// ─── Compact version (cards) ───────────────────────────────
export function MatchScoreCompact({
  matchScore,
  isHonest,
}: {
  matchScore: number | null;
  isHonest: boolean;
}) {
  if (matchScore == null) return null;

  const config = getScoreConfig(matchScore);
  const radius = 12;
  const circumference = 2 * Math.PI * radius;

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
                strokeDashoffset={circumference - (circumference * matchScore) / 100}
              />
            </svg>
            <span className={`font-mono text-sm font-bold ${config.colorClass}`}>
              {matchScore}
            </span>
            {isHonest && (
              <ShieldCheck size={14} className="text-primary" weight="fill" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs font-medium">Match: {matchScore}% — {config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
