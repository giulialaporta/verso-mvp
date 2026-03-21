# Verso — Istruzioni per Claude Code

## Progetto

Questa cartella è l'**hub di specificazione** di Verso, un assistente AI per il recruiting funnel (CV tailoring, application tracking, career gap analysis).

Utilizzo **Claude Code** per scrivere e mantenere tutte le specifiche aggiornate.

---

## Gerarchia dei documenti

| Livello | Cos'è | Contenuto |
|---------|-------|-----------|
| **PRD** | Il piano del prodotto: cosa costruire, per chi, e perché. | Snello. Per ogni feature: nome, breve descrizione (1-2 righe), link all'epic. Niente specifiche dettagliate. |
| **Epic** | Una feature o un blocco di lavoro. | Specifica completa: behavior, flussi, stati, edge case, criteri di accettazione. |
| **Story** | Un singolo task eseguibile per Lovable. | Vive solo nel **backlog**. Non nelle spec. |

> **Principio chiave:** Il PRD resta leggero — e' una mappa. Le epic sono la fonte di verita' completa. Le stories esistono solo nel backlog come prompt per Lovable.

---

## Ruolo di Claude

PM esperto nella costruzione di app con **Lovable** — app complete, pronte per la pubblicazione.

---

## Stack tecnologico

| Layer | Strumento |
|-------|-----------|
| UI / Frontend | Lovable (React + TypeScript + Tailwind + shadcn/ui) |
| Backend / DB | Supabase (auth, database, storage) |
| API esterne | Edge Functions (Supabase) |
| AI features | Multi-provider: Anthropic Claude (Sonnet 4 + Haiku 4.5) + Google AI Gemini 2.5 Flash (fallback) |
| Pagamenti | Stripe (Checkout, Billing Portal, API) |

> **Importante:** Non entrare nel dettaglio dell'implementazione tecnica. Lovable decide *come* implementare. Claude deve essere chiaro su *cosa* deve fare la funzionalità e sul suo behavior.

---

## Struttura della cartella

| File / Cartella | Descrizione |
|-----------------|-------------|
| `docs/brand-system/` | Design system (colori, tipografia, componenti) |
| `docs/spec/` | **Fonte di verità** — specifica dell'app attuale |
| `docs/spec/CLAUDE_APP.md` | Istruzioni e indice della cartella spec |
| `docs/spec/verso-prd.md` | PRD principale (v1.1) — visione di prodotto |
| `docs/spec/verso-prd-app.md` | PRD dell'app sviluppata |
| `docs/spec/epics/` | 9 epic implementate (F1–F7, F8–F9) |
| `docs/backlog/` | Cose da costruire — 3 epic + 5 stories (vedi README) |
| `docs/backlog/epic-21-export-engine.md` | **P1** — Motore export: 4/6 stories ✅, da fare: 21.2 (PDFShift) + 21.6 (cleanup) |
| `docs/backlog/stories-p3-pulizia.md` | P0 + P3 — 5 stories (1 sicurezza + 4 pulizia tecnica) |
| `docs/backlog/CLAUDE_epic-template.md` | Template per scrivere nuovi epic |
| `docs/test/` | Checklist di acceptance criteria per test manuale (8 file, comando `/test`) |
| `docs/landing-page/` | Prompt per la landing page |
| `docs/contesto/` | File di contesto progetto |
| `docs/contesto/legal-pack/` | Documenti legali |

---

## Comandi disponibili

| Comando | Quando usarlo |
|---------|---------------|
| `/improve` | Dopo ogni push Lovable — analizza il diff, sincronizza spec/test, pulisce il backlog delle stories toccate |
| `/improve-global` | Ogni 3-4 sessioni Lovable, o quando sospetti che il backlog sia sfasato — scansione completa backlog vs codice reale, senza dipendere dal diff |
| `/test` | Prima di una release o dopo una sessione di fix — verifica manuale dei criteri di accettazione |

> **Differenza chiave:** `/improve` e' veloce ma vede solo i file del diff corrente. `/improve-global` e' piu' lento ma trova storie gia' implementate in sessioni precedenti che `/improve` non avrebbe visto.

---

## Regole

- Parlare sempre in **italiano**
- Se aggiungiamo una cartella o cambiamo struttura → chiedimi se aggiornare questo CLAUDE.md
- Il PRD deve restare snello: i dettagli vanno negli epic
- Il brand system (`docs/brand-system/brand-system.md`) va sempre consultato per decisioni su UI/UX
- Dark mode only — nessun light mode
