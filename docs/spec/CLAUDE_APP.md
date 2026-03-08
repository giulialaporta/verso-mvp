# Verso Spec — Istruzioni per Claude Code

## Progetto

Questa cartella e' la **fonte di verita' dell'app Verso**: documenta cio' che e' stato effettivamente sviluppato. Non e' un piano — e' la fotografia di cio' che esiste e funziona.

---

## Gerarchia dei documenti

| Livello | Cos'e' | Contenuto |
|---------|--------|-----------|
| **PRD** | Cosa e' stato costruito, per chi, e come funziona. | Overview reale delle feature implementate. |
| **Epic** | Un blocco funzionale dell'app. | Specifica di cio' che e' stato effettivamente sviluppato: behavior, flussi, stati, edge case. |
| **Story** | Un singolo pezzo di lavoro completato. | Descrizione atomica di cio' che e' stato implementato. |

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

> **Nota:** Il piano MVP prevedeva Claude API, ma l'implementazione usa il gateway Lovable con Google Gemini.

---

## Struttura della cartella

| File / Cartella | Descrizione |
|-----------------|-------------|
| `CLAUDE_APP.md` | Questo file — istruzioni e indice |
| `verso-prd.md` | PRD principale (v1.1) — visione di prodotto |
| `verso-prd-app.md` | PRD dell'app sviluppata |
| `epics/epic-01-setup.md` | F1 — Auth + Supabase + App Shell + Brand System + CORS + Consent |
| `epics/epic-02-onboarding.md` | F2 — Onboarding 4 step (upload → parse → preview → salary) |
| `epics/epic-03-nuova-candidatura.md` | F3 — Wizard 6 step (annuncio → verifica → tailoring → revisione → export → completa) |
| `epics/epic-04-ai-engine.md` | F4 — 6 Edge Functions (parse-cv, scrape-job, ai-prescreen, ai-tailor, cv-review, delete-account) |
| `epics/epic-05-export-dashboard.md` | F5 — Export PDF + Dashboard Home + CV Edit |
| `epics/epic-06-candidature.md` | F6 — Pagina Candidature + Dettaglio candidatura |
| `epics/epic-08-impostazioni.md` | F8 — Impostazioni (account, privacy, data portability, elimina account) |
| `epics/epic-09-legal-privacy.md` | F9 — Legal, Privacy, Trasparenza AI, GDPR |
| `stories/` | 14 stories implementate (dettaglio atomico per epic) |
| [`../backlog/`](../backlog/) | Backlog: stories per priorita' (vedi README) |

---

## Flusso reale dell'app

```
Signup (con consensi T&C + Privacy) → Login
    ↓
Upload CV (con consenso art. 9) → Parsing AI → Preview + Edit → RAL (opzionale)
    ↓
Nuova Candidatura → URL/Testo annuncio → Pre-screening AI → Tailoring AI → CV Review AI → Revisione → Export PDF → Completa
    ↓
Dashboard Home (stats + recenti + CV card) ←→ Candidature (lista + dettaglio)
    ↓
Impostazioni (account, privacy, data export, elimina account)
```

---

## Differenze principali rispetto al piano MVP

| Area | Piano MVP | Implementato |
|------|-----------|-------------|
| AI Provider | Claude API | Lovable Gateway → Google Gemini 2.5 Flash |
| Onboarding | 1 step (upload) | 4 step (upload → parse → preview → salary) |
| Wizard candidatura | 3 step | 6 step (pre-screening, cv-review, export, prossimi passi) |
| Edge Functions | 3 (parse-cv, ai-tailor, scrape-job) | 6 (+ ai-prescreen, cv-review, delete-account) |
| Tailoring | CV completo sostituito | Patch-based (solo campi modificati) |
| Template PDF | 4 (2 free + 2 pro) | 2 (Classico + Minimal, entrambi free) |
| Export DOCX | Previsto | Non implementato |
| Candidature page | Non prevista | Implementata (lista + dettaglio + stati + note) |
| Password reset | Non previsto | Implementato |
| Schema CV | Base (7 sezioni) | Esteso (12+ sezioni: CEFR lingue, honors, extra, foto) |
| Job cache | Non previsto | Implementato (SHA-256, 7 giorni) |
| Settings | Non previsto | Implementato (account, privacy GDPR, data export, elimina) |
| Legal/Privacy | Non previsto | Implementato (T&C, Privacy, Cookie, consensi, trasparenza AI) |
| CORS | Open (*) | Whitelist dinamica (_shared/cors.ts) |
| CV Edit | Non previsto | Implementato (/app/cv-edit) |

---

## Regole

- Parlare sempre in **italiano**
- Questa documentazione descrive il **codice esistente**, non un piano
- Se l'app cambia → aggiornare questi documenti
- Dark mode only — nessun light mode
