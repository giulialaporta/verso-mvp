# Epic 04 — AI Engine (8 Edge Functions AI + 5 Stripe) (Implementato)

---

## Cosa è stato costruito

Tredici Supabase Edge Functions (Deno): 8 AI + 5 Stripe/account. Le funzioni AI usano il modulo multi-provider `_shared/ai-provider.ts` con routing per task: Anthropic (Claude Sonnet 4 / Haiku 4.5) come primario, Google AI (Gemini 2.5 Flash) come fallback, Lovable Gateway come fallback secondario. Tutte condividono il modulo `_shared/cors.ts` per CORS dinamico.

> **Differenza dal piano MVP:** il piano prevedeva 3 funzioni con Claude API. Implementate 6 funzioni AI (aggiunte `ai-prescreen`, `cv-review`, `delete-account`). Migrazione da Lovable Gateway/Gemini a Anthropic Claude completata (epic-10). Aggiunte 4 funzioni Stripe per epic 07 Versō Pro.

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
2. **Contenutistico:** riscrittura summary, bullet con verbi d'azione, riordino skill per rilevanza al ruolo

**Prompt (SYSTEM_PROMPT_TAILOR):** ristrutturato con gerarchia esplicita — identità → regole inviolabili → esempi few-shot → lingua → come adattare → data integrity → follow-up → output format. Le 5 regole anti-hallucination sono nelle prime 15 righe del prompt.

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
    { "check": "single_column", "label": "Layout singola colonna", "status": "pass|warning|fail", "detail": "...", "weight": 15 },
    { "check": "no_tables", "label": "Nessuna tabella", "status": "...", "weight": 10 },
    { "check": "contacts_in_body", "label": "Contatti nel corpo", "status": "...", "weight": 10 },
    { "check": "standard_sections", "label": "Sezioni standard presenti", "status": "...", "weight": 10 },
    { "check": "no_special_chars", "label": "Caratteri compatibili ATS", "status": "...", "weight": 10 },
    { "check": "date_format", "label": "Date consistenti", "status": "...", "weight": 10 },
    { "check": "acronyms_expanded", "label": "Acronimi espansi", "status": "...", "weight": 5 },
    { "check": "keyword_rate", "label": "Keyword match rate", "status": "...", "weight": 15 },
    { "check": "no_photos", "label": "Nessuna foto nel CV ATS", "status": "...", "weight": 5 },
    { "check": "bullet_quality", "label": "Qualità bullet point", "status": "...", "weight": 5 },
    { "check": "plain_text_order", "label": "Ordine sezioni corretto", "status": "...", "weight": 5 }
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

**Pro gate (server-side):**
- Prima del tailoring, verifica `profiles.is_pro` e `profiles.free_apps_used`
- Se `is_pro = false` AND `free_apps_used >= 1` → risponde 403 `{ error: "UPGRADE_REQUIRED" }`
- Il frontend intercetta il 403 e fa redirect a `/upgrade`

**Parametri AI:**
- `temperature: 0.2` + `maxTokens: 8192` per il tailor (output deterministico, CV lunghi senza troncamento)

**Post-patch (server-side, dopo apply patches):**
1. **Integrity check** (`_shared/integrity-check.ts`): revert claim qualitativi inventati + bullet troppo corti
2. **Bullet validation**: rimozione bullet < 10 char, placeholder ("...", "•"), trailing "..."
3. **Skill deduplication**: case-insensitive, rimozione duplicati e placeholder
4. **Skill ordering**: required_skills → nice_to_have → resto (sort per rilevanza al job posting)
5. **11 check ATS deterministici** (`_shared/ats-checks.ts`): score ponderato 0-100
6. **Quality warning**: se Gemini fallback usato → `result.quality_warning` nel response

**Protezioni (implementate):**
- Mai inventare esperienze, certificazioni o competenze (rule #1 ZERO INVENTIONS nel prompt)
- Mai modificare date, nomi aziende, titoli di ruolo (rule #2 IMMUTABLE FIELDS)
- Mai rimuovere tutte le esperienze (minimo 2) (validate-output.ts)
- Max 50% di rimozione esperienze (validate-output.ts)
- Rilevamento lingua: CV output nella lingua dell'annuncio

---

## Edge Function 5: `cv-review` (NUOVA — non nel piano MVP)

**Endpoint:** `POST /functions/v1/cv-review`

**Input:**
```json
{
  "cv": { "...CV tailored JSON..." },
  "detected_language": "it|en",
  "role_title": "...",
  "original_cv": { "...CV originale (opzionale, ground truth)..." },
  "job_requirements": { "...requisiti annuncio (opzionale)..." }
}
```

**Processo:**
Agente HR di revisione qualita'. Riceve il CV gia' adattato da `ai-tailor` + il CV originale come ground truth. Applica 11 regole:

1. **Uniformita' lingua** — ogni campo di testo nella lingua target, zero mix
2. **Bullet = verbo d'azione** — riscrittura bullet generici (senza aggiungere metriche inventate)
3. **Capitalizzazione** — prima lettera maiuscola ovunque
4. **Rimozione artefatti** — prefissi, virgolette, markdown, whitespace
5. **Testo orfano** — spostamento o rimozione di testo fuori sezione
6. **Validazione certificazioni** — nome + issuer obbligatori
7. **Deduplicazione skill** — rimozione duplicati e cliche' (italiano + inglese)
8. **Max 4-5 bullet per esperienza** — condensazione
9. **Date uniformi** — formato coerente
10. **Qualita' summary** — 2-3 frasi, specifico per il ruolo, no filler
11. **NO INVENTED OUTCOMES** — se il bullet input non ha metriche, non aggiungerne

**GROUND TRUTH RULE:** ogni claim nel CV revisionato deve essere tracciabile al CV originale. Se `original_cv` e' presente, post-review viene eseguito anche un integrity check (`checkIntegrity`).

**Parametri AI:** `temperature: 0.2`, `maxTokens: 8192`

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

## Edge Function 7: `cv-formal-review` (NUOVA)

**Endpoint:** `POST /functions/v1/cv-formal-review`

**Input:**
```json
{
  "cv": { "...CV tailored JSON..." },
  "template_id": "classico"
}
```

**Processo:**
Revisore finale della forma del CV prima del download. Non valuta contenuti ne' riscrive testi — interviene solo sulla forma:

1. **Coerenza formato date** — tutte le date con formato unico (es. "Gen 2020")
2. **Separatore date** — stesso separatore (en dash, hyphen, em dash) ovunque
3. **Maiuscole consistenti** — titoli di ruolo e nomi aziendali uniformi
4. **Lingua unica** — nessun mix involontario italiano/inglese
5. **Bullet point uniformi** — struttura coerente, verbo d'azione, lunghezza adeguata
6. **Punteggiatura e ripetizioni** — consistenza, no ripetizioni ravvicinate
7. **Fluidita' lettura** — ritocchi minimi per suono naturale

**Output (via tool_use `formal_review_result`):**
```json
{
  "fixes": [
    { "section": "experience[0]", "field": "start", "problem": "...", "correction": "..." }
  ],
  "revised_cv": { "...CV corretto..." }
}
```

**Integrazione:** chiamata automaticamente in `StepExport.tsx` al mount dello step. Il CV revisionato viene usato per il PDF/DOCX finale. Se la review fallisce, viene usato il CV originale.

**Nota sicurezza:** usa `Access-Control-Allow-Origin: *` (non CORS dinamico) — da correggere.

---

## Edge Function 8: `compact-headline` (NUOVA)

**Endpoint:** `POST /functions/v1/compact-headline`

**Input:**
```json
{ "role": "Senior Growth Marketing Manager", "company": "Spotify" }
```

**Processo:**
- Abbrevia un job title lungo per fit su card mobile (max ~40 caratteri)
- Usa abbreviazioni standard (AI, ML, HR, CTO, etc.)
- Risultato cachato in `localStorage` per evitare chiamate ripetute

**Provider:** Lovable Gateway → Gemini 2.5 Flash Lite (max 60 token, temperature 0)

**Fallback:** troncamento semplice se AI non disponibile.

**Output:** `{ "headline": "Sr Growth Mktg @Spotify" }`

**Nota sicurezza:** usa `Access-Control-Allow-Origin: *` e nessuna auth — da correggere.

---

## Modulo `integrity-check.ts` (NUOVO)

**Scopo:** Validazione post-patch che confronta il CV tailored con l'originale.

**Controlli:**
- Campi immutabili (date, nomi azienda, ruoli, titoli di studio) — reverte se modificati
- Metriche fabbricate nei bullet point — rileva numeri/percentuali inventati
- Certificazioni inventate — rimuove certificazioni non presenti nell'originale
- Certificazioni rimosse — ripristina certificazioni eliminate

**Output:** `IntegrityResult` con warnings, conteggio revert, e computed honesty score server-side.

**Integrazione:** chiamato da `ai-tailor` dopo l'applicazione delle patch, prima di restituire il risultato al frontend.

---

## Edge Functions Stripe (5 — vedi epic-07 per dettagli)

| Funzione | Scopo |
|----------|-------|
| `create-checkout` | Crea Stripe Checkout Session per upgrade a Pro |
| `check-subscription` | Polling fallback: verifica stato subscription su Stripe, sync con profiles |
| `stripe-webhook` | Webhook real-time: aggiorna stato abbonamento su eventi Stripe |
| `cancel-subscription` | Cancellazione soft (cancel_at_period_end) |
| `customer-portal` | Crea sessione Stripe Billing Portal |

> Dettagli completi in `epic-07-verso-pro.md`.

---

## Moduli condivisi

| Modulo | Scopo |
|--------|-------|
| `_shared/ai-provider.ts` | Multi-provider routing con retry, fallback e cost logging (sostituisce `ai-fetch.ts`) |
| `_shared/compact-cv.ts` | Compattazione CV per ridurre token |
| `_shared/validate-output.ts` | Validazione output AI |
| `_shared/cors.ts` | CORS dinamico con whitelist origini |
| `_shared/integrity-check.ts` | Validazione post-patch: confronta CV tailored vs originale, reverte campi immutabili, rileva metriche fabbricate |

### `ai-provider.ts` — Dettaglio

**Routing per task:**

| Task | Provider primario | Modello | Fallback |
|------|-------------------|---------|----------|
| `parse-cv` | Anthropic | Claude Sonnet 4 | Gemini 2.5 Flash |
| `scrape-job` | Google AI | Gemini 2.5 Flash | Lovable Gateway / Gemini 2.0 Flash |
| `ai-prescreen` | Anthropic | Claude Haiku 4.5 | Gemini 2.5 Flash |
| `ai-tailor` | Anthropic | Claude Sonnet 4 | Gemini 2.5 Flash |
| `ai-tailor-analyze` | Anthropic | Claude Haiku 4.5 | Gemini 2.5 Flash |
| `cv-review` | Anthropic | Claude Haiku 4.5 | Gemini 2.5 Flash |
| `cv-formal-review` | Anthropic | Claude Haiku 4.5 | Gemini 2.5 Flash |

**Behavior:**
1. Chiama il provider primario (fino a 2 tentativi, pausa 2s tra i tentativi)
2. Se fallisce → chiama il fallback
3. Status non-retryable: 401, 402, 403, 429 → propagati direttamente
4. Ogni chiamata logga in `ai_usage_logs`: task, provider, model, tokens, costo, durata, is_fallback

**Providers supportati:**
- **Anthropic** — API diretta (`api.anthropic.com/v1/messages`), supporto tool_use e document (PDF multimodale)
- **Google AI** — API diretta (`generativelanguage.googleapis.com`), supporto function_calling e inline_data
- **Lovable Gateway** — OpenAI-compatible (`ai.gateway.lovable.dev`), fallback secondario

---

## Tabella `ai_usage_logs`

Tabella per monitorare consumo e costi AI:

```sql
CREATE TABLE ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  task text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  tokens_in int NOT NULL,
  tokens_out int NOT NULL,
  cost_usd numeric(6,4),
  duration_ms int,
  is_fallback boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**RLS:** nessun accesso utente (`USING (false)`) — solo service role scrive. Tabella di monitoraggio interno.

**Calcolo costo:** basato su rate per 1M token (Sonnet: $3/$15, Haiku: $1/$5, Gemini Flash: $0.075/$0.3).

---

## Sicurezza (implementata)

- API key Anthropic e Google AI gestite come secret Supabase (non esposte al client)
- Tutte le chiamate AI passano solo attraverso edge functions
- Edge functions verificano autenticazione (`Authorization: Bearer <token>`)
- **CORS dinamico:** tutte le edge functions usano `getCorsHeaders(req)` da `_shared/cors.ts` con whitelist (verso-cv.lovable.app, localhost:5173, localhost:8080). No più `Access-Control-Allow-Origin: *`

---

## Configurazione

| Parametro | Valore |
|-----------|--------|
| Provider primario (parse-cv, ai-tailor) | Anthropic → Claude Sonnet 4 |
| Provider primario (ai-prescreen, ai-tailor-analyze, cv-review, cv-formal-review) | Anthropic → Claude Haiku 4.5 |
| Provider primario (scrape-job) | Google AI → Gemini 2.5 Flash |
| Fallback (tutte le funzioni Anthropic) | Google AI → Gemini 2.5 Flash |
| Fallback (scrape-job) | Lovable Gateway → Gemini 2.0 Flash |
| Runtime | Deno (Supabase Edge Functions) |

---

## Differenze dal piano MVP

| Area | Piano | Implementato |
|------|-------|-------------|
| Provider AI | Claude API (Anthropic) | Multi-provider: Anthropic Claude (primario) + Google AI Gemini (fallback) |
| Numero funzioni | 3 | 13 (8 AI + 5 Stripe: create-checkout, check-subscription, stripe-webhook, cancel-subscription, customer-portal) |
| parse-cv | Estrazione testo + prompt Claude | Input multimodale diretto (PDF → Gemini) |
| ai-tailor | Output = CV completo | Output = patch JSON (solo modifiche) |
| scrape-job | Senza cache | Con cache SHA-256, 7 giorni |
| ai-prescreen | Non prevista | Implementata (dealbreaker, follow-up, feasibility) |
| Schema output | match/skills/tailored/diff | + structural_changes, patches, skills_match dettagliato |
| Seniority match | In ai-tailor | Gestito in ai-prescreen come dealbreaker |
