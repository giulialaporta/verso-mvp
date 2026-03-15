import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote: "Ho mandato 40 candidature in 2 mesi. Con Verso ne mando 15, ma con risposta nel 60% dei casi.",
    name: "Marco R.",
    role: "Product Manager",
  },
  {
    quote: "Non immaginavo che il mio CV fosse così poco ottimizzato. Il gap analysis mi ha aperto gli occhi.",
    name: "Giulia T.",
    role: "UX Designer",
  },
  {
    quote: "Il tracker mi ha salvato da almeno 3 follow-up mancati. Vale solo per quello.",
    name: "Andrea M.",
    role: "Data Analyst",
  },
];

const SocialProofSection = () => {
  return (
    <section className="py-16 sm:py-24 lg:py-32">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl leading-tight">
            Chi lo usa,{" "}
            <span className="text-gradient">non torna indietro.</span>
          </h2>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-20">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <Quote className="w-5 h-5 text-primary/30 mb-2" />
              <p className="text-sm italic text-muted-foreground leading-relaxed flex-1 mb-4">"{t.quote}"</p>
              <div>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-3 divide-x divide-border text-center py-6 sm:py-8">
            {[
              { num: "2.400+", label: "candidature gestite" },
              { num: "94%", label: "degli utenti ottiene più colloqui" },
              { num: "3 min", label: "per un CV tailorizzato" },
            ].map((s) => (
              <div key={s.num} className="px-2">
                <div className="font-display font-extrabold text-xl sm:text-3xl text-primary mb-1">{s.num}</div>
                <p className="text-[11px] sm:text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
