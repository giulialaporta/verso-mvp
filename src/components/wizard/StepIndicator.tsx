import { CheckCircle } from "@phosphor-icons/react";

export function StepIndicator({ current }: { current: number }) {
  const steps = ["Annuncio", "Analisi", "Tailoring", "Revisione", "Export", "Completa"];
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8" role="list" aria-label="Passaggi del wizard">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1 sm:gap-1.5" role="listitem">
          <div
            className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full font-mono text-[10px] sm:text-xs font-medium transition-colors ${
              i < current
                ? "bg-primary text-primary-foreground"
                : i === current
                  ? "bg-primary/20 text-primary ring-2 ring-primary"
                  : "bg-muted text-muted-foreground"
            }`}
            aria-label={`Step ${i + 1}: ${label}`}
            aria-current={i === current ? "step" : undefined}
          >
            {i < current ? <CheckCircle size={12} weight="fill" /> : i + 1}
          </div>
          <span className={`hidden lg:inline text-[11px] ${i === current ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {label}
          </span>
          {i < steps.length - 1 && <div className="w-3 sm:w-6 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}
