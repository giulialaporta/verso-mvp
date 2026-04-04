import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LandingHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] sm:min-h-screen flex items-center overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(168,255,120,0.07) 0%, transparent 70%)",
        }}
      />
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container relative z-10 py-12 sm:py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <div className="space-y-5 sm:space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-mono text-primary animate-fade-up">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              ✦ AI-POWERED JOB HUNTING
            </div>

            <h1 className="font-display font-extrabold text-[40px] sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.08] tracking-tight animate-fade-up delay-100">
              Il tuo CV,{"\n"}alla sua{" "}
              <span className="text-gradient">versione migliore.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed animate-fade-up delay-200">
              Verso analizza ogni offerta di lavoro, adatta il tuo CV in modo intelligente e tiene traccia di ogni candidatura. Senza bugie. Solo la versione migliore di te.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-up delay-300">
              <Button
                size="lg"
                className="font-bold text-sm sm:text-base px-6 sm:px-8 h-12 sm:h-13 rounded-full glow-accent hover:glow-accent-hover transition-shadow active:scale-[0.98]"
                onClick={() => navigate("/login?plan=free")}
              >
                Inizia gratis
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="font-semibold text-sm sm:text-base px-6 sm:px-8 h-12 sm:h-13 rounded-full border-border hover:bg-muted"
                onClick={() => document.getElementById("come-funziona")?.scrollIntoView({ behavior: "smooth" })}
              >
                Guarda come funziona ↓
              </Button>
            </div>

            <p className="text-[11px] sm:text-xs text-muted-foreground animate-fade-up delay-400">
              Accesso completo · Setup in 2 minuti
            </p>
          </div>

          {/* Right — Mock card */}
          <div className="relative animate-fade-up delay-400">
            <div className="animate-float">
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(168,255,120,0.1)]">
                {/* Score header */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Compatibilità</span>
                  <span className="font-mono text-3xl sm:text-4xl font-bold text-primary">78%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full animate-score-fill"
                    style={{
                      "--score-width": "78%",
                      background: "linear-gradient(90deg, hsl(0 72% 51%), hsl(42 100% 70%) 50%, hsl(145 62% 55%))",
                    } as React.CSSProperties}
                  />
                </div>

                {/* Skill pills */}
                <div className="space-y-2.5">
                  {[
                    { skill: "Product Strategy", match: true },
                    { skill: "Stakeholder Mgmt", match: true },
                    { skill: "SQL", match: false },
                  ].map((item) => (
                    <div key={item.skill} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                      <span className="font-mono text-xs">{item.skill}</span>
                      <span className={`text-xs font-semibold ${item.match ? "text-primary" : "text-warning"}`}>
                        {item.match ? "✓ Match" : "⚠ Gap"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA mock */}
                <div className="pt-2">
                  <div className="w-full h-11 rounded-xl bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                    Genera CV ottimizzato →
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
