# Story 09.8 — Eliminazione Account (Implementata)

**Epic:** 09 — Legal, Privacy, Trasparenza AI
**Status:** Completata

---

## Cosa è stato implementato

Flusso completo di eliminazione account con Edge Function server-side e UI con doppia conferma.

### UI (Impostazioni → Zona pericolosa)

- Pulsante "Elimina account" → AlertDialog
- Testo esplicativo: "Tutti i tuoi dati verranno eliminati permanentemente"
- Input di conferma: digitare "ELIMINA"
- Pulsante destructive disabilitato fino a conferma
- Dopo eliminazione: signOut → redirect a /login → toast conferma

### Edge Function `delete-account`

Ordine operazioni:
1. Verifica autenticazione (Bearer token)
2. Stampa `user_hash` (SHA-256 email) su tutti i consent_logs dell'utente
3. Inserisce record `account_deletion` in consent_logs (audit trail)
4. Anonimizza consent_logs: user_id → UUID zero (`00000000-...`)
5. Elimina file Storage (bucket: cv-uploads, cv-exports)
6. Elimina record DB in ordine FK: tailored_cvs → applications → master_cvs → profiles
7. Elimina utente da auth.users (admin API)

### GDPR compliance

- I consent_logs vengono preservati (anonimizzati) per obblighi di legge
- L'hash email permette ricostruzione audit trail se necessario
- Tutti gli altri dati personali vengono eliminati permanentemente

### File

- `src/pages/Impostazioni.tsx` (sezione "Zona pericolosa")
- `supabase/functions/delete-account/index.ts`
