# Epic 04 — AI Engine (4 Edge Functions) (Implementato)

---

## Cosa è stato costruito

Quattro Supabase Edge Functions (Deno) che alimentano Verso. Tutte usano il gateway Lovable API → Google Gemini 2.5 Flash.

> **Differenza dal piano MVP:** il piano prevedeva 3 funzioni con Claude API. Implementate 4 funzioni (aggiunta `ai-prescreen`) con Lovable Gateway → Gemini.

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
  "job_posting": { "...dati annuncio..." }
}
```

**Processo:**
- Confronta CV del candidato con i requisiti dell'annuncio
- Classifica i gap: mandatory / preferred / nice_to_have
- Identifica dealbreaker (gap non colmabili) con severità critical/significant
- Genera domande di follow-up per gap colmabili (max 5)
- Valuta fattibilità complessiva

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
  "feasibility": "low|medium|high"
}
```

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

## Sicurezza (implementata)

- API key gestita tramite Lovable Gateway (non esposta al client)
- Tutte le chiamate AI passano solo attraverso edge functions
- Edge functions verificano autenticazione (`Authorization: Bearer <token>`)

---

## Configurazione

| Parametro | Valore |
|-----------|--------|
| Provider | Lovable API Gateway → Google Gemini |
| Modello | Gemini 2.5 Flash |
| Runtime | Deno (Supabase Edge Functions) |

---

## Differenze dal piano MVP

| Area | Piano | Implementato |
|------|-------|-------------|
| Provider AI | Claude API (Anthropic) | Lovable Gateway → Google Gemini 2.5 Flash |
| Numero funzioni | 3 | 4 (+ ai-prescreen) |
| parse-cv | Estrazione testo + prompt Claude | Input multimodale diretto (PDF → Gemini) |
| ai-tailor | Output = CV completo | Output = patch JSON (solo modifiche) |
| scrape-job | Senza cache | Con cache SHA-256, 7 giorni |
| ai-prescreen | Non prevista | Implementata (dealbreaker, follow-up, feasibility) |
| Schema output | match/skills/tailored/diff | + structural_changes, patches, skills_match dettagliato |
| Seniority match | In ai-tailor | Gestito in ai-prescreen come dealbreaker |
