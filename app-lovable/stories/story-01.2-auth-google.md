# Story 01.2 — Google OAuth (Implementata)

**Epic:** 01 — Auth + Setup
**Status:** Completata

---

## Cosa è stato implementato

Pulsante "Continua con Google" nella pagina login, gestito tramite Lovable Auth SDK.

### Comportamento

1. Click su "Continua con Google"
2. Lovable Auth SDK gestisce il flusso OAuth
3. Auto-creazione utente in Supabase
4. Trigger auto-create profilo in tabella `profiles`
5. Redirect a `/app/home`
