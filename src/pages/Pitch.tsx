import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TOTAL = 4;

/* ─── Slide 1: Il problema ─── */
function Slide1() {
  const cards = [
    { icon: "⏱", text: "Ore sprecate ad adattare il CV per ogni ruolo" },
    { icon: "🤖", text: "Il 75% dei CV viene scartato dai filtri ATS prima di essere letto" },
    { icon: "🎯", text: "CV generici non comunicano rilevanza — il recruiter li ignora" },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-12">
      <div>
        <h1 className="text-[clamp(32px,4.5vw,56px)] font-bold leading-tight text-[#F2F3F7]">
          Ogni candidatura merita un CV su misura.
        </h1>
        <p className="mt-4 text-[clamp(16px,1.8vw,22px)] text-[#8B8FA8] max-w-3xl mx-auto">
          Ma adattarlo a mano richiede ore — e spesso non basta comunque.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {cards.map((c, i) => (
          <div
            key={i}
            className="border border-[#6EBF47]/30 rounded-2xl p-8 bg-[#141518] flex flex-col items-center gap-4"
          >
            <span className="text-4xl">{c.icon}</span>
            <p className="text-[#F2F3F7] text-lg">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Slide 2: La soluzione ─── */
function Slide2() {
  const steps = [
    { n: "1", title: "Carica il tuo CV", desc: "Analisi completa del tuo profilo" },
    { n: "2", title: "Incolla l'annuncio", desc: "AI legge i requisiti e trova il match" },
    { n: "3", title: "Scarica i tuoi CV", desc: "CV Recruiter (PDF) + CV ATS (DOCX) pronti in 30 secondi" },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-10">
      <div>
        <h1 className="text-[clamp(32px,4.5vw,56px)] font-bold leading-tight text-[#F2F3F7]">
          Verso adatta il tuo CV in secondi.
        </h1>
        <p className="mt-4 text-[clamp(16px,1.8vw,22px)] text-[#8B8FA8] max-w-2xl mx-auto">
          Fedele alla tua storia. Ottimizzato per il ruolo.
        </p>
      </div>

      <div className="flex flex-col gap-0 max-w-xl w-full text-left">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-5">
            {/* vertical line + dot */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#6EBF47] text-[#0F1117] flex items-center justify-center font-bold text-lg shrink-0">
                {s.n}
              </div>
              {i < steps.length - 1 && <div className="w-px h-12 bg-[#6EBF47]/40" />}
            </div>
            <div className="pt-1 pb-6">
              <p className="text-[#F2F3F7] font-semibold text-xl">{s.title}</p>
              <p className="text-[#8B8FA8] text-base mt-1">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[#6EBF47] text-xl font-medium italic max-w-xl">
        "Il tuo CV, alla sua versione migliore — senza bugie."
      </p>
    </div>
  );
}

/* ─── Slide 3: Il prodotto ─── */
function Slide3() {
  const features = [
    "Parsing CV da PDF",
    "Analisi annuncio (URL o testo)",
    "Pre-screening AI: dealbreaker, skill gap, domande follow-up",
    "CV tailorato con integrity check (zero invenzioni)",
    "Revisione formale automatica",
    "Export: PDF brand Verso + DOCX ATS-ready",
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-10">
      <h1 className="text-[clamp(32px,4.5vw,56px)] font-bold text-[#F2F3F7] text-center">
        Verso in azione
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl w-full items-center">
        {/* left: feature list */}
        <ul className="space-y-4">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-lg text-[#F2F3F7]">
              <span className="text-[#6EBF47] text-xl mt-0.5">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        {/* right: CTA */}
        <div className="flex flex-col items-center gap-6 bg-[#141518] border border-[#2A2D35] rounded-2xl p-10">
          <p className="text-[#8B8FA8] text-lg text-center">
            Demo live — account di test disponibile
          </p>
          <a
            href="/app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#6EBF47] text-[#0F1117] font-bold text-xl px-10 py-4 rounded-full hover:brightness-110 transition-all"
          >
            Apri la demo →
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Slide 4: Stack tecnico ─── */
function Slide4() {
  const cards = [
    { title: "Frontend", desc: "React + TypeScript + Tailwind + shadcn/ui — Lovable" },
    { title: "Backend", desc: "Supabase: auth, database, storage, 8 edge functions Deno" },
    { title: "AI", desc: "Anthropic Claude Sonnet 4 + Haiku 4.5 (primary) · Google Gemini 2.5 Flash (fallback) — pipeline multi-step con integrity check" },
    { title: "Export", desc: "HTML/CSS → PDF via rendering engine · docx library → DOCX ATS-compliant" },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-10 text-center">
      <h1 className="text-[clamp(32px,4.5vw,56px)] font-bold text-[#F2F3F7]">
        Stack tecnico
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl w-full">
        {cards.map((c, i) => (
          <div
            key={i}
            className="border border-[#2A2D35] rounded-xl p-6 bg-[#141518] text-left"
          >
            <p className="text-[#6EBF47] font-bold text-lg mb-2">{c.title}</p>
            <p className="text-[#8B8FA8] text-base leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <p className="text-[clamp(28px,3vw,44px)] font-bold text-[#F2F3F7] tracking-wide">
          Vers<span className="text-[#6EBF47]">o</span>
        </p>
        <p className="text-[#8B8FA8] mt-2 text-lg">Built in 4 weeks</p>
      </div>
    </div>
  );
}

const SLIDES = [Slide1, Slide2, Slide3, Slide4];

export default function Pitch() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const go = useCallback(
    (d: number) => {
      setDir(d);
      setIdx((prev) => Math.max(0, Math.min(TOTAL - 1, prev + d)));
    },
    []
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go]);

  const CurrentSlide = SLIDES[idx];

  return (
    <div className="fixed inset-0 bg-[#0F1117] overflow-hidden select-none">
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={idx}
          custom={dir}
          initial={{ opacity: 0, x: dir > 0 ? 60 : -60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir > 0 ? -60 : 60 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <CurrentSlide />
        </motion.div>
      </AnimatePresence>

      {/* nav controls */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6 z-10">
        <button
          onClick={() => go(-1)}
          disabled={idx === 0}
          className="w-10 h-10 rounded-full bg-[#1E2025] text-[#F2F3F7] flex items-center justify-center disabled:opacity-30 hover:bg-[#2A2D35] transition"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-[#8B8FA8] font-mono text-sm">
          {idx + 1} / {TOTAL}
        </span>
        <button
          onClick={() => go(1)}
          disabled={idx === TOTAL - 1}
          className="w-10 h-10 rounded-full bg-[#1E2025] text-[#F2F3F7] flex items-center justify-center disabled:opacity-30 hover:bg-[#2A2D35] transition"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
