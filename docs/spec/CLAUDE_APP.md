# Verso Spec — Istruzioni per Claude Code

## Progetto

Questa cartella e' la **fonte di verita' dell'app Verso**: documenta cio' che e' stato effettivamente sviluppato. Non e' un piano — e' la fotografia di cio' che esiste e funziona.

---

## Gerarchia dei documenti

| Livello | Cos'e' | Contenuto |
|---------|--------|-----------|
| **PRD** | Cosa e' stato costruito, per chi, e come funziona. | Overview reale delle feature implementate. |
| **Epic** | Un blocco funzionale dell'app. | Specifica completa: behavior, flussi, stati, edge case. Fonte di verita'. |

---

## Stack tecnologico (effettivo)

| Layer | Strumento |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui (Radix) + Framer Motion |
| Icone | @phosphor-icons/react |
| Backend / DB | Supabase (Auth, DB, Storage, Edge Functions) |
| AI | Multi-provider: Anthropic Claude (Sonnet 4 + Haiku 4.5) + Google AI Gemini 2.5 Flash |
| Pagamenti | Stripe (Checkout, Billing Portal, API) |
| PDF Export | @react-pdf/renderer |
| DOCX Export | docx (npm) |
| State | React Context + React Query |

> **Nota:** Il piano MVP prevedeva Claude API. Dopo la migrazione AI (epic-10), le funzioni critiche usano Claude (Anthropic), con Gemini Flash come fallback.

> **Voce:** l'UI usa la prima persona singolare ("Sto analizzando...", "Ho trovato..."), non la terza persona ("Verso sta...").

---

## Struttura della cartella

| File / Cartella | Descrizione |
|-----------------|-------------|
| `CLAUDE_APP.md` | Questo file — istruzioni e indice |
| `verso-prd.md` | PRD principale (v1.1) — visione di prodotto |
| `verso-prd-app.md` | PRD dell'app sviluppata |
| `epics/epic-01-setup.md` | F1 — Auth + Supabase + App Shell + Brand System + CORS + Consent + ConsentGate |
| `epics/epic-02-onboarding.md` | F2 — Onboarding 4 step (upload → parse → preview → salary) |
| `epics/epic-03-nuova-candidatura.md` | F3 — Wizard 6 step (annuncio → verifica → tailoring → revisione → export → completa) |
| `epics/epic-04-ai-engine.md` | F4 — 14 Edge Functions (9 AI + 5 Stripe) |
| `epics/epic-05-export-dashboard.md` | F5 — Export PDF/DOCX + Dashboard Home + CV Edit |
| `epics/epic-06-candidature.md` | F6 — Pagina Candidature + Dettaglio candidatura |
| `epics/epic-07-verso-pro.md` | F7 — Versō Pro (Stripe, limite candidature, upgrade flow, FAQ) |
| `epics/epic-08-impostazioni.md` | F8 — Impostazioni (account, piano, privacy, data portability, elimina account) |
| `epics/epic-09-legal-privacy.md` | F9 — Legal, Privacy, Trasparenza AI, GDPR |
| [`../backlog/`](../backlog/) | Backlog: stories per priorita' (vedi README) |

---

## Flusso reale dell'app

```
Landing page (/) → Signup (con consensi T&C + Privacy) → Login
    ↓
Upload CV (con consenso art. 9) → Parsing AI → Preview + Edit → RAL (opzionale)
    ↓
Nuova Candidatura → URL/Testo annuncio → Pre-screening AI → Tailoring AI (pro gate 403) → CV Review AI → Revisione → Export PDF → Completa
    ↓                                                                                                                              ↓
Dashboard Home (PlanCard + stats + recenti + CV card) ←→ Candidature (lista + dettaglio)                                    Micro-banner Free
    ↓                          ↓
Impostazioni (account, piano, privacy, data export, elimina account)    Pro gate → /upgrade → Stripe Checkout → /app/home?upgrade=success
    ↓
FAQ (/app/faq)
```

---

## Differenze principali rispetto al piano MVP

| Area | Piano MVP | Implementato |
|------|-----------|-------------|
| AI Provider | Claude API | Multi-provider: Anthropic Claude + Google AI Gemini (fallback) |
| Onboarding | 1 step (upload) | 4 step (upload → parse → preview → salary) |
| Wizard candidatura | 3 step | 6 step (pre-screening, cv-review, export, prossimi passi) |
| Edge Functions | 3 (parse-cv, ai-tailor, scrape-job) | 14 (9 AI + 5 Stripe) |
| Tailoring | CV completo sostituito | Patch-based (solo campi modificati) |
| Template PDF | 4 (2 free + 2 pro) | 4 (2 free: Classico, Minimal + 2 Pro: Executive, Moderno) |
| Export DOCX | Previsto | Implementato (Pro-only, libreria `docx`) |
| Candidature page | Non prevista | Implementata (lista + dettaglio + stati + note) |
| Password reset | Non previsto | Implementato |
| Schema CV | Base (7 sezioni) | Esteso (12+ sezioni: CEFR lingue, honors, extra, foto) |
| Job cache | Non previsto | Implementato (SHA-256, 7 giorni) |
| Settings | Non previsto | Implementato (account, piano Pro, privacy GDPR, data export, elimina) |
| Monetizzazione | Non previsto | Implementato (Versō Pro €9.90/mese, Stripe, limite 1 candidatura Free) |
| FAQ | Non prevista | Implementata (/app/faq, 4 sezioni accordion) |
| Legal/Privacy | Non previsto | Implementato (T&C, Privacy, Cookie, consensi, trasparenza AI) |
| CORS | Open (*) | Whitelist dinamica (_shared/cors.ts) |
| CV Edit | Non previsto | Implementato (/app/cv-edit) |

---

## Regole

- Parlare sempre in **italiano**
- Questa documentazione descrive il **codice esistente**, non un piano
- Se l'app cambia → aggiornare questi documenti
- Dark mode only — nessun light mode
