# Story 04.3 — Edge Function `scrape-job`

> Prompt per Lovable — Epic 04, Story 3 di 7

---

## Cosa fare

Creare una Supabase Edge Function che riceve un URL di un annuncio di lavoro, scarica il contenuto della pagina lato server (evitando CORS), e usa Claude per estrarre i dati strutturati. Già referenziata dall'epic 03 (wizard step 1, tab URL).

---

## Endpoint

`POST /functions/v1/scrape-job`

---

## Input

```json
{
  "url": "https://www.linkedin.com/jobs/view/1234567890"
}
```

---

## Processo

1. **Validazione URL** — Verifica che `url` sia una URL valida (http/https). Se no → errore 400.

2. **Fetch server-side** — Scarica il contenuto HTML della pagina con un semplice `fetch()`. Imposta un timeout di 10 secondi. Usa un User-Agent realistico per evitare blocchi:
   ```
   Mozilla/5.0 (compatible; VersoBot/1.0)
   ```

3. **Strip HTML** — Rimuovi tutti i tag HTML, script, style. Estrai solo il testo leggibile. Tronca a 8000 caratteri se il testo è troppo lungo.

4. **Estrazione AI** — Invia il testo a Claude API con il system prompt sotto.

5. **Restituisci il JSON** estratto.

---

## System prompt

```
Dato il testo di una pagina web che contiene un annuncio di lavoro, estrai:
- company_name: nome dell'azienda
- role_title: titolo del ruolo
- role_description: il testo completo dell'annuncio pulito (requisiti, responsabilità, qualifiche)

Se non riesci a trovare un campo, lascialo vuoto.
Rispondi SOLO con JSON valido.
```

---

## Configurazione

- Model: `claude-sonnet-4-20250514`
- Max tokens: 4096
- Timeout fetch URL: 10s
- Timeout Claude: 15s
- API key: `Deno.env.get('ANTHROPIC_API_KEY')` (già configurata nella story 04.2)

---

## Output (success — 200)

```json
{
  "company_name": "Acme Corp",
  "role_title": "Product Manager",
  "role_description": "Cerchiamo un Product Manager con esperienza in prodotti digitali B2B. Responsabilità: gestione roadmap, coordinamento team cross-funzionale, definizione KPI..."
}
```

---

## Output (errori)

**URL non raggiungibile — fetch fallisce (422):**
```json
{
  "error": "url_unreachable",
  "message": "Non riesco ad aprire questo link. Incolla il testo dell'annuncio direttamente."
}
```

Questo messaggio viene mostrato dal frontend dell'epic 03 per fare fallback alla textarea.

**URL non valida (400):**
```json
{
  "error": "invalid_url",
  "message": "L'URL inserito non è valido."
}
```

**Pagina senza annuncio riconoscibile (200 ma campi vuoti):**
```json
{
  "company_name": "",
  "role_title": "",
  "role_description": ""
}
```

Il frontend (epic 03) gestisce questo caso mostrando i campi editabili vuoti, così l'utente può compilarli manualmente.

**Utente non autenticato (401):**
```json
{
  "error": "unauthorized",
  "message": "Devi effettuare il login."
}
```

---

## Sicurezza

- Verificare token JWT come nella story 04.2
- API key mai esposta al client
- Il fetch server-side serve ad aggirare i blocchi CORS dei siti di job posting, non a fare nulla di nascosto — è equivalente a un utente che apre la pagina nel browser

---

## Criteri di accettazione

- [ ] La function riceve un URL e restituisce `company_name`, `role_title`, `role_description`
- [ ] Il fetch è server-side (nessun problema CORS)
- [ ] Se il fetch fallisce (timeout, 403, rete) → restituisce errore `url_unreachable` con messaggio chiaro
- [ ] Se l'URL non è valida → errore 400
- [ ] Se la pagina non contiene un annuncio riconoscibile → restituisce campi vuoti (non errore)
- [ ] Autenticazione verificata
- [ ] Testo HTML strippato prima di inviarlo a Claude
- [ ] Timeout fetch: 10s. Timeout Claude: 15s.
