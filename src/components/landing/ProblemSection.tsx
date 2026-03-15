import { Ban, AlertTriangle, Eye } from "lucide-react";

const stats = [
  {
    icon: Ban,
    stat: "75%",
    text: "dei CV viene scartato dai filtri automatici prima che qualcuno lo legga",
  },
  {
    icon: AlertTriangle,
    stat: "6 sec",
    text: "è il tempo medio che un selezionatore dedica al tuo CV",
  },
  {
    icon: Eye,
    stat: "1 su 10",
    text: "candidati personalizza davvero il CV per l'annuncio",
  },
];

const ProblemSection = () => {
  return (
    <section className="py-16 sm:py-24 lg:py-32">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl leading-tight mb-4 sm:mb-6">
            Il tuo CV è generico.{" "}
            <span className="text-muted-foreground">I recruiter lo notano.</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Mandare lo stesso CV a ogni annuncio è il modo più veloce per essere ignorati.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {stats.map((item, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-border bg-card p-5 sm:p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 text-primary mb-3 sm:mb-5">
                <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="font-display font-extrabold text-3xl sm:text-4xl text-primary mb-2 sm:mb-3">{item.stat}</div>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
