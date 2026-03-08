# Epic 04 — AI Engine (4 Edge Functions) (Implementato)

---

## Cosa è stato costruito

Quattro Supabase Edge Functions (Deno) che alimentano Verso. Tutte usano il gateway Lovable API → Google Gemini 2.5 Flash.

> **Differenza dal piano MVP:** il piano prevedeva 3 funzioni con Claude API. Implementate 4 funzioni (aggiunta `ai-prescreen`) con Lovable Gateway → Gemini.

---

## Edge Function 1: `parse-cv`

**Endpoint:** `POST /functions/v1/parse-cv`

**Input:** `{ "filePath": "user_id/filename.pdf" }` — path del file su Supabase Storage (`cv-uploads`)

**Processo:**
1. Scarica il PDF da Supabase Storage tramite `filePath`
2. Input multimodale diretto a Gemini 2.5 Flash (il PDF viene passato al modello come base64)
3. L'AI rileva se il CV contiene una foto persona (`has_photo` + `photo_position`)
4. Se AI conferma foto: scansione binaria per marker JPG/PNG, euristica dimensione (5KB-500KB), upload su Storage → URL firmato
5. Se AI non rileva foto: nessun tentativo di estrazione

**Output:**
```json
{
  "parsed_data": {
    "personal": { "name": "", "email": "", "phone": "", "location": "", "date_of_birth": "", "linkedin": "", "website": "" },
    "summary": "",
    "experience": [{ "company": "", "role": "", "location": "", "start": "", "end": "", "current": false, "description": "", "bullets": [] }],
    "education": [{ "institution": "", "degree": "", "field": "", "start": "", "end": "", "grade": "", "honors": "", "program": "", "publication": "" }],
    "skills": { "technical": [], "soft": [], "tools": [], "languages": [{ "language": "", "level": "", "descriptor": "" }] },
    "certifications": [{ "name": "", "issuer": "", "year": "" }],
    "projects": [{ "name": "", "description": "" }],
    "extra_sections": [{ "title": "", "items": [] }]
  },
  "has_photo": true,
  "photo_url": "...",
  "raw_text": "multimodal"
}
```

**Regole prompt:**
- Preserva la lingua originale del CV (mai tradurre)
- Se il summary non è presente, ne sintetizza uno (2-3 frasi) dai dati disponibili
- Lingue con livello CEFR + descriptor originale (es. `"level": "C1", "descriptor": "ottimo"`)
- Null handling: campi assenti → `null`, non stringa vuota
- Section mapping multilingua (IT, EN, DE, FR, ES)
- Multi-column layout: legge colonna principale + sidebar
- Description vs bullets: separazione netta, mai duplicare
- Foto detection via AI: distingue foto persona da loghi/icone/QR
- Extra sections: qualsiasi sezione non standard viene catturata in `extra_sections`

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
- `applyPatches` con validazione path: bounds check array, verifica nodi intermedi, patch invalide skippate (non crash)

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
    "missing": [{ "label": "...", "importance": "...", "severity": "critical|moderate|minor" }]
  },
  "skipped_patches": ["path/that/failed"]
}
```

**Protezioni (implementate):**
- Mai inventare esperienze, certificazioni o competenze
- Mai modificare date, nomi aziende, titoli di ruolo
- Mai rimuovere tutte le esperienze (minimo 2)
- Max 50% di rimozione esperienze
- Rilevamento lingua: CV output nella lingua dell'annuncio
- Patch path validation: index out of bounds e nodi inesistenti → patch skippata
- Score adjustment basato su severity skill mancanti (critical/moderate/minor)

---

## Moduli shared (implementati)

| Modulo | Scopo |
|--------|-------|
| `_shared/compact-cv.ts` | Compatta CV: rimuove null, placeholder, photo_base64 |
| `_shared/ai-fetch.ts` | Fetch AI con retry (2x, backoff 1s/3s), fallback model, parseAIResponse |
| `_shared/validate-output.ts` | Validazione schema output AI (log warning, non blocca) |

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
| Modello (parse-cv, scrape-job) | Gemini 2.5 Flash |
| Modello (ai-prescreen, ai-tailor) | Gemini 2.5 Pro |
| Fallback (tutti) | Gemini 2.0 Flash |
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
