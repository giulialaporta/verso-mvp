# Story 04.4 — Edge Function `ai-tailor`: analisi + scoring + ATS check

> Prompt per Lovable — Epic 04, Story 4 di 7
> Questa è la function più importante di Verso. Fa analisi del profilo, scoring, ATS check e tailoring del CV in una sola chiamata.

---

## Cosa fare

Creare la Supabase Edge Function `ai-tailor`. Riceve il CV master dell'utente e la job description, e restituisce: match score, ATS score, skill match, seniority match, 7 check ATS, il CV adattato, l'honest score e il diff delle modifiche.

Questa function è già referenziata dall'epic 03 (wizard step 2): il frontend la chiama dopo che l'utente ha confermato l'annuncio nello step 1.

---

## Endpoint

`POST /functions/v1/ai-tailor`

---

## Input

```json
{
  "master_cv": {
    "personal": { "name": "Marco Rossi", "email": "...", "phone": "...", "location": "Milano" },
    "summary": "Product manager con 5 anni di esperienza...",
    "experience": [...],
    "education": [...],
    "skills": { "technical": [...], "soft": [...], "languages": [...] },
    "certifications": [...],
    "projects": [...]
  },
  "job_description": "Cerchiamo un Senior Product Manager con esperienza in...",
  "company_name": "Acme Corp",
  "role_title": "Senior Product Manager",
  "task": "analyze_and_tailor"
}
```

Il `master_cv` è il JSON che sta in `master_cvs.content` (creato dall'onboarding, epic 02).
La `job_description` è il testo estratto nello step 1 del wizard (epic 03).

---

## Configurazione

- Model: `claude-sonnet-4-20250514`
- Max tokens: 8192
- Timeout: 30s
- API key: `Deno.env.get('ANTHROPIC_API_KEY')`

---

## System prompt

Questo è il prompt completo da inviare a Claude come `system` message. Copiarlo esattamente:

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

---

## User message

Componi il messaggio utente così:

```
CV del candidato:
{JSON.stringify(master_cv)}

Annuncio di lavoro:
Azienda: {company_name}
Ruolo: {role_title}
Descrizione: {job_description}
```

---

## Output atteso (success — 200)

La function restituisce direttamente il JSON generato da Claude. Esempio completo:

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
  "tailored_cv": {
    "personal": { "name": "Marco Rossi", "email": "...", "phone": "...", "location": "Milano" },
    "summary": "Product manager con 5 anni di esperienza nella gestione di prodotti digitali B2B e team cross-funzionali...",
    "experience": ["...array completo con bullet riordinati e riscritti..."],
    "education": ["...invariato..."],
    "skills": { "technical": ["...con keyword aggiunte..."], "soft": ["..."], "languages": ["..."] },
    "certifications": ["...invariato..."],
    "projects": ["...invariato..."]
  },
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
      "suggested": "Product manager con 5 anni di esperienza nella gestione di prodotti digitali B2B e team cross-funzionali...",
      "reason": "Aggiunto riferimento a B2B e team cross-funzionali, richiesti dall'annuncio"
    },
    {
      "section": "experience",
      "index": 0,
      "original": "Gestione del prodotto",
      "suggested": "Gestione della roadmap prodotto con definizione di KPI e OKR trimestrali",
      "reason": "Riscrittura con keyword 'KPI' e 'OKR' presenti nell'annuncio, basata su bullet esistenti"
    }
  ]
}
```

---

## Criteri di accettazione

- [ ] La function riceve CV JSON + job description e restituisce il JSON completo
- [ ] `match_score` è un intero 0-100
- [ ] `ats_score` è un intero 0-100
- [ ] `skills_present` e `skills_missing` hanno label in italiano semplice
- [ ] `seniority_match` ha i 4 campi (candidate_level, role_level, match, note)
- [ ] `ats_checks` contiene esattamente 7 check con id, label, status e detail opzionale
- [ ] `tailored_cv` è un JSON CV completo nello stesso schema dell'input
- [ ] `honest_score` ha tutti i contatori + confidence + flags
- [ ] `diff` è un array di modifiche con section, original, suggested, reason
- [ ] Autenticazione verificata (401 se non autenticato)
- [ ] API key mai esposta al client
