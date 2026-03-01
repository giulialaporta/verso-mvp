# Verso

**Assistente AI per candidature di lavoro** — CV tailoring, pre-screening, application tracking.

Verso aiuta chi cerca lavoro a candidarsi meglio: carica il CV, incolla un annuncio, e ottieni un CV adattato con score di compatibilità e analisi gap, scaricabile in PDF.

---

## Stack tecnologico

| Layer | Strumento |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui + Framer Motion |
| Backend / DB | Supabase (Auth, DB, Storage, Edge Functions) |
| AI | AI Gateway → LLM (parsing, tailoring, scoring) |
| PDF Export | @react-pdf/renderer |
| Build | Lovable |

---

## Struttura del repo

```
verso-mvp/
├── src/                    # Codice sorgente (React + TypeScript)
├── supabase/               # Edge Functions + migrations
├── docs/                   # Documentazione di prodotto
│   ├── full/               # PRD + epic v1 completa (8 epic)
│   ├── mvp/                # PRD + epic MVP (5 epic)
│   ├── app-lovable/        # Documentazione dell'app sviluppata (6 epic)
│   ├── brand-system/       # Design system (colori, tipografia, componenti)
│   ├── improvements/       # Specifiche di miglioramento (post-MVP)
│   ├── contesto/           # Contesto progetto, legal pack
│   └── landing-page/       # Prompt landing page
├── CLAUDE.md               # Istruzioni per Claude Code
└── README.md
```

---

## Documentazione

| Documento | Descrizione |
|-----------|-------------|
| [PRD v1](docs/full/verso-prd.md) | Piano prodotto completo |
| [PRD MVP](docs/mvp/epics/verso-prd-mvp.md) | Piano MVP ridotto |
| [PRD App](docs/app-lovable/epics/verso-prd-app.md) | Stato dell'app sviluppata |
| [Brand System](docs/brand-system/brand-system.md) | Design system |

---

## Setup locale

```bash
# Clona il repo
git clone https://github.com/giulialaporta/verso-mvp.git
cd verso-mvp

# Installa dipendenze
npm install

# Avvia dev server
npm run dev
```

Serve un file `.env` con le chiavi Supabase (già incluso nel repo per le chiavi pubbliche).

---

## Flusso principale

```
Signup → Upload CV (PDF) → Parsing AI → Preview + Edit
    ↓
Nuova Candidatura → Job Input → Pre-screening → Tailoring → Score → Export PDF
    ↓
Dashboard Home ←→ Candidature (tracker con stati)
```

---

*Dark mode only.*
