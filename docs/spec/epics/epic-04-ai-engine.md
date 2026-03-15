# Epic 04 — AI Engine (6 Edge Functions) (Implementato)

---

## Cosa è stato costruito

Sei Supabase Edge Functions (Deno) che alimentano Verso. Tutte usano il gateway Lovable API → Google Gemini 2.5 Flash. Tutte condividono il modulo `_shared/cors.ts` per CORS dinamico.

> **Differenza dal piano MVP:** il piano prevedeva 3 funzioni con Claude API. Implementate 6 funzioni (aggiunte `ai-prescreen`, `cv-review`, `delete-account`) con Lovable Gateway → Gemini.

---

## Edge Function 1: `parse-cv`

**Endpoint:** `POST /functions/v1/parse-cv`

**Input:** PDF come base64

**Processo:**
1. Riceve il PDF in base64
2. Input multimodale diretto a Gemini 2.5 Flash (il PDF viene passato al modello, non estratto come testo)
3. Scansione binaria del PDF per marker JPG/PNG → estrazione foto
4. Se presente foto: upload su Supabase Storage → URL firmato

**Output:**
```json
{
  "parsed_data": {
    "personal": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "" },
    "summary": "",
    "experience": [{ "company": "", "role": "", "start": "", "end": "", "current": false, "description": "", "bullets": [] }],
    "education": [{ "institution": "", "degree": "", "field": "", "start": "", "end": "", "grades": "", "honors": "", "programs": "", "publications": "" }],
    "skills": { "technical": [], "soft": [], "tools": [], "languages": [{ "language": "", "level": "" }] },
    "certifications": [{ "name": "", "issuer": "", "year": "" }],
    "projects": [{ "name": "", "description": "" }],
    "extra": []
  },
  "photo_url": "...",
  "raw_text": "..."
}
```

**Regole:**
- Preserva la lingua originale del CV
- Se il summary non è presente, ne sintetizza uno dai dati disponibili
- Lingue con livello CEFR (A1-C2) quando specificato
- Non inventa nulla — se un campo manca, lo lascia vuoto

---

## Edge Function 2: `scrape-job`

**Endpoint:** `POST /functions/v1/scrape-job`

**Input (modalità URL):**
```json
{ "url": "https://..." }
```

**Input (modalità testo):**
```json
{ "text": "..." }
```

**Processo (URL):**
1. Calcola hash SHA-256 dell'URL
2. Cerca in `job_cache` — se trovato e < 7 giorni → restituisce cache
3. Fetch server-side della pagina HTML
4. Strip tag HTML → testo pulito
5. Invio a AI per estrazione dati strutturati
6. Salva in `job_cache` per future richieste

**Processo (testo):**
1. Invio diretto del testo a AI per estrazione

**Output:**
```json
{
  "company_name": "...",
  "role_title": "...",
  "location": "...",
  "job_type": "...",
  "description": "...",
  "requirements": "...",
  "required_skills": [],
  "nice_to_have": []
}
```

**Preservazione lingua:** rileva la lingua dell'annuncio e restituisce i dati nella stessa lingua.

---

## Edge Function 3: `ai-prescreen` (NUOVA — non nel piano MVP)

**Endpoint:** `POST /functions/v1/ai-prescreen`

**Input:**
```json
{
  "master_cv": { "...CV JSON..." },
  "job_posting": { "...dati annuncio..." },
  "salary_expectations": { "min": 35000, "max": 42000 }  // opzionale, da profiles
}
```

**Processo:**
- Confronta CV del candidato con i requisiti dell'annuncio
- Classifica i gap: mandatory / preferred / nice_to_have
- Identifica dealbreaker (gap non colmabili) con severità critical/significant
- Genera domande di follow-up per gap colmabili (max 5)
- Valuta fattibilità complessiva
- Se disponibili dati retributivi (da profilo o annuncio): genera analisi salary

**Output:**
```json
{
  "dealbreakers": [
    { "requirement": "...", "severity": "critical|significant", "reason": "..." }
  ],
  "requirements_matrix": [
    { "requirement": "...", "type": "mandatory|preferred|nice_to_have", "has": true|false }
  ],
  "follow_up_questions": [
    { "question": "...", "context": "...", "related_gap": "..." }
  ],
  "feasibility": "low|medium|high",
  "salary_analysis": {
    "candidate_estimate": { "min": 35000, "max": 42000, "source": "user_profile", "basis": "..." },
    "position_estimate": { "min": 38000, "max": 45000, "source": "job_posting|estimated", "basis": "..." },
    "delta": "positive|neutral|negative",
    "delta_percentage": "+12%",
    "note": "..."
  }
}
```

**Nota:** `salary_analysis` e' opzionale — incluso solo se ci sono dati retributivi dal profilo utente o dall'annuncio.

**Output sempre in italiano.**

---

## Edge Function 4: `ai-tailor`

**Endpoint:** `POST /functions/v1/ai-tailor`

**Input:**
```json
{
  "master_cv": { "...CV JSON..." },
  "job_posting": { "...dati annuncio..." },
  "prescreen_analysis": { "...risultati prescreen..." },
  "skills_missing": []
}
```

**Processo — Tailoring patch-based:**

A differenza del piano MVP (che prevedeva un CV completo in output), `ai-tailor` genera **patch JSON**:
- Ogni patch: `{ "path": "experience[0].bullets[2]", "value": "nuovo testo" }`
- Solo i campi effettivamente modificati
- Le patch vengono applicate al CV master dal frontend

**Due livelli:**

1. **Strutturale:** rimozione esperienze irrilevanti, riordino per rilevanza, condensazione bullet
2. **Contenutistico:** riscrittura summary, bullet con verbi d'azione + metriche, riordino skill

**Output:**
```json
{
  "patches": [
    { "path": "...", "value": "...", "reason": "..." }
  ],
  "structural_changes": [
    { "type": "remove|reorder|condense", "target": "...", "reason": "..." }
  ],
  "match_score": 74,
  "ats_score": 82,
  "ats_checks": [
    { "check": "keywords", "label": "Parole chiave presenti", "status": "pass|warning|fail", "detail": "..." }
  ],
  "honest_score": {
    "confidence": 97,
    "experiences_added": 0,
    "skills_invented": 0,
    "dates_modified": 0,
    "bullets_repositioned": 3,
    "bullets_rewritten": 2,
    "sections_removed": 0,
    "flags": []
  },
  "skills_match": {
    "present": [{ "label": "...", "has": true }],
    "missing": [{ "label": "...", "importance": "..." }]
  }
}
```

**Protezioni (implementate):**
- Mai inventare esperienze, certificazioni o competenze
- Mai modificare date, nomi aziende, titoli di ruolo
- Mai rimuovere tutte le esperienze (minimo 2)
- Max 50% di rimozione esperienze
- Rilevamento lingua: CV output nella lingua dell'annuncio

---

## Edge Function 5: `cv-review` (NUOVA — non nel piano MVP)

**Endpoint:** `POST /functions/v1/cv-review`

**Input:**
```json
{
  "cv": { "...CV tailored JSON..." },
  "detected_language": "it|en",
  "role_title": "..."
}
```

**Processo:**
Agente HR di revisione qualita'. Riceve il CV gia' adattato da `ai-tailor` e lo perfeziona applicando 10 regole:

1. **Uniformita' lingua** — ogni campo di testo nella lingua target, zero mix
2. **Bullet = verbo d'azione + risultato** — riscrittura bullet generici
3. **Capitalizzazione** — prima lettera maiuscola ovunque
4. **Rimozione artefatti** — prefissi, virgolette, markdown, whitespace
5. **Testo orfano** — spostamento o rimozione di testo fuori sezione
6. **Validazione certificazioni** — nome + issuer obbligatori
7. **Deduplicazione skill** — rimozione duplicati e cliche'
8. **Max 4-5 bullet per esperienza** — condensazione
9. **Date uniformi** — formato coerente (Gen 2021 / Jan 2021)
10. **Qualita' summary** — 2-3 frasi, specifico per il ruolo, no filler

**Protezioni:**
- Non inventa esperienze, skill o certificazioni
- Non modifica nomi aziende, date, titoli di studio, voti
- Non rimuove esperienze (quello e' compito di ai-tailor)
- Non cambia struttura/ordine delle sezioni
- Non tocca dati personali ne' foto
- Preserva dati personali originali come safety net (sovrascrive l'output AI)

**Output:**
```json
{
  "reviewed_cv": { "...CV corretto completo..." }
}
```

**Fallback:** se la review fallisce, restituisce il CV originale con `review_failed: true` — non blocca il flusso.

**Integrazione:** chiamata automaticamente in `Nuova.tsx` subito dopo `ai-tailor`. Il risultato viene usato come CV finale per score e export.

---

## Edge Function 6: `delete-account` (NUOVA — GDPR art. 17)

**Endpoint:** `POST /functions/v1/delete-account`

**Input:** nessun body — usa il Bearer token per identificare l'utente.

**Processo (sequenza):**
1. Verifica Bearer token con anon client
2. Crea audit log in `consent_logs` (tipo `account_deletion`)
3. Anonimizza i consent_logs dell'utente (user_id → UUID anonimo)
4. Cancella file da Storage: `cv-uploads/*` e `cv-exports/*`
5. Cancella record DB in ordine FK: tailored_cvs → applications → master_cvs → profiles
6. Cancella utente auth con service role

**Output:** `{ "success": true }` o errore JSON con dettaglio.

**Nota:** i consent_logs vengono anonimizzati (non cancellati) per obblighi legali di audit trail.

---

## Moduli condivisi

| Modulo | Scopo |
|--------|-------|
| `_shared/ai-fetch.ts` | Wrapper per chiamate AI con retry e parsing |
| `_shared/compact-cv.ts` | Compattazione CV per ridurre token |
| `_shared/validate-output.ts` | Validazione output AI |
| `_shared/cors.ts` | CORS dinamico con whitelist origini |

---

## Sicurezza (implementata)

- API key gestita tramite Lovable Gateway (non esposta al client)
- Tutte le chiamate AI passano solo attraverso edge functions
- Edge functions verificano autenticazione (`Authorization: Bearer <token>`)
- **CORS dinamico:** tutte le edge functions usano `getCorsHeaders(req)` da `_shared/cors.ts` con whitelist (verso-cv.lovable.app, localhost:5173, localhost:8080). No più `Access-Control-Allow-Origin: *`

---

## Configurazione

| Parametro | Valore |
|-----------|--------|
| Provider | Lovable API Gateway → Google Gemini |
| Modello (parse-cv, scrape-job, cv-review) | Gemini 2.5 Flash |
| Modello (ai-prescreen, ai-tailor) | Gemini 2.5 Pro |
| Fallback (tutti) | Gemini 2.0 Flash |
| Runtime | Deno (Supabase Edge Functions) |

---

## Differenze dal piano MVP

| Area | Piano | Implementato |
|------|-------|-------------|
| Provider AI | Claude API (Anthropic) | Lovable Gateway → Google Gemini 2.5 Flash |
| Numero funzioni | 3 | 6 (+ ai-prescreen, cv-review, delete-account) |
| parse-cv | Estrazione testo + prompt Claude | Input multimodale diretto (PDF → Gemini) |
| ai-tailor | Output = CV completo | Output = patch JSON (solo modifiche) |
| scrape-job | Senza cache | Con cache SHA-256, 7 giorni |
| ai-prescreen | Non prevista | Implementata (dealbreaker, follow-up, feasibility) |
| Schema output | match/skills/tailored/diff | + structural_changes, patches, skills_match dettagliato |
| Seniority match | In ai-tailor | Gestito in ai-prescreen come dealbreaker |
