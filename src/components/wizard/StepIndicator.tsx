import { CheckCircle } from "@phosphor-icons/react";

export function StepIndicator({ current }: { current: number }) {
  const steps = ["Annuncio", "Verifica", "Analisi", "CV Adattato", "Download", "Fatto"];
  return (
    <div className="mb-8">
      {/* Mobile: compact indicator */}
      <div className="flex sm:hidden items-center justify-center gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">{current + 1} di {steps.length}</span>
        <span className="text-sm font-medium text-foreground">{steps[current]}</span>
        <div className="flex gap-1 ml-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-colors ${
                i < current ? "w-3 bg-primary" : i === current ? "w-5 bg-primary/60" : "w-3 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: full indicator */}
      <div className="hidden sm:flex items-center justify-center gap-1 sm:gap-2" role="list" aria-label="Passaggi del wizard">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-1 sm:gap-1.5" role="listitem">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] font-medium transition-colors ${
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
    </div>
  );
}
