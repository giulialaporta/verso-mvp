import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="prezzi" className="py-16 sm:py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

      <div className="container relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <span className="font-mono text-[11px] tracking-widest uppercase text-primary mb-3 sm:mb-4 block">Lancio</span>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl leading-tight mb-6">
            Accesso completo.{" "}
            <span className="text-gradient">Gratis.</span>
          </h2>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl border border-primary/40 bg-card p-5 sm:p-8 flex flex-col relative shadow-[0_0_40px_-10px_hsl(var(--primary)/0.15)] animate-pulse-glow">
            <span className="absolute top-4 right-4 font-mono text-[10px] uppercase tracking-widest bg-primary text-primary-foreground px-2.5 py-1 rounded-full font-bold">
              EARLY ACCESS
            </span>

            <h3 className="font-display font-bold text-xl sm:text-2xl mb-2">Tutto incluso</h3>
            <p className="text-muted-foreground text-sm mb-6 sm:mb-8">
              Verso è in fase di lancio — tutte le funzionalità Pro sono gratuite per i primi utenti.
            </p>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Candidature illimitate",
                "Tutti i template (Classico, Minimal, Executive, Moderno)",
                "Export DOCX",
                "Pre-screening di fattibilità",
                "Score compatibilità + ATS",
                "Analisi stipendio",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              className="w-full font-bold rounded-full h-12 glow-accent hover:glow-accent-hover transition-shadow active:scale-[0.98]"
              onClick={() => navigate("/login")}
            >
              Inizia ora
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <p className="text-center text-[11px] text-muted-foreground mt-3">
              Setup in 2 minuti · Accesso completo incluso
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
