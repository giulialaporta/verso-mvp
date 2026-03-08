# Story 04.3 — Edge Function ai-prescreen (Implementata)

**Epic:** 04 — AI Engine
**Status:** Completata

---

## Cosa è stato implementato

Edge Function Deno non prevista nel piano MVP. Confronta il CV del candidato con i requisiti dell'annuncio per una pre-analisi di fattibilità.

### Comportamento

- Input: master_cv, job_posting, salary_expectations (opzionale)
- Classifica requisiti: mandatory / preferred / nice_to_have
- Identifica dealbreaker (gap non colmabili) con severità critical/significant
- Genera domande follow-up per gap colmabili (max 5)
- Valuta fattibilità: low / medium / high
- Se disponibili dati retributivi: genera `salary_analysis` (opzionale)
- Output sempre in italiano

**Output:** dealbreakers, requirements_matrix, follow_up_questions, feasibility, salary_analysis (opzionale)

### Endpoint

`POST /functions/v1/ai-prescreen`

### Modello AI

Gemini 2.5 Pro (fallback: Gemini 2.0 Flash)
