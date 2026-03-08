# Story 09.7 — Sezione Privacy in Impostazioni (Implementata)

**Epic:** 09 — Legal, Privacy, Trasparenza AI
**Status:** Completata

---

## Cosa è stato implementato

Sezione "Privacy e Dati" nella pagina Impostazioni con gestione consensi, export dati e link legali.

### Comportamento

**Lista consensi:**
- Mostra stato corrente di ogni consenso (concesso/revocato) con data
- Tre tipi: terms_and_privacy (non revocabile), sensitive_data (revocabile), analytics_cookies (revocabile)
- Per consensi revocabili: pulsante "Revoca" con conferma e spiegazione delle conseguenze
- Revoca sensitive_data → inserisce record `granted: false` in consent_logs
- Revoca analytics_cookies → reset localStorage + log revoca

**Export dati (art. 20 GDPR):**
- Pulsante "Esporta i miei dati"
- Fetch parallelo di tutte le tabelle utente (profiles, master_cvs, applications, tailored_cvs, consent_logs)
- Download JSON strutturato con timestamp

**Link legali:**
- Link a T&C, Privacy Policy, Cookie Policy (apertura in nuova tab)

### Integrazione

Parte di `src/pages/Impostazioni.tsx`, sezione card "Privacy e Dati"
