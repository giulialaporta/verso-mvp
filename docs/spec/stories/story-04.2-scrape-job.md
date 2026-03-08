# Story 04.2 — Edge Function scrape-job (Implementata)

**Epic:** 04 — AI Engine
**Status:** Completata

---

## Cosa è stato implementato

Edge Function Deno che estrae dati strutturati da un annuncio di lavoro, con supporto URL (con cache) e testo diretto.

### Comportamento

**Modalità URL:**
1. Calcola hash SHA-256 dell'URL
2. Cerca in `job_cache` — se trovato e < 7 giorni → restituisce cache
3. Fetch server-side della pagina HTML
4. Strip tag HTML → testo pulito
5. Invio a AI per estrazione dati strutturati
6. Salva in `job_cache` per future richieste

**Modalità testo:**
- Invio diretto del testo a AI per estrazione

**Output:** company_name, role_title, location, job_type, description, requirements, required_skills, nice_to_have

- Preserva la lingua dell'annuncio nell'output

### Endpoint

`POST /functions/v1/scrape-job`

### Modello AI

Gemini 2.5 Flash (fallback: Gemini 2.0 Flash)

### Differenze dal piano MVP

- Aggiunta cache SHA-256 con scadenza 7 giorni (tabella `job_cache`)
