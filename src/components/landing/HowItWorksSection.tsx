import { ClipboardPaste, Zap, Kanban } from "lucide-react";

const steps = [
  {
    icon: ClipboardPaste,
    title: "Incolla l'annuncio",
    description: "URL o testo — Verso legge l'offerta, studia l'azienda, capisce le priorità del recruiter.",
  },
  {
    icon: Zap,
    title: "Il tuo CV si adatta",
    description: "L'AI riscrive i bullet point, riordina le sezioni, ottimizza le keyword. Senza inventare nulla.",
  },
  {
    icon: Kanban,
    title: "Traccia tutto",
    description: "Pipeline automatica per ogni candidatura. Stato aggiornato, follow-up intelligenti.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="come-funziona" className="py-16 sm:py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

      <div className="container relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <span className="font-mono text-[11px] tracking-widest uppercase text-primary mb-3 sm:mb-4 block">Come funziona</span>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl leading-tight">
            Tre passi. Nessuna magia.{" "}
            <span className="text-gradient">Solo intelligenza applicata.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {/* Desktop connector */}
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-40px)] h-px border-t border-dashed border-border" />
              )}

              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
