# Story 01.3 — Password Reset (Implementata)

**Epic:** 01 — Auth + Setup
**Status:** Completata

---

## Cosa è stato implementato

Flusso completo di recupero password con pagina dedicata `/reset-password`.

### Comportamento

1. Click "Password dimenticata?" nella pagina login
2. Inserimento email → Supabase invia link di reset
3. Link apre `/reset-password` con `type=recovery` nell'URL hash
4. Utente inserisce nuova password
5. Redirect a `/app/home`

### Note

Questa feature non era prevista nel piano MVP originale.
