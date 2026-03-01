# Verso MVP — Istruzioni per Claude Code

## Progetto

Questa cartella contiene l'**MVP di Verso**, una versione ridotta che valida l'ipotesi core: un utente carica il CV, incolla un annuncio, e ottiene un CV adattato con score scaricabile in PDF.

Utilizzo **Claude Code** per scrivere e mantenere le specifiche aggiornate.

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
| Backend / DB | Supabase (auth, database, storage, edge functions) |
| AI | Supabase Edge Function → Claude API |
| PDF Export | react-pdf (@react-pdf/renderer) |
| Animation | Framer Motion |
| Icone | @phosphor-icons/react |

> **Importante:** Non entrare nel dettaglio dell'implementazione tecnica. Lovable decide *come* implementare. Claude deve essere chiaro su *cosa* deve fare la funzionalità e sul suo behavior.

---

## Struttura della cartella

| File / Cartella | Descrizione |
|-----------------|-------------|
| `brand-system.md` | Design system (colori, tipografia, componenti) |
| `epics/verso-prd-mvp.md` | PRD dell'MVP |
| `epics/CLAUDE.md` | Template e regole per epic e stories |
| `epics/epic-01-setup.md` | F1 — Auth + Supabase + app shell + brand system |
| `epics/epic-02-onboarding.md` | F2 — Upload PDF → parsing → profilo pronto |
| `epics/epic-03-nuova-candidatura.md` | F3 — URL/textarea → analisi AI → score → diff view |
| `epics/epic-04-ai-engine.md` | F4 — Edge functions (parse-cv, ai-tailor, scrape-job) |
| `epics/epic-05-export.md` | F5 — Download PDF + dashboard home |

---

## Flusso MVP

```
Signup → Upload CV (PDF) → Incolla annuncio → Score + CV adattato → Scarica PDF
```

---

## Regole

- Parlare sempre in **italiano**
- Se aggiungiamo un epic o cambiamo struttura → chiedimi se aggiornare questo file
- Il PRD deve restare snello: i dettagli vanno negli epic
- Il brand system (`brand-system.md`) va sempre consultato per decisioni su UI/UX
- Dark mode only — nessun light mode
- Eseguire gli epic in ordine (01 → 05), uno per sessione Lovable
- Caricare `brand-system.md` su Lovable insieme al primo epic
