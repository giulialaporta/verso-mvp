

# Nuova slide: Infografica pipeline AI

## Obiettivo

Aggiungere una slide tra "Stack tecnico" e "Dove siamo" che mostri un diagramma logico della pipeline AI di Verso — ogni edge function come nodo di un flusso, con frecce direzionali, colori per tipo (AI, utility, export) e breve descrizione del ruolo nel processo.

## Struttura della slide

**Titolo**: "La pipeline AI — 8 servizi, zero allucinazioni"

**Layout**: Flusso orizzontale/verticale a 3 fasi (Onboarding → Candidatura → Output), con i servizi posizionati nel punto giusto del processo.

```text
ONBOARDING                    CANDIDATURA                         OUTPUT
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ parse-cv │ ──→ │scrape-job│ ──→ │ai-prescreen──→ │ ai-tailor│
│ Claude   │     │ Gemini   │     │ Haiku    │     │ Sonnet   │
│ Estrae   │     │ Estrae   │     │Dealbreaker│    │ Patch CV │
│ CV→JSON  │     │ annuncio │     │skill gap │     │+integrity│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
      │                                                  │
      ▼                                                  ▼
┌──────────┐                                  ┌──────────────────┐
│ compact  │                                  │  cv-review       │
│ headline │                                  │  Haiku           │
│ Gemini   │                                  │  Qualita'+ground │
│ @Company │                                  │  truth check     │
└──────────┘                                  └──────────────────┘
                                                       │
                                                       ▼
                                              ┌──────────────────┐
                                              │ cv-formal-review │
                                              │ Haiku            │
                                              │ Grammatica,      │
                                              │ consistenza      │
                                              └──────────────────┘
                                                       │
                                                       ▼
                                              ┌──────────────────┐
                                              │   render-cv      │
                                              │   (no AI)        │
                                              │   HTML→PDF +     │
                                              │   docx→DOCX      │
                                              └──────────────────┘
```

Ogni nodo sara' una card con:
- Nome funzione (bold, verde)
- Provider AI (badge piccolo: Claude Sonnet / Haiku / Gemini / No AI)
- Descrizione 1 riga di cosa fa

Le frecce connettono i nodi in sequenza. Colori:
- Verde `#6EBF47` per nodi AI
- Grigio `#2A2D35` per nodi utility (render-cv)
- Badge provider con colore distinto

Sotto il diagramma, 2 mini-badge:
- "Integrity check su ogni modifica AI"
- "Fallback automatico Claude ↔ Gemini"

## Implementazione

### `src/pages/Pitch.tsx`

- Creare `SlideAIPipeline` come nuovo componente
- Il flusso e' implementato come layout CSS grid con 3 colonne (fasi) e frecce SVG/CSS tra i nodi
- Le frecce sono semplici linee/triangoli con `border` o un piccolo SVG inline
- I nodi sono card styled come le altre slide (bg `#141518`, bordo verde/grigio)
- Inserire la slide nell'array `SLIDES` tra `Slide4` (Stack) e `Slide5` (Dove siamo)
- Aggiornare `TOTAL` a 7

### 8 servizi nel diagramma

| Funzione | Provider | Ruolo |
|----------|----------|-------|
| parse-cv | Claude Sonnet | PDF → JSON strutturato + estrazione foto |
| compact-headline | Gemini Flash | Compatta ruolo + azienda per card profilo |
| scrape-job | Gemini Flash | Estrae annuncio da URL (titolo, requisiti, azienda) |
| ai-prescreen | Claude Haiku | Dealbreaker, skill gap, domande follow-up |
| ai-tailor | Claude Sonnet | Patch-based tailoring + integrity check |
| cv-review | Claude Haiku | Qualita' e ground truth check vs CV originale |
| cv-formal-review | Claude Haiku | Grammatica, consistenza, lingua uniforme |
| render-cv | No AI | HTML→PDF template + docx→DOCX ATS |

