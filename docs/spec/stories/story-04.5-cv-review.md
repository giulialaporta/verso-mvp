# Story 04.5 — Edge Function cv-review (Implementata)

**Epic:** 04 — AI Engine
**Status:** Completata

---

## Cosa è stato implementato

Edge Function Deno non prevista nel piano MVP. Agente HR di revisione qualità che perfeziona il CV già adattato da ai-tailor.

### Comportamento

- Input: cv (tailored JSON), detected_language, role_title
- Applica 10 regole di qualità:
  1. Uniformità lingua
  2. Bullet = verbo d'azione + risultato
  3. Capitalizzazione
  4. Rimozione artefatti (prefissi, virgolette, markdown)
  5. Testo orfano
  6. Validazione certificazioni
  7. Deduplicazione skill
  8. Max 4-5 bullet per esperienza
  9. Date uniformi
  10. Qualità summary

**Protezioni:** non inventa nulla, non modifica date/nomi/titoli, non rimuove esperienze, preserva dati personali originali come safety net.

**Output:** `{ reviewed_cv: {...} }`

**Fallback:** se la review fallisce → restituisce CV originale con `review_failed: true`, non blocca il flusso.

### Endpoint

`POST /functions/v1/cv-review`

### Modello AI

Gemini 2.5 Flash (fallback: Gemini 2.0 Flash)

### Integrazione

Chiamata automaticamente in `Nuova.tsx` dopo `ai-tailor`. Il risultato è il CV finale per score e export.
