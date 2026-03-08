

# Problema: tracciabilità dei consensi in caso di ispezione

## La lacuna

Oggi la `delete-account` edge function **anonimizza** tutti i `consent_logs` impostando `user_id = 00000000-0000-0000-0000-000000000000`. Dopo la cancellazione, **tutti** i record anonimizzati sono indistinguibili tra loro. Se arriva il Garante e chiede "l'utente X ha dato consenso Y?", non c'è modo di ricostruirlo.

Inoltre, dalla network emerge che l'utente corrente (registrato via Apple OAuth prima del sistema consensi) **non ha nessun record in `consent_logs`** — array vuoto. Questo è un altro buco: utenti pre-esistenti senza consenso registrato.

## Soluzione: pseudonimizzazione con hash + email nei metadata

### 1. Aggiungere colonna `user_hash` alla tabella `consent_logs`

Un hash SHA-256 dell'email dell'utente (one-way, non reversibile direttamente, ma ricostruibile se conosci l'email oggetto di ispezione).

```sql
ALTER TABLE public.consent_logs ADD COLUMN user_hash text;
CREATE INDEX idx_consent_logs_user_hash ON public.consent_logs(user_hash);
```

### 2. Modificare `delete-account` edge function

Prima di anonimizzare:
- Calcolare `SHA256(user.email)` 
- Salvare lo hash in tutti i record dell'utente
- Salvare email hashata anche nel record `account_deletion`
- **Poi** anonimizzare `user_id` a UUID zero

Così in caso di ispezione: il Garante fornisce l'email → si calcola SHA256 → si cercano i record corrispondenti.

### 3. Popolare `user_hash` anche nei nuovi consensi

Modificare i punti dove si inseriscono consent_logs (Login.tsx, SensitiveDataConsent.tsx, CookieBanner.tsx, Impostazioni.tsx) per includere `user_hash` calcolato lato client con `crypto.subtle.digest`.

Oppure, più pulito: **trigger database** che calcola automaticamente lo hash. Ma non abbiamo accesso all'email nella tabella consent_logs. Quindi meglio farlo lato applicazione.

### 4. Salvare l'email nel campo `metadata` del record `account_deletion`

Per ricostruzione diretta in caso di ispezione, nel record `account_deletion` inserire anche l'email in chiaro nei metadata (solo quel record, conservato per obbligo legale). Questo è legittimo: base giuridica = obbligo legale (art. 6.1.c GDPR) e legittimo interesse per difesa giuridica (art. 6.1.f).

## Piano implementativo — 3 modifiche

### Modifica 1: Migrazione DB
- Aggiungere colonna `user_hash TEXT` a `consent_logs`
- Indice su `user_hash`

### Modifica 2: Edge function `delete-account`
- Prima di anonimizzare: calcolare `SHA256(user.email)` con Web Crypto API
- Aggiornare tutti i consent_logs dell'utente con `user_hash`
- Nel record `account_deletion`: aggiungere `metadata.email_hash` e `metadata.email` (per ricostruzione diretta)
- Poi procedere con anonimizzazione `user_id`

### Modifica 3: Utility lato client per `user_hash`
- Creare una funzione `hashEmail(email)` riutilizzabile
- Passare `user_hash` in tutti gli insert di `consent_logs` (ConsentCheckboxes, SensitiveDataConsent, CookieBanner, Impostazioni)
- In questo modo **ogni** record è tracciabile anche senza `user_id`

### Risultato per l'ispezione

```text
Ispettore: "L'utente mario.rossi@email.com ha dato consenso?"

1. Calcoli SHA256("mario.rossi@email.com") → "a1b2c3..."
2. SELECT * FROM consent_logs WHERE user_hash = 'a1b2c3...'
3. Trovi tutti i consensi: T&C ✓, Privacy ✓, Dati sensibili ✓, 
   Revoca dati sensibili, Account deletion
4. Timeline completa ricostruita.
```

