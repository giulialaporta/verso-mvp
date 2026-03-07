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
| **Story** | Un singolo task eseguibile. | Un'azione atomica che Lovable può implementare in un prompt. |

> **Principio chiave:** Il PRD resta leggero — è una mappa, non un manuale. Tutta la specificazione di dettaglio vive negli epic e nelle stories.

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
| AI features | Lovable API Gateway → Google Gemini (2.5 Flash + 2.5 Pro) |

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
| `docs/spec/epics/` | 6 epic implementate (F1–F6) |
| `docs/spec/stories/` | 14 stories implementate |
| `docs/backlog/` | Cose da costruire: epic future + miglioramenti |
| `docs/backlog/stories-p0-sicurezza.md` | P0 — 4 fix sicurezza (bloccanti per produzione) |
| `docs/backlog/verso-improvements-v2.md` | P1 — stories backend AI + moduli shared |
| `docs/backlog/stories-p2-ux.md` | P2 — 7 stories miglioramenti UX |
| `docs/backlog/stories-p3-pulizia.md` | P3 — 7 stories pulizia tecnica |
| `docs/backlog/epic-08-settings.md` | F8 — Impostazioni (gratuita, no freemium) |
| `docs/backlog/CLAUDE_epic-template.md` | Template per scrivere nuovi epic |
| `docs/test/` | Checklist di acceptance criteria per test manuale (6 file, comando `/test`) |
| `docs/landing-page/` | Prompt per la landing page |
| `docs/contesto/` | File di contesto progetto |
| `docs/contesto/legal-pack/` | Documenti legali |

---

## Regole

- Parlare sempre in **italiano**
- Se aggiungiamo una cartella o cambiamo struttura → chiedimi se aggiornare questo CLAUDE.md
- Il PRD deve restare snello: i dettagli vanno negli epic
- Il brand system (`docs/brand-system/brand-system.md`) va sempre consultato per decisioni su UI/UX
- Dark mode only — nessun light mode
