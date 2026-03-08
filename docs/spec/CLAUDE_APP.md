# Verso Spec — Istruzioni per Claude Code

## Progetto

Questa cartella è la **fonte di verità dell'app Verso**: documenta ciò che è stato effettivamente sviluppato. Non è un piano — è la fotografia di ciò che esiste e funziona.

---

## Gerarchia dei documenti

| Livello | Cos'è | Contenuto |
|---------|-------|-----------|
| **PRD** | Cosa è stato costruito, per chi, e come funziona. | Overview reale delle feature implementate. |
| **Epic** | Un blocco funzionale dell'app. | Specifica di ciò che è stato effettivamente sviluppato: behavior, flussi, stati, edge case. |
| **Story** | Un singolo pezzo di lavoro completato. | Descrizione atomica di ciò che è stato implementato. |

---

## Stack tecnologico (effettivo)

| Layer | Strumento |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui (Radix) + Framer Motion |
| Icone | @phosphor-icons/react |
| Backend / DB | Supabase (Auth, DB, Storage, Edge Functions) |
| AI | Lovable API Gateway → Google Gemini 2.5 Flash |
| PDF Export | @react-pdf/renderer |
| State | React Context + React Query |
| Forms | React Hook Form + Zod |

> **Nota:** Il piano MVP prevedeva Claude API, ma l'implementazione usa il gateway Lovable con Google Gemini.

---

## Struttura della cartella

| File / Cartella | Descrizione |
|-----------------|-------------|
| `CLAUDE_APP.md` | Questo file — istruzioni e indice |
| `verso-prd.md` | PRD principale (v1.1) — visione di prodotto |
| `verso-prd-app.md` | PRD dell'app sviluppata |
| `epics/epic-01-setup.md` | F1 — Auth + Supabase + App Shell + Brand System |
| `epics/epic-02-onboarding.md` | F2 — Onboarding 3 step (upload → parse → preview) |
| `epics/epic-03-nuova-candidatura.md` | F3 — Wizard 6 step (job → prescreen → tailor → revisione → export → completa) |
| `epics/epic-04-ai-engine.md` | F4 — 5 Edge Functions (parse-cv, scrape-job, ai-prescreen, ai-tailor, cv-review) |
| `epics/epic-05-export-dashboard.md` | F5 — Export PDF + Dashboard Home |
| `epics/epic-06-candidature.md` | F6 — Pagina Candidature (tracker) |
| `stories/` | 14 stories implementate (dettaglio atomico per epic) |
| [`../backlog/`](../backlog/) | Backlog: epic future + stories per priorita' (vedi README) |

---

## Flusso reale dell'app

```
Signup/Login → Upload CV (PDF) → Parsing AI → Preview + Edit inline
    ↓
Nuova Candidatura → URL/Testo annuncio → Pre-screening AI → Tailoring AI → CV Review AI → Score + Analisi → Export PDF
    ↓
Dashboard Home (stats + recenti) ←→ Candidature (lista con stati + note)
```

---

## Differenze principali rispetto al piano MVP

| Area | Piano MVP | Implementato |
|------|-----------|-------------|
| AI Provider | Claude API | Lovable Gateway → Google Gemini 2.5 Flash |
| Onboarding | 1 step (upload) | 3 step (upload → parse → preview con edit inline) |
| Wizard candidatura | 3 step | 6 step (pre-screening, cv-review, export, prossimi passi) |
| Edge Functions | 3 (parse-cv, ai-tailor, scrape-job) | 5 (+ ai-prescreen, cv-review) |
| Tailoring | CV completo sostituito | Patch-based (solo campi modificati) |
| Template PDF | 4 (2 free + 2 pro) | 2 (Classico + Minimal, entrambi free) |
| Export DOCX | Previsto | Non implementato |
| Candidature page | Non prevista | Implementata (lista + stati + note + bozze) |
| Password reset | Non previsto | Implementato |
| Schema CV | Base (7 sezioni) | Esteso (12+ sezioni: CEFR lingue, honors, extra, foto) |
| Job cache | Non previsto | Implementato (SHA-256, 7 giorni) |
| Settings | Non previsto | Non implementato |

---

## Regole

- Parlare sempre in **italiano**
- Questa documentazione descrive il **codice esistente**, non un piano
- Se l'app cambia → aggiornare questi documenti
- Dark mode only — nessun light mode
