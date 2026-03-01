# Story 04.5 — Edge Function `ai-tailor`: gestione errori e timeout

> Prompt per Lovable — Epic 04, Story 5 di 7
> Prerequisito: story 04.4 completata (la function `ai-tailor` esiste e funziona nel caso happy path)

---

## Cosa fare

Aggiungere alla function `ai-tailor` una gestione errori robusta: timeout, risposte malformate da Claude, JSON non valido, e rate limiting. Il frontend (epic 03) deve ricevere errori chiari per mostrare messaggi utili all'utente.

---

## Scenari di errore da gestire

### 1. Timeout Claude (>30s)

Claude non risponde entro 30 secondi.

**Risposta — 504:**
```json
{
  "error": "ai_timeout",
  "message": "L'elaborazione sta richiedendo più del solito. Riprova."
}
```

**Come implementare:** Imposta un `AbortController` con timeout di 30 secondi sulla chiamata a Claude API. Se scatta l'abort, restituisci l'errore sopra.

---

### 2. Claude restituisce JSON non valido

A volte il modello aggiunge testo prima o dopo il JSON, o il JSON è troncato.

**Gestione:**
1. Prova a fare `JSON.parse()` sulla risposta
2. Se fallisce, prova a estrarre il JSON cercando il primo `{` e l'ultimo `}` nella stringa
3. Se anche questo fallisce → errore

**Risposta — 502:**
```json
{
  "error": "ai_parse_failed",
  "message": "Non sono riuscito a elaborare il risultato. Riprova."
}
```

---

### 3. Claude API non raggiungibile (errore di rete, 500, 529)

**Risposta — 502:**
```json
{
  "error": "ai_unavailable",
  "message": "Il servizio di analisi non è disponibile. Riprova tra qualche istante."
}
```

---

### 4. Utente non autenticato

Il token JWT è assente, scaduto o non valido.

**Risposta — 401:**
```json
{
  "error": "unauthorized",
  "message": "Devi effettuare il login."
}
```

---

### 5. Input mancante o malformato

Manca `master_cv` o `job_description`, oppure `master_cv` non è un oggetto JSON valido.

**Risposta — 400:**
```json
{
  "error": "invalid_input",
  "message": "Dati mancanti. Assicurati di aver caricato il CV e inserito l'annuncio."
}
```

**Validazione minima:**
- `master_cv` deve essere un oggetto con almeno `personal` e `experience`
- `job_description` deve essere una stringa non vuota (minimo 50 caratteri)

---

### 6. Rate limiting

Se lo stesso utente fa più di 10 chiamate al minuto, bloccare.

**Gestione semplice:** Usa una tabella Supabase temporanea o un contatore in-memory (per l'MVP, anche un semplice check su `tailored_cvs` creati nell'ultimo minuto dallo stesso `user_id` va bene).

**Risposta — 429:**
```json
{
  "error": "rate_limited",
  "message": "Troppe richieste. Attendi un momento prima di riprovare."
}
```

---

## Struttura della function con error handling

Pseudocodice della struttura che la function dovrebbe seguire:

```
1. Verifica auth (token JWT) → 401 se fallisce
2. Valida input (master_cv, job_description) → 400 se mancanti
3. Check rate limit → 429 se superato
4. Chiama Claude API con timeout 30s → 504 se timeout
5. Prova a parsare il JSON della risposta → 502 se malformato
6. Restituisci il JSON al client → 200
```

---

## CORS

La function deve restituire gli header CORS corretti per essere chiamata dal frontend Lovable:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
```

Gestire anche le request `OPTIONS` (preflight) restituendo 200 con gli stessi header.

---

## Criteri di accettazione

- [ ] Timeout 30s gestito: errore `ai_timeout` con status 504
- [ ] JSON malformato da Claude gestito: tentativo di recovery + errore `ai_parse_failed` se fallisce
- [ ] Claude API non raggiungibile: errore `ai_unavailable` con status 502
- [ ] Token JWT assente o invalido: errore `unauthorized` con status 401
- [ ] Input mancante: errore `invalid_input` con status 400
- [ ] Rate limit: max 10 chiamate/minuto per utente, errore `rate_limited` con status 429
- [ ] CORS header presenti su tutte le risposte (incluso OPTIONS preflight)
- [ ] Tutti i messaggi di errore sono in italiano e comprensibili dall'utente
