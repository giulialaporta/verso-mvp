# Story 03.1 — Input Annuncio di Lavoro (Implementata)

**Epic:** 03 — Wizard Nuova Candidatura
**Status:** Completata

---

## Cosa è stato implementato

Step 1 del wizard: l'utente inserisce un annuncio di lavoro tramite URL o testo.

### Modalità URL

1. Campo input per incollare il link
2. Chiama Edge Function `scrape-job`
3. Cache 7 giorni (hash SHA-256 dell'URL)
4. Skeleton durante lo scraping
5. Errore URL → messaggio + suggerimento di incollare il testo

### Modalità testo

1. Textarea per incollare il testo dell'annuncio
2. Invio diretto a AI per estrazione

### Dati estratti

- company_name, role_title, location, job_type
- description, requirements, required_skills, nice_to_have
- Lingua preservata (rileva lingua annuncio)

### Preview card

- Dati estratti mostrati e modificabili inline
- Pulsante per confermare e procedere
