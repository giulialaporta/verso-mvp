# Story 09.10 — Pseudonimizzazione Consensi (Implementata)

**Epic:** 09 — Legal, Privacy, Trasparenza AI
**Status:** Completata

---

## Cosa è stato implementato

Sistema di pseudonimizzazione basato su hash SHA-256 dell'email per il campo `user_hash` in `consent_logs`.

### Comportamento

- Ogni volta che viene inserito un record in `consent_logs`, viene calcolato `user_hash = SHA-256(email.toLowerCase().trim())`
- Il campo `user_hash` permette di ricostruire l'audit trail anche dopo l'anonimizzazione del `user_id` (eliminazione account)
- Alla eliminazione account:
  1. Tutti i consent_logs dell'utente ricevono il `user_hash` (stampato preventivamente)
  2. Il `user_id` viene sostituito con UUID anonimo (`00000000-0000-0000-0000-000000000000`)
  3. Il `user_hash` resta intatto per audit

### Implementazione

- `src/lib/hash-email.ts` — funzione `hashEmail()` usando `crypto.subtle.digest`
- `supabase/functions/delete-account/index.ts` — calcolo hash server-side e anonimizzazione
- Usato in: `CookieBanner`, `ConsentCheckboxes`, `SensitiveDataConsent`, `Impostazioni`
