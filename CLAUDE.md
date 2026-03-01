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
| `docs/brand-system/` | Design system (colori, tipografia, componenti) |
| `docs/epics/` | PRD + epic completi per v1 (vedi `docs/epics/CLAUDE.md`) |
| `docs/epics/verso-prd.md` | PRD principale (v1.1) |
| `docs/epics/epic-01-onboarding.md` | F1 — Onboarding Wizard |
| `docs/epics/epic-02-nuova-candidatura.md` | F2 — Wizard Nuova Candidatura |
| `docs/epics/epic-03-application-tracker.md` | F3 — Application Tracker (Kanban) |
| `docs/epics/epic-04-dettaglio-candidatura.md` | F4 — Dettaglio Candidatura |
| `docs/epics/epic-05-profilo-master-cv.md` | F5 — Profilo e Master CV |
| `docs/epics/epic-06-ai-engine.md` | F6 — AI Engine (Edge Functions) |
| `docs/epics/epic-07-freemium.md` | F7 — Freemium e Piano |
| `docs/epics/epic-08-settings.md` | F8 — Impostazioni |
| `docs/mvp/` | MVP: PRD ridotto + epic per Lovable (vedi `docs/mvp/CLAUDE_MVP.md`) |
| `docs/mvp/brand-system.md` | Design system (copia per Lovable) |
| `docs/mvp/epics/verso-prd-mvp.md` | PRD dell'MVP |
| `docs/mvp/epics/epic-01-setup.md` | F1 — Auth + Supabase + app shell + brand system |
| `docs/mvp/epics/epic-02-onboarding.md` | F2 — Upload PDF → parsing → profilo pronto |
| `docs/mvp/epics/epic-03-nuova-candidatura.md` | F3 — Wizard nuova candidatura |
| `docs/mvp/epics/epic-04-ai-engine.md` | F4 — Edge functions AI |
| `docs/mvp/epics/epic-05-export.md` | F5 — Export PDF + dashboard home |
| `docs/app-lovable/` | Documentazione di ciò che è stato effettivamente sviluppato su Lovable |
| `docs/app-lovable/CLAUDE_APP.md` | Istruzioni e indice della cartella app-lovable |
| `docs/app-lovable/epics/verso-prd-app.md` | PRD dell'app sviluppata |
| `docs/app-lovable/epics/epic-01-setup.md` | F1 — Auth + Supabase + App Shell + Brand System |
| `docs/app-lovable/epics/epic-02-onboarding.md` | F2 — Onboarding 3 step |
| `docs/app-lovable/epics/epic-03-nuova-candidatura.md` | F3 — Wizard 5 step |
| `docs/app-lovable/epics/epic-04-ai-engine.md` | F4 — 4 Edge Functions AI |
| `docs/app-lovable/epics/epic-05-export-dashboard.md` | F5 — Export PDF + Dashboard |
| `docs/app-lovable/epics/epic-06-candidature.md` | F6 — Pagina Candidature (tracker) |
| `docs/landing-page/` | Prompt per la landing page |
| `docs/contesto/` | File di contesto progetto |
| `docs/contesto/legal-pack/` | Documenti legali |
| `docs/contesto/competitor/` | Analisi competitiva |

---

## Regole

- Parlare sempre in **italiano**
- Se aggiungiamo una cartella o cambiamo struttura → chiedimi se aggiornare questo CLAUDE.md
- Il PRD deve restare snello: i dettagli vanno negli epic
- Il brand system (`docs/brand-system/brand-system.md`) va sempre consultato per decisioni su UI/UX
- Dark mode only — nessun light mode
