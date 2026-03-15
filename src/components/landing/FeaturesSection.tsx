import { Check } from "lucide-react";

/* ── Row 1: CV Tailoring ── */
const TailoringMock = () => (
  <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-3">
    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
      <div className="text-muted-foreground">Originale</div>
      <div className="text-primary">Tailorizzato</div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed">
        Gestione di progetti interfunzionali per il lancio di nuove feature.
      </div>
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-foreground leading-relaxed border-l-2 border-primary">
        Coordinamento di 3 team cross-funzionali per il lancio di feature B2B SaaS, con ownership end-to-end dalla discovery al go-to-market.
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed">
        Analisi dei dati per supportare decisioni strategiche.
      </div>
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-foreground leading-relaxed border-l-2 border-primary">
        Data-driven prioritization con framework RICE, presentazione insight a C-level stakeholder.
      </div>
    </div>
  </div>
);

/* ── Row 2: Score & Gap ── */
const ScoreMock = () => (
  <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4">
    <div className="flex items-center justify-between">
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Compatibilità</span>
      <span className="font-mono text-3xl font-bold text-primary">68%</span>
    </div>
    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full animate-score-fill"
        style={{
          "--score-width": "68%",
          background: "linear-gradient(90deg, hsl(0 72% 51%), hsl(42 100% 70%) 50%, hsl(145 62% 55%))",
        } as React.CSSProperties}
      />
    </div>
    <div className="space-y-2">
      {[
        { skill: "SQL", level: "Critico", color: "text-destructive" },
        { skill: "Stakeholder Management", level: "Importante", color: "text-warning" },
      ].map((g) => (
        <div key={g.skill} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
          <span className="font-mono text-xs">{g.skill} — <span className={g.color}>{g.level}</span></span>
          <span className="text-[11px] text-info cursor-pointer hover:underline">Vai al corso →</span>
        </div>
      ))}
    </div>
  </div>
);

/* ── Row 3: Tracker ── */
const TrackerMock = () => {
  const cols = [
    { label: "Inviata", cards: [{ name: "Spotify", score: 72 }, { name: "N26", score: 65 }] },
    { label: "Contattato", cards: [{ name: "Klarna", score: 88 }], glow: true },
    { label: "Follow-up", cards: [{ name: "Stripe", score: 74 }] },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {cols.map((col) => (
          <div key={col.label}>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{col.label}</div>
            <div className="space-y-2">
              {col.cards.map((c) => (
                <div
                  key={c.name}
                  className={`rounded-lg bg-muted/50 p-2.5 text-xs ${col.glow ? "border border-primary/40 shadow-[0_0_12px_-3px_hsl(var(--primary)/0.4)]" : ""}`}
                >
                  <div className="font-semibold mb-1">{c.name}</div>
                  <span className="font-mono text-primary text-[11px]">{c.score}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Feature rows data ── */
const rows = [
  {
    tag: "AI TAILORING",
    tagColor: "text-primary border-primary/30 bg-primary/5",
    title: "Il CV giusto per ogni candidatura.",
    body: "Verso non usa template generici. Riscrive i punti più rilevanti del tuo CV per ogni offerta specifica. Fatti, non finzioni.",
    bullets: ["Rewriting intelligente dei bullet point", "Keyword optimization per gli ATS", "Nessuna bugia, mai"],
    mock: <TailoringMock />,
    reverse: false,
  },
  {
    tag: "SCORE & GAPS",
    tagColor: "text-info border-info/30 bg-info/5",
    title: "Sai esattamente dove migliorare.",
    body: "Per ogni candidatura, Verso calcola il tuo score di compatibilità e ti mostra quali competenze ti mancano — con corsi specifici per colmarle.",
    bullets: ["Score 0–100 per ogni application", "Gap analysis per skill critiche", "Corsi su Coursera, Udemy, LinkedIn Learning"],
    mock: <ScoreMock />,
    reverse: true,
  },
  {
    tag: "PIPELINE",
    tagColor: "text-warning border-warning/30 bg-warning/5",
    title: "Il tuo funnel del recruiting, sotto controllo.",
    body: "Dalla prima candidatura alla risposta finale. Verso tiene traccia di tutto e ti ricorda quando fare follow-up.",
    bullets: ["Kanban drag & drop", "Gestione stati candidatura", "Reminder follow-up intelligenti"],
    mock: <TrackerMock />,
    reverse: false,
  },
];

const FeaturesSection = () => {
  return (
    <section id="funzionalita" className="py-16 sm:py-24 lg:py-32">
      <div className="container space-y-16 sm:space-y-24">
        <div className="text-center max-w-2xl mx-auto">
          <span className="font-mono text-[11px] tracking-widest uppercase text-primary mb-3 sm:mb-4 block">Funzionalità</span>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl leading-tight">
            Tutto quello che serve per{" "}
            <span className="text-gradient">candidarti meglio.</span>
          </h2>
        </div>

        {rows.map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${row.reverse ? "lg:[direction:rtl]" : ""}`}
          >
            <div className={row.reverse ? "lg:[direction:ltr]" : ""}>
              {row.mock}
            </div>
            <div className={`space-y-4 ${row.reverse ? "lg:[direction:ltr]" : ""}`}>
              <span className={`inline-block font-mono text-[11px] uppercase tracking-widest border rounded-full px-3 py-1 ${row.tagColor}`}>
                {row.tag}
              </span>
              <h3 className="font-display font-bold text-xl sm:text-2xl">{row.title}</h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{row.body}</p>
              <ul className="space-y-2">
                {row.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
