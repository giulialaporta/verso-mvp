# Epic 06 — AI Engine (Edge Functions)

## Obiettivo

Implementare le 3 edge functions Supabase che alimentano l'intelligenza di Verso: ricerca azienda, analisi profilo + scoring, tailoring CV + cover letter. Tutte provider-agnostic (Claude / OpenAI).

---

## Comportamento

### 6a. Company Research

**Endpoint:** `POST /functions/v1/company-research`

**Input:**
```json
{
  "company_name": "...",
  "role_title": "...",
  "role_description": "..."
}
```

**Processo:**
1. Search API (Brave o Serper): query `"[company_name] lavoro cultura valori"`, `"[company_name] news"`, `"[company_name] recensioni dipendenti"`
2. Opzionale: scraping homepage + pagina About dell'azienda
3. AI sintetizza risultati in oggetto insight strutturato

**Output:**
```json
{
  "summary": "...",
  "culture_tags": [],
  "size_signal": "...",
  "recent_news": [{"title": "", "url": "", "date": ""}],
  "why_you_might_like": "...",
  "sources": [{"url": "", "title": ""}],
  "confidence": "high|medium|low"
}
```

Se confidence = "low" → UI mostra: "Non ho trovato molte informazioni su questa azienda."

---

### 6b. Profile Analysis + Scoring

**Endpoint:** `POST /functions/v1/ai-analyze`

**Input:**
```json
{
  "master_cv": { "...CV JSON..." },
  "job_description": "...",
  "company_insights": { "...da 6a..." },
  "provider": "claude | openai"
}
```

**AI prompt:**
```
Sei un esperto career coach. Dati il CV dell'utente e questa job description, fornisci:
1. Skill match: lista skill richieste, indica quali l'utente ha (true/false)
2. Match score composito (0–100), breakdown:
   - profile_fit: quanto l'esperienza matcha il ruolo (0–100)
   - role_alignment: quanto il ruolo è rilevante per il background (0–100)
   - company_context: quanto il profilo è allineato alla cultura aziendale (0–100)
   - Score complessivo = media pesata (profile_fit 50%, role_alignment 30%, company_context 20%)
3. ATS score (0–100): quanto il CV è ottimizzato per superare i filtri ATS
4. ATS checks: 7 controlli specifici (keywords, formato, date, risultati misurabili, cliché, sezioni standard, verbi d'azione) — ognuno con stato pass/warning/fail
5. Seniority match: verifica coerenza livello candidato vs livello richiesto dal ruolo
6. Top 3–5 gap (label plain language)
7. Sezioni CV da enfatizzare o riformulare

REGOLE ATS:
- Inserire le keyword chiave dell'annuncio nel CV in modo naturale (NON keyword stuffing)
- Usare titoli di sezione standard: "Profilo", "Esperienza", "Formazione", "Competenze", "Certificazioni", "Progetti"
- I bullet point devono iniziare con verbi d'azione forti
- Dove il CV originale ha risultati quantitativi, mantenerli in evidenza
- Le competenze tecniche devono comparire sia nella sezione skill che nei bullet point rilevanti

CALIBRAZIONE MERCATO ITALIANO:
- Dare peso alla laurea magistrale e al voto di laurea quando presenti
- Riconoscere iscrizioni ad albi professionali (Ordine degli Ingegneri, Ordine dei Commercialisti, ecc.)
- Valorizzare certificazioni locali (ECDL, certificazioni linguistiche italiane)
- Considerare i requisiti linguistici: in Italia l'inglese è spesso "requisito preferenziale", non bloccante
- Nel summary, usare un tono professionale adatto al mercato italiano

Rispondi solo in JSON strutturato.
```

**Output:**
```json
{
  "match_score": 74,
  "match_score_breakdown": {
    "profile_fit": 80,
    "role_alignment": 70,
    "company_context": 60
  },
  "ats_score": 82,
  "ats_checks": [
    { "check": "keywords", "label": "Parole chiave presenti", "status": "pass", "detail": "7 su 9 keyword trovate" },
    { "check": "format", "label": "Formato leggibile", "status": "pass" },
    { "check": "dates", "label": "Date coerenti", "status": "pass" },
    { "check": "measurable", "label": "Risultati misurabili", "status": "warning", "detail": "Solo 2 bullet su 8 hanno dati quantitativi" },
    { "check": "cliches", "label": "Niente cliché", "status": "pass" },
    { "check": "sections", "label": "Sezioni standard", "status": "pass" },
    { "check": "action_verbs", "label": "Verbi d'azione", "status": "pass" }
  ],
  "seniority_match": {
    "candidate_level": "mid",
    "role_level": "senior",
    "match": false,
    "note": "Il ruolo richiede 8+ anni di esperienza, il candidato ne ha 5. Candidatura ambiziosa ma possibile."
  },
  "skills_present": [{"label": "Gestione del team", "has": true}],
  "skills_missing": [{"label": "Analisi dei dati", "importance": "essenziale"}],
  "tailoring_opportunities": [
    {"section": "experience", "original": "...", "suggested": "...", "reason": "..."}
  ]
}
```

---

### 6c. CV Tailoring + Cover Letter

**Endpoint:** `POST /functions/v1/ai-tailor`

**Input:**
```json
{
  "master_cv": { "...CV JSON..." },
  "job_description": "...",
  "company_insights": { "...da 6a..." },
  "analysis": { "...da 6b..." },
  "template_id": "...",
  "provider": "claude | openai",
  "task": "tailor_cv | write_cover_letter | both"
}
```

**Provider routing:**
```typescript
if (provider === 'claude') {
  // Anthropic SDK, model: claude-opus-4-6
} else {
  // OpenAI SDK, model: gpt-4o
}
```

**Regole di tailoring (system prompt):**
- MAI inventare esperienze, certificazioni o competenze che l'utente non ha
- MAI modificare date, nomi di aziende o titoli di ruolo
- MAI inventare numeri, percentuali o risultati quantitativi non presenti nel CV originale
- PUÒ riordinare bullet point per evidenziare i più rilevanti
- PUÒ riscrivere bullet point usando il linguaggio dell'annuncio (mantenendo veridicità)
- PUÒ sostituire cliché generici ("team player", "problem solver") con evidenze concrete tratte dal CV
- PUÒ suggerire di rimuovere sezioni meno pertinenti
- PUÒ adattare il paragrafo di presentazione ai requisiti del ruolo
- DEVE applicare le regole ATS definite in 6b nel CV adattato
- DEVE restituire JSON strutturato

**Honest Score — verifica di onestà (nel tailoring output):**
Dopo aver generato il CV adattato, confrontare OGNI elemento con l'originale e produrre:
- `honest_score.confidence`: 0-100, quanto il modello è sicuro che nulla sia stato inventato
- `honest_score.experiences_added`: DEVE essere 0
- `honest_score.skills_invented`: DEVE essere 0
- `honest_score.dates_modified`: DEVE essere 0
- `honest_score.bullets_repositioned`: quanti bullet riordinati
- `honest_score.bullets_rewritten`: quanti bullet riscritti con keyword
- `honest_score.sections_removed`: quante sezioni rimosse
- `honest_score.flags`: se confidence < 90, lista delle sezioni da far rivedere all'utente

**Regole cover letter (system prompt):**
- Riferire solo esperienze presenti nel CV dell'utente
- MAI inventare aneddoti, risultati o competenze non documentate
- Menzionare specificamente l'azienda e il ruolo (usa company_insights)
- Tono: professionale ma autentico — non troppo formale, non colloquiale
- Lunghezza: 3–4 paragrafi, max 350 parole
- DEVE restituire testo della lettera + diff rispetto a versione base generica

### Suggerimenti corsi

- Per ogni gap, AI suggerisce 2–3 corsi (Coursera, LinkedIn Learning, Udemy)
- AI fornisce: titolo corso, piattaforma, URL di ricerca stimato, durata
- v1: nessuna API esterna per corsi — AI li genera dal training knowledge

---

## Flussi

1. **Nuova candidatura:** step 2 del wizard chiama 6a + 6b in parallelo, poi 6c al passaggio step 4
2. **Cambio provider:** utente cambia AI provider in settings → prossime chiamate usano nuovo provider
3. **Retry su timeout:** se risposta > 15s → utente clicca retry → nuova chiamata

---

## Stati

| Componente | Stato | Descrizione |
|------------|-------|-------------|
| Edge function | processing | Streaming risposta AI |
| Edge function | complete | JSON strutturato restituito |
| Edge function | timeout | > 15s senza risposta |
| Edge function | error | Errore provider o rete |

---

## Criteri di accettazione

- [ ] Company research restituisce insight strutturati con fonti e confidence level
- [ ] Analisi profilo restituisce score composito con breakdown
- [ ] Analisi restituisce `ats_score` (0-100) + `ats_checks` (7 controlli con pass/warning/fail)
- [ ] Analisi restituisce `seniority_match` con livello candidato, livello ruolo, match e nota
- [ ] Calibrazione italiana applicata (laurea magistrale, albi professionali, certificazioni locali)
- [ ] Skill match identifica gap con label plain language
- [ ] CV tailoring rispetta tutte le regole di onestà
- [ ] CV tailoring restituisce `honest_score` con contatori e confidence
- [ ] Honest Score: `experiences_added` e `skills_invented` SEMPRE = 0
- [ ] Cover letter generata con tono appropriato, max 350 parole
- [ ] Provider routing funzionante (Claude / OpenAI)
- [ ] API key mai esposte al client — solo edge functions
- [ ] Streaming attivo per primi risultati entro 3s
- [ ] Timeout gestito con retry

---

## Stories

| ID | Story | Priorità |
|----|-------|----------|
| 06.1 | Edge function company-research (Search API + AI synthesis) | Should |
| 06.2 | Edge function ai-analyze (scoring + skill match) | Must |
| 06.3 | Edge function ai-analyze — ATS score + 7 ATS checks + seniority match | Must |
| 06.4 | Edge function ai-analyze — Calibrazione mercato italiano nel prompt | Must |
| 06.5 | Edge function ai-tailor — CV tailoring | Must |
| 06.6 | Edge function ai-tailor — Cover letter generation | Must |
| 06.7 | Edge function ai-tailor — Honest Score (verifica onestà nel tailoring output) | Must |
| 06.8 | Provider routing (Claude / OpenAI) | Must |
| 06.9 | Streaming response per risultati progressivi | Should |
| 06.10 | Suggerimenti corsi per skill gap | Should |
| 06.11 | Gestione timeout + retry | Must |
