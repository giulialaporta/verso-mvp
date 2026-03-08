# Story 04.4 — Edge Function ai-tailor (Implementata)

**Epic:** 04 — AI Engine
**Status:** Completata

---

## Cosa è stato implementato

Edge Function Deno che genera patch JSON per adattare il CV master all'annuncio di lavoro.

### Comportamento

- Input: master_cv, job_posting, prescreen_analysis, skills_missing
- Output patch-based: solo i campi modificati, non il CV completo
- Ogni patch: `{ path, value, reason }`
- Due livelli di modifica:
  1. **Strutturale:** rimozione esperienze irrilevanti, riordino, condensazione
  2. **Contenutistico:** riscrittura summary, bullet con verbi d'azione + metriche, riordino skill

**Output:** patches, structural_changes, match_score, ats_score, ats_checks (7 check), honest_score, skills_match

**Protezioni:**
- Mai inventare esperienze, certificazioni, competenze
- Mai modificare date, nomi aziende, titoli di ruolo
- Mai rimuovere tutte le esperienze (minimo 2)
- Max 50% di rimozione esperienze
- Output nella lingua dell'annuncio

### Endpoint

`POST /functions/v1/ai-tailor`

### Modello AI

Gemini 2.5 Pro (fallback: Gemini 2.0 Flash)

### Differenze dal piano MVP

- Piano: output = CV completo
- Implementato: output = patch JSON (solo modifiche)
