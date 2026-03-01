# Epic 04 — AI Engine (Edge Functions)

---

## Cosa costruire

Tre Supabase Edge Functions che alimentano Verso: una per il parsing del CV, una per l'analisi + tailoring (con ATS awareness), una per lo scraping degli annunci. Tutte usano Claude API.

**Migrazione DB:** questa epic aggiunge colonne alle tabelle create in epic 01.

---

## Migrazione Database

Aggiungere le seguenti colonne alle tabelle esistenti:

```sql
-- Aggiungere a applications
alter table applications add column ats_score int;
alter table applications add column template_id text default 'classico';

-- Aggiungere a tailored_cvs
alter table tailored_cvs add column ats_score int;
alter table tailored_cvs add column ats_checks jsonb;
alter table tailored_cvs add column seniority_match jsonb;
alter table tailored_cvs add column honest_score jsonb;
alter table tailored_cvs add column template_id text default 'classico';
```

> Le colonne sono tutte nullable e con default, quindi non rompono i dati esistenti.

---

## Edge Function 1: `parse-cv`

**Endpoint:** `POST /functions/v1/parse-cv`

Già referenziata dall'epic 02 (onboarding).

**Input:** PDF file (multipart/form-data)

**Processo:**
1. Estrai testo dal PDF (usa una libreria tipo `pdf-parse`)
2. Invia il testo a Claude API con system prompt:

```
Sei un parser di CV esperto. Dato questo testo estratto da un PDF, strutturalo nel seguente JSON schema. Se un campo non è presente, lascialo vuoto. Non inventare nulla. Non aggiungere informazioni che non sono nel testo.

Schema:
{
  "personal": { "name": "", "email": "", "phone": "", "location": "" },
  "summary": "",
  "experience": [{ "company": "", "role": "", "start": "", "end": "", "current": false, "bullets": [] }],
  "education": [{ "institution": "", "degree": "", "field": "", "start": "", "end": "" }],
  "skills": { "technical": [], "soft": [], "languages": [] },
  "certifications": [{ "name": "", "issuer": "", "date": "" }],
  "projects": [{ "name": "", "description": "" }]
}

Rispondi SOLO con il JSON valido, nessun altro testo.
```

3. Restituisci il JSON strutturato + il testo raw

**Output:**
```json
{
  "content": { "...CV JSON strutturato..." },
  "raw_text": "...testo estratto dal PDF..."
}
```

**Configurazione:**
- Claude API key in Supabase secrets (`ANTHROPIC_API_KEY`)
- Model: `claude-sonnet-4-20250514`
- Max tokens: 4096

---

## Edge Function 2: `ai-tailor`

**Endpoint:** `POST /functions/v1/ai-tailor`

Referenziata dall'epic 03 (wizard step 2).

**Input:**
```json
{
  "master_cv": { "...CV JSON..." },
  "job_description": "testo completo dell'annuncio",
  "company_name": "...",
  "role_title": "...",
  "task": "analyze_and_tailor"
}
```

**System prompt:**
```
Sei un esperto career coach. Il tuo compito è analizzare il CV di un candidato rispetto a un annuncio di lavoro, creare una versione adattata del CV e verificare che sia ottimizzato per superare i filtri ATS (Applicant Tracking System).

REGOLE FONDAMENTALI DI ONESTÀ:
- MAI inventare esperienze, certificazioni o competenze che il candidato non ha
- MAI modificare date, nomi di aziende o titoli di ruolo
- MAI inventare numeri, percentuali o risultati quantitativi non presenti nel CV originale
- PUÒ riordinare bullet point per mettere in evidenza quelli più rilevanti per questo ruolo
- PUÒ riscrivere bullet point usando le keyword dell'annuncio, mantenendo la veridicità
- PUÒ adattare il paragrafo summary per allinearlo ai requisiti del ruolo
- PUÒ sostituire cliché generici ("team player", "problem solver") con evidenze concrete tratte dal CV
- DEVE restituire SOLO JSON valido, nessun altro testo

REGOLE ATS:
- Inserire le keyword chiave dell'annuncio nel CV in modo naturale (NON keyword stuffing)
- Usare titoli di sezione standard: "Profilo", "Esperienza", "Formazione", "Competenze", "Certificazioni", "Progetti"
- I bullet point devono iniziare con verbi d'azione forti
- Dove il CV originale ha risultati quantitativi, mantenerli in evidenza
- Le competenze tecniche devono comparire sia nella sezione skill che nei bullet point rilevanti

HONEST SCORE — VERIFICA DI ONESTÀ:
Dopo aver generato il tailored_cv, confronta OGNI elemento del CV adattato con l'originale e produci un report di onestà:
- Conta quante esperienze sono state aggiunte (DEVE essere 0)
- Conta quante competenze sono state inventate (DEVE essere 0)
- Conta quante date sono state modificate (DEVE essere 0)
- Conta quanti bullet point sono stati riposizionati (riordinati per rilevanza)
- Conta quanti bullet point sono stati riscritti (riformulati con keyword, stessa sostanza)
- Conta quante sezioni sono state rimosse (perché irrilevanti per il ruolo)
- Calcola un confidence score 0-100: quanto sei sicuro che NULLA sia stato inventato
- Se confidence < 90, segnala le sezioni specifiche da far rivedere all'utente

CALIBRAZIONE MERCATO ITALIANO:
- Dare peso alla laurea magistrale (equivalente a Master's degree) e al voto di laurea quando presenti
- Riconoscere iscrizioni ad albi professionali (Ordine degli Ingegneri, Ordine dei Commercialisti, ecc.)
- Valorizzare certificazioni locali (ECDL, certificazioni linguistiche italiane)
- Considerare i requisiti linguistici: in Italia l'inglese è spesso "requisito preferenziale", non bloccante
- Nel summary, usare un tono professionale adatto al mercato italiano (né troppo informale né troppo burocratico)

Dato il CV del candidato e l'annuncio di lavoro, restituisci un JSON con questa struttura esatta:

{
  "match_score": <intero 0-100>,
  "ats_score": <intero 0-100>,
  "skills_present": [{ "label": "<nome skill in italiano>", "has": true }],
  "skills_missing": [{ "label": "<nome skill in italiano>", "importance": "essenziale|importante|utile" }],
  "seniority_match": {
    "candidate_level": "<junior|mid|senior|lead|executive>",
    "role_level": "<junior|mid|senior|lead|executive>",
    "match": <boolean>,
    "note": "<spiegazione breve in italiano>"
  },
  "ats_checks": [
    {
      "check": "<id del check>",
      "label": "<descrizione in italiano semplice>",
      "status": "pass|warning|fail",
      "detail": "<spiegazione breve, opzionale>"
    }
  ],
  "tailored_cv": { <CV completo nel formato JSON schema, con le modifiche applicate> },
  "honest_score": {
    "confidence": <intero 0-100>,
    "experiences_added": 0,
    "skills_invented": 0,
    "dates_modified": 0,
    "bullets_repositioned": <intero>,
    "bullets_rewritten": <intero>,
    "sections_removed": <intero>,
    "flags": ["<sezione da rivedere, solo se confidence < 90>"]
  },
  "diff": [
    {
      "section": "<nome sezione: summary|experience|skills>",
      "index": <indice dell'elemento modificato, se applicabile>,
      "original": "<testo originale>",
      "suggested": "<testo adattato>",
      "reason": "<spiegazione breve della modifica in italiano>"
    }
  ]
}

MATCH SCORE — quanto il profilo corrisponde ai requisiti dell'annuncio:
- 0-30: scarsa corrispondenza
- 31-60: corrispondenza parziale
- 61-80: buona corrispondenza
- 81-100: ottima corrispondenza

ATS SCORE — quanto il CV adattato è ottimizzato per superare i filtri ATS:
- 0-50: rischio alto di essere filtrato
- 51-75: passabile ma migliorabile
- 76-100: ottimizzato per ATS

ATS CHECKS da eseguire (restituirli tutti):
1. "keywords" — Le keyword principali dell'annuncio sono presenti nel CV
2. "format" — Il CV usa una struttura lineare senza tabelle o colonne
3. "dates" — Le date sono consistenti e in formato standard
4. "measurable" — I bullet point contengono risultati misurabili dove possibile
5. "cliches" — Il CV evita cliché generici e usa evidenze concrete
6. "sections" — Le sezioni hanno titoli standard riconoscibili da un ATS
7. "action_verbs" — I bullet point iniziano con verbi d'azione

Le skill e le label devono essere espresse in linguaggio semplice, comprensibile da chiunque.
```

**Output esempio:**
```json
{
  "match_score": 74,
  "ats_score": 82,
  "skills_present": [
    { "label": "Gestione del team", "has": true },
    { "label": "Project management", "has": true }
  ],
  "skills_missing": [
    { "label": "Analisi dei dati", "importance": "essenziale" },
    { "label": "SQL", "importance": "importante" }
  ],
  "seniority_match": {
    "candidate_level": "mid",
    "role_level": "senior",
    "match": false,
    "note": "Il ruolo richiede 8+ anni di esperienza, il candidato ne ha 5. Candidatura ambiziosa ma possibile."
  },
  "ats_checks": [
    { "check": "keywords", "label": "Parole chiave presenti", "status": "pass", "detail": "7 su 9 keyword trovate" },
    { "check": "format", "label": "Formato leggibile", "status": "pass" },
    { "check": "dates", "label": "Date coerenti", "status": "pass" },
    { "check": "measurable", "label": "Risultati misurabili", "status": "warning", "detail": "Solo 2 bullet su 8 hanno dati quantitativi" },
    { "check": "cliches", "label": "Niente cliché", "status": "pass" },
    { "check": "sections", "label": "Sezioni standard", "status": "pass" },
    { "check": "action_verbs", "label": "Verbi d'azione", "status": "pass" }
  ],
  "tailored_cv": { "...CV JSON completo adattato..." },
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
  "diff": [
    {
      "section": "summary",
      "original": "Product manager con 5 anni di esperienza...",
      "suggested": "Product manager con 5 anni di esperienza nella gestione di prodotti digitali e team cross-funzionali...",
      "reason": "Aggiunto riferimento a team cross-funzionali, richiesto dall'annuncio"
    }
  ]
}
```

**Retrocompatibilità con epic 03 (già costruita):**
I campi `match_score`, `skills_present`, `skills_missing`, `tailored_cv`, `diff` restano identici nello schema e nel comportamento. I nuovi campi (`ats_score`, `ats_checks`, `seniority_match`, `honest_score`) sono aggiuntivi. Il frontend dello step 2 (epic 03) può ignorarli — verranno letti da epic 05.

**Configurazione:**
- Claude API key in Supabase secrets (`ANTHROPIC_API_KEY`)
- Model: `claude-sonnet-4-20250514`
- Max tokens: 8192
- Timeout: 30s

---

## Edge Function 3: `scrape-job`

**Endpoint:** `POST /functions/v1/scrape-job`

Referenziata dall'epic 03 (wizard step 1, tab URL).

**Input:**
```json
{
  "url": "https://..."
}
```

**Processo:**
1. Fetch server-side del contenuto della pagina (evita CORS)
2. Strip tag HTML, estrai testo leggibile
3. Invia a Claude API:

```
Dato il testo di una pagina web che contiene un annuncio di lavoro, estrai:
- company_name: nome dell'azienda
- role_title: titolo del ruolo
- role_description: il testo completo dell'annuncio pulito (requisiti, responsabilità, qualifiche)

Se non riesci a trovare un campo, lascialo vuoto.
Rispondi SOLO con JSON valido.
```

**Output:**
```json
{
  "company_name": "Acme Corp",
  "role_title": "Product Manager",
  "role_description": "Cerchiamo un Product Manager con esperienza in..."
}
```

**Configurazione:**
- Model: `claude-sonnet-4-20250514`
- Max tokens: 4096
- Timeout: 15s
- Se fetch URL fallisce (timeout, 403, ecc.) → restituisci errore `{ "error": "URL non raggiungibile" }`

---

## Sicurezza

- `ANTHROPIC_API_KEY` salvata in Supabase secrets, MAI esposta al client
- Tutte le chiamate AI passano solo attraverso edge functions
- Edge functions verificano che l'utente sia autenticato (`Authorization: Bearer <token>`)
- Rate limit consigliato: 10 chiamate/minuto per utente

---

## Salvataggio dati

Quando il frontend riceve la risposta di `ai-tailor`, deve salvare:
- `applications.match_score` ← `match_score`
- `applications.ats_score` ← `ats_score`
- `tailored_cvs.content` ← `tailored_cv`
- `tailored_cvs.diff` ← `diff`
- `tailored_cvs.ats_score` ← `ats_score`
- `tailored_cvs.ats_checks` ← `ats_checks`
- `tailored_cvs.seniority_match` ← `seniority_match`
- `tailored_cvs.honest_score` ← `honest_score`

> Il salvataggio effettivo avviene quando l'utente clicca "Salva candidatura" nello step 3 (epic 03). Il `template_id` viene aggiunto in epic 05 al momento dell'export.

---

## Criteri di accettazione

- [ ] Migrazione DB: colonne `ats_score`, `template_id`, `ats_checks`, `seniority_match`, `honest_score` aggiunte
- [ ] Edge function `parse-cv`: riceve PDF, restituisce JSON strutturato
- [ ] Edge function `ai-tailor`: riceve CV + job description, restituisce score + ats_score + ats_checks + seniority_match + tailored CV + diff
- [ ] Edge function `scrape-job`: riceve URL, restituisce company + role + description
- [ ] I campi originali di `ai-tailor` (`match_score`, `skills_*`, `tailored_cv`, `diff`) restano invariati per compatibilità con epic 03
- [ ] API key Claude in Supabase secrets
- [ ] Autenticazione verificata su ogni edge function
- [ ] Errori gestiti con messaggi chiari (timeout, URL non raggiungibile, parsing fallito)
- [ ] Regole di onestà rispettate (nessuna invenzione)
- [ ] ATS checks coprono tutti e 7 i controlli definiti
- [ ] Honest Score restituito con confidence, contatori per categoria e flags
- [ ] Honest Score: experiences_added e skills_invented SEMPRE = 0
- [ ] Calibrazione italiana: laurea magistrale, albi professionali e certificazioni locali riconosciuti nel prompt
