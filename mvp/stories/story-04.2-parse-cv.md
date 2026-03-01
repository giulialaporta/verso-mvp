# Story 04.2 — Edge Function `parse-cv`

> Prompt per Lovable — Epic 04, Story 2 di 7

---

## Cosa fare

Creare una Supabase Edge Function che riceve un PDF, estrae il testo e lo struttura in un JSON schema standard usando Claude API. Questa function è già referenziata dall'epic 02 (onboarding): quando l'utente carica il suo CV, il frontend chiama questa function.

---

## Endpoint

`POST /functions/v1/parse-cv`

---

## Input

Il body della request è `multipart/form-data` con un campo `file` contenente il PDF.

---

## Processo

1. **Estrai testo dal PDF** — Usa una libreria per estrarre il testo raw dal file PDF ricevuto (es. `pdf-parse` o equivalente compatibile con Deno/Edge Functions)

2. **Invia a Claude API** — Chiama `https://api.anthropic.com/v1/messages` con:
   - Model: `claude-sonnet-4-20250514`
   - Max tokens: 4096
   - System prompt (vedi sotto)
   - Il testo raw come user message

3. **Restituisci il JSON** — Parsa la risposta di Claude (che è JSON puro) e restituiscila al frontend

---

## System prompt

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

---

## Output (success — 200)

```json
{
  "content": {
    "personal": { "name": "Marco Rossi", "email": "marco@email.com", "phone": "+39 333 1234567", "location": "Milano" },
    "summary": "Product manager con 5 anni di esperienza...",
    "experience": [
      {
        "company": "Acme Corp",
        "role": "Product Manager",
        "start": "2021-03",
        "end": "",
        "current": true,
        "bullets": ["Gestione roadmap prodotto B2B SaaS", "Coordinamento team di 8 sviluppatori"]
      }
    ],
    "education": [
      {
        "institution": "Politecnico di Milano",
        "degree": "Laurea Magistrale",
        "field": "Ingegneria Gestionale",
        "start": "2014",
        "end": "2016"
      }
    ],
    "skills": {
      "technical": ["Jira", "Figma", "SQL"],
      "soft": ["Leadership", "Comunicazione"],
      "languages": ["Italiano (madrelingua)", "Inglese (C1)"]
    },
    "certifications": [],
    "projects": []
  },
  "raw_text": "Marco Rossi\nProduct Manager\n..."
}
```

---

## Output (errore)

**PDF non leggibile (422):**
```json
{
  "error": "pdf_parse_failed",
  "message": "Non riesco a leggere questo file. Prova con un altro PDF."
}
```

**Claude API non raggiungibile (502):**
```json
{
  "error": "ai_unavailable",
  "message": "Il servizio di analisi non è disponibile. Riprova tra qualche istante."
}
```

**Utente non autenticato (401):**
```json
{
  "error": "unauthorized",
  "message": "Devi effettuare il login."
}
```

---

## Sicurezza

- La API key di Claude (`ANTHROPIC_API_KEY`) è salvata in Supabase Secrets → la function la legge con `Deno.env.get('ANTHROPIC_API_KEY')`
- **MAI** restituire la API key al client
- Verificare che la request abbia un `Authorization: Bearer <token>` valido — usare il client Supabase per validare il token JWT
- Se il token è assente o invalido → 401

---

## Configurazione Supabase Secret

Prima di deployare, assicurarsi che il secret esista:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

---

## Criteri di accettazione

- [ ] La function riceve un PDF via multipart/form-data
- [ ] Estrae il testo dal PDF
- [ ] Invia il testo a Claude e riceve un JSON strutturato
- [ ] Restituisce `content` (JSON CV) + `raw_text` (testo grezzo)
- [ ] Gestisce errore PDF non leggibile (422)
- [ ] Gestisce errore Claude non raggiungibile (502)
- [ ] Verifica autenticazione utente (401 se non autenticato)
- [ ] API key mai esposta al client
