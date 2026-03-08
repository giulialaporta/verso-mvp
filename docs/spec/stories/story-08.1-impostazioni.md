# Story 08.1 — Pagina Impostazioni (Implementata)

**Epic:** 08 — Impostazioni
**Status:** Completata

---

## Cosa è stato implementato

Pagina `/app/impostazioni` con gestione account, privacy, sicurezza e zona pericolosa.

### Sezioni

1. **Account:** email e nome utente (read-only)
2. **Privacy e Dati:**
   - Lista consensi con stato (concesso/revocato), data, azione revoca per quelli revocabili
   - Consensi tracciati: terms_and_privacy (non revocabile), sensitive_data (revocabile), analytics_cookies (revocabile)
   - Export dati (art. 20 GDPR): download JSON con profilo, CV, candidature, consensi
   - Link a documenti legali (T&C, Privacy, Cookie Policy)
3. **Assistenza:** email supporto e email privacy (GDPR)
4. **Sicurezza:** cambio password (redirect a reset-password), logout
5. **Zona pericolosa:** eliminazione account con conferma "ELIMINA" + AlertDialog

### Comportamento

- Consensi caricati da `consent_logs` filtrati per user
- Revoca sensitive_data → inserisce nuovo record `granted: false` + refresh lista
- Reset cookie → `resetCookieConsent()` da localStorage + log revoca
- Export → fetch parallelo di tutte le tabelle utente → download JSON
- Eliminazione → invoca Edge Function `delete-account` → signOut → redirect login

### Componente

`src/pages/Impostazioni.tsx`
