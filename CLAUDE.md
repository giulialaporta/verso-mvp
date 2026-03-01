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
| AI features | AI gateway provider-agnostic (Claude API / OpenAI) |

> **Importante:** Non entrare nel dettaglio dell'implementazione tecnica. Lovable decide *come* implementare. Claude deve essere chiaro su *cosa* deve fare la funzionalità e sul suo behavior.

---

## Struttura della cartella

| File / Cartella | Descrizione |
|-----------------|-------------|
| `brand-system/` | Design system (colori, tipografia, componenti) |
| `epics/` | PRD + epic completi per v1 (vedi `epics/CLAUDE.md`) |
| `epics/verso-prd.md` | PRD principale (v1.1) |
| `epics/epic-01-onboarding.md` | F1 — Onboarding Wizard |
| `epics/epic-02-nuova-candidatura.md` | F2 — Wizard Nuova Candidatura |
| `epics/epic-03-application-tracker.md` | F3 — Application Tracker (Kanban) |
| `epics/epic-04-dettaglio-candidatura.md` | F4 — Dettaglio Candidatura |
| `epics/epic-05-profilo-master-cv.md` | F5 — Profilo e Master CV |
| `epics/epic-06-ai-engine.md` | F6 — AI Engine (Edge Functions) |
| `epics/epic-07-freemium.md` | F7 — Freemium e Piano |
| `epics/epic-08-settings.md` | F8 — Impostazioni |
| `mvp/` | MVP: PRD ridotto + epic per Lovable (vedi `mvp/CLAUDE_MVP.md`) |
| `mvp/brand-system.md` | Design system (copia per Lovable) |
| `mvp/epics/verso-prd-mvp.md` | PRD dell'MVP |
| `mvp/epics/epic-01-setup.md` | F1 — Auth + Supabase + app shell + brand system |
| `mvp/epics/epic-02-onboarding.md` | F2 — Upload PDF → parsing → profilo pronto |
| `mvp/epics/epic-03-nuova-candidatura.md` | F3 — Wizard nuova candidatura |
| `mvp/epics/epic-04-ai-engine.md` | F4 — Edge functions AI |
| `mvp/epics/epic-05-export.md` | F5 — Export PDF + dashboard home |
| `landing-page/` | Prompt per la landing page |
| `legal-pack/` | Documenti legali |
| `contesto/` | File di contesto progetto |

---

## Regole

- Parlare sempre in **italiano**
- Se aggiungiamo una cartella o cambiamo struttura → chiedimi se aggiornare questo CLAUDE.md
- Il PRD deve restare snello: i dettagli vanno negli epic
- Il brand system (`brand-system/brand-system.md`) va sempre consultato per decisioni su UI/UX
- Dark mode only — nessun light mode
