import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TOTAL = 5;

/* ─── Slide 1: Il problema + Target ─── */
function Slide1() {
  const cards = [
    { icon: "⏱", text: "Ore sprecate ad adattare il CV per ogni ruolo" },
    { icon: "🤖", text: "Il 75% dei CV viene scartato dai filtri ATS prima di essere letto" },
    { icon: "🎯", text: "CV generici non comunicano rilevanza — il recruiter li ignora" },
  ];
  const personas = [
    { name: "Marco, 31", role: "Product Manager", desc: "10-20 candidature al mese. CV solido ma generico." },
    { name: "Giulia, 27", role: "Designer", desc: "Career switcher. Vuole capire i gap e come colmarli." },
    { name: "Roberto, 48", role: "Resp. commerciale", desc: "CV in Word non aggiornato da anni." },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-8">
      <div>
        <h1 className="text-[clamp(28px,4vw,52px)] font-bold leading-tight text-[#F2F3F7]">
          Ogni candidatura merita un CV su misura.
        </h1>
        <p className="mt-3 text-[clamp(14px,1.6vw,20px)] text-[#8B8FA8] max-w-3xl mx-auto">
          Ma adattarlo a mano richiede ore — e spesso non basta comunque.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl w-full">
        {cards.map((c, i) => (
          <div key={i} className="border border-[#6EBF47]/30 rounded-2xl p-6 bg-[#141518] flex flex-col items-center gap-3">
            <span className="text-3xl">{c.icon}</span>
            <p className="text-[#F2F3F7] text-base">{c.text}</p>
          </div>
        ))}
      </div>

      {/* Target personas */}
      <div className="max-w-5xl w-full">
        <p className="text-[#6EBF47] font-semibold text-sm uppercase tracking-widest mb-3">Per chi è Verso</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {personas.map((p, i) => (
            <div key={i} className="border border-[#2A2D35] rounded-xl p-4 bg-[#141518] text-left">
              <p className="text-[#F2F3F7] font-semibold text-sm">{p.name} · <span className="text-[#8B8FA8]">{p.role}</span></p>
              <p className="text-[#8B8FA8] text-sm mt-1">{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[#4E5263] text-sm mt-3 italic">Verso è per qualsiasi professionista. Zero jargon tecnico.</p>
      </div>
    </div>
  );
}

/* ─── Slide 2: La soluzione + differenziazione ─── */
function Slide2() {
  const steps = [
    { n: "1", title: "Carica il tuo CV", desc: "Analisi completa del tuo profilo" },
    { n: "2", title: "Incolla l'annuncio", desc: "AI legge i requisiti e trova il match" },
    { n: "3", title: "Scarica i tuoi CV", desc: "CV Recruiter (PDF) + CV ATS (DOCX) pronti in 30 secondi" },
  ];
  const diffs = [
    { title: "Zero invenzioni", desc: "Mai aggiunge metriche, competenze o esperienze che non esistono. Integrity check su ogni modifica." },
    { title: "Doppio output", desc: "CV Recruiter (PDF design) + CV ATS (DOCX plain) — due formati, una sola candidatura." },
    { title: "Pre-screening onesto", desc: "Ti dice se ci sono dealbreaker PRIMA di adattare il CV. Non ti fa perdere tempo." },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-8">
      <div>
        <h1 className="text-[clamp(28px,4vw,52px)] font-bold leading-tight text-[#F2F3F7]">
          Verso adatta il tuo CV in secondi.
        </h1>
        <p className="mt-3 text-[clamp(14px,1.6vw,20px)] text-[#8B8FA8] max-w-2xl mx-auto">
          Fedele alla tua storia. Ottimizzato per il ruolo.
        </p>
      </div>

      <div className="flex flex-col gap-0 max-w-md w-full text-left">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-[#6EBF47] text-[#0F1117] flex items-center justify-center font-bold text-base shrink-0">
                {s.n}
              </div>
              {i < steps.length - 1 && <div className="w-px h-10 bg-[#6EBF47]/40" />}
            </div>
            <div className="pt-0.5 pb-4">
              <p className="text-[#F2F3F7] font-semibold text-lg">{s.title}</p>
              <p className="text-[#8B8FA8] text-sm mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Differenziatori */}
      <div className="max-w-5xl w-full">
        <p className="text-[#6EBF47] font-semibold text-sm uppercase tracking-widest mb-3">Cosa ci rende diversi</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {diffs.map((d, i) => (
            <div key={i} className="border border-[#6EBF47]/20 rounded-xl p-4 bg-[#141518] text-left">
              <p className="text-[#6EBF47] font-bold text-sm mb-1">{d.title}</p>
              <p className="text-[#8B8FA8] text-sm leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Slide 3: Il prodotto ─── */
function Slide3() {
  const features = [
    "Parsing CV da PDF (con estrazione foto)",
    "Pre-screening AI: dealbreaker, skill gap, domande follow-up",
    "CV tailorato con integrity check (zero invenzioni)",
    "Doppio export: PDF brand Verso + DOCX ATS-compliant",
    "Revisione formale automatica (grammatica, consistenza)",
    "Match score + ATS score + honest score",
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-10">
      <h1 className="text-[clamp(28px,4vw,52px)] font-bold text-[#F2F3F7] text-center">
        Verso in azione
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl w-full items-center">
        <ul className="space-y-4">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-base text-[#F2F3F7]">
              <span className="text-[#6EBF47] text-lg mt-0.5">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
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
      <h1 className="text-[clamp(28px,4vw,52px)] font-bold text-[#F2F3F7]">
        Stack tecnico
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl w-full">
        {cards.map((c, i) => (
          <div key={i} className="border border-[#2A2D35] rounded-xl p-6 bg-[#141518] text-left">
            <p className="text-[#6EBF47] font-bold text-lg mb-2">{c.title}</p>
            <p className="text-[#8B8FA8] text-base leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-[#4E5263] text-sm">
        Built in 4 weeks · 13 edge functions · pipeline AI multi-step
      </p>
    </div>
  );
}

/* ─── Slide 5: Numeri e prossimi passi ─── */
function Slide5() {
  const stats = [
    { value: "4", unit: "settimane", desc: "Da zero a prodotto live" },
    { value: "13", unit: "edge functions", desc: "In produzione" },
    { value: "2", unit: "provider AI", desc: "Claude + Gemini con fallback automatico" },
  ];
  const roadmap = [
    "Friends & Family beta",
    "RAG su centinaia di CV e migliaia di job posting per rafforzare la qualità AI",
    "Validazione 4 rischi Marty Cagan (value, usability, feasibility, viability)",
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-10 text-center">
      <h1 className="text-[clamp(28px,4vw,52px)] font-bold text-[#F2F3F7]">
        Dove siamo
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full">
        {stats.map((s, i) => (
          <div key={i} className="border border-[#2A2D35] rounded-2xl p-8 bg-[#141518] flex flex-col items-center gap-2">
            <p className="text-[clamp(40px,5vw,64px)] font-bold text-[#6EBF47] leading-none">{s.value}</p>
            <p className="text-[#F2F3F7] font-semibold text-base">{s.unit}</p>
            <p className="text-[#8B8FA8] text-sm">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="max-w-md w-full">
        <p className="text-[#6EBF47] font-semibold text-sm uppercase tracking-widest mb-3">Roadmap</p>
        <div className="flex flex-wrap justify-center gap-2">
          {roadmap.map((r, i) => (
            <span key={i} className="border border-[#2A2D35] rounded-full px-4 py-1.5 text-[#8B8FA8] text-sm">
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[clamp(24px,3vw,40px)] font-bold text-[#F2F3F7] tracking-wide">
          Vers<span className="text-[#6EBF47]">o</span>
        </p>
        <p className="text-[#8B8FA8] mt-1 text-base">Candidature più intelligenti. Sempre oneste.</p>
        <p className="text-[#4E5263] text-sm mt-1">verso-cv.lovable.app</p>
      </div>
    </div>
  );
}

const SLIDES = [Slide1, Slide2, Slide3, Slide4, Slide5];

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
