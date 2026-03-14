import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyEur, ArrowUp, ArrowDown, Minus, Info } from "@phosphor-icons/react";

type SalaryEstimate = {
  min: number;
  max: number;
  source: "user_profile" | "job_posting" | "estimated" | "benchmark";
  basis: string;
};

export type SalaryAnalysis = {
  candidate_estimate: SalaryEstimate;
  position_estimate: SalaryEstimate;
  delta: "positive" | "neutral" | "negative";
  delta_percentage: string;
  note: string;
};

function formatRAL(min: number, max: number): string {
  const fmtK = (v: number) => {
    if (v >= 1000) return `${Math.round(v / 1000)}K`;
    return String(v);
  };
  return `€${fmtK(min)}–${fmtK(max)}`;
}

const SOURCE_LABELS: Record<string, string> = {
  user_profile: "Da te",
  job_posting: "Dall'annuncio",
  estimated: "Stimata",
};

function SourceBadge({ source }: { source: string }) {
  const label = SOURCE_LABELS[source] || source;
  const isEstimated = source === "estimated";
  return (
    <span className={`font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-full ${
      isEstimated ? "bg-warning/15 text-warning" : "bg-info/15 text-info"
    }`}>
      {label}
    </span>
  );
}

function SalaryBar({ 
  label, estimate, maxValue, delay 
}: { 
  label: string; 
  estimate: SalaryEstimate; 
  maxValue: number; 
  delay: number;
}) {
  const widthPercent = Math.min(100, Math.round((estimate.max / maxValue) * 100));
  const startPercent = Math.round((estimate.min / maxValue) * 100);
  
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
        <span className="text-xs text-muted-foreground shrink-0">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono text-sm font-medium">{formatRAL(estimate.min, estimate.max)}</span>
          <SourceBadge source={estimate.source} />
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden relative">
        <motion.div
          className="absolute h-full rounded-full bg-gradient-to-r from-info/60 to-info"
          initial={{ left: "0%", width: "0%" }}
          animate={{ left: `${startPercent}%`, width: `${widthPercent - startPercent}%` }}
          transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export function SalaryAnalysisCard({ data, delay = 0.5 }: { data: SalaryAnalysis; delay?: number }) {
  const maxValue = Math.max(
    data.candidate_estimate.max, 
    data.position_estimate.max
  ) * 1.15; // Add 15% headroom

  const deltaConfig = {
    positive: { icon: ArrowUp, className: "text-primary", bg: "bg-primary/15" },
    neutral: { icon: Minus, className: "text-warning", bg: "bg-warning/15" },
    negative: { icon: ArrowDown, className: "text-destructive", bg: "bg-destructive/15" },
  };
  const dc = deltaConfig[data.delta];
  const DeltaIcon = dc.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="border-border/50 bg-card/80">
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CurrencyEur size={20} className="text-info" />
              <span className="text-sm font-medium">Analisi Retributiva</span>
            </div>
            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${dc.bg}`}>
              <DeltaIcon size={14} className={dc.className} weight="bold" />
              <span className={`font-mono text-xs font-bold ${dc.className}`}>{data.delta_percentage}</span>
            </div>
          </div>

          <div className="space-y-3">
            <SalaryBar 
              label="La tua aspettativa" 
              estimate={data.candidate_estimate} 
              maxValue={maxValue} 
              delay={delay + 0.1} 
            />
            <SalaryBar 
              label="Range posizione" 
              estimate={data.position_estimate} 
              maxValue={maxValue} 
              delay={delay + 0.2} 
            />
          </div>

          {data.note && (
            <p className="text-sm text-muted-foreground">{data.note}</p>
          )}

          <div className="flex items-start gap-1.5 pt-1 border-t border-border/30">
            <Info size={12} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground">
              I dati retributivi sono indicativi. Il range della posizione potrebbe essere stimato dall'AI quando non esplicitato nell'annuncio.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
