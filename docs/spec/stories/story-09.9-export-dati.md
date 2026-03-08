# Story 09.9 — Export Dati Personali (Implementata)

**Epic:** 09 — Legal, Privacy, Trasparenza AI
**Status:** Completata

---

## Cosa è stato implementato

Funzionalità di portabilità dati (art. 20 GDPR) dalla pagina Impostazioni.

### Comportamento

- Pulsante "Esporta i miei dati" nella sezione Privacy e Dati
- Fetch parallelo di tutte le tabelle utente: profiles, master_cvs, applications, tailored_cvs, consent_logs
- Genera oggetto JSON strutturato con: exported_at, user_email, e tutti i dati
- Download automatico come file `verso-dati-YYYY-MM-DD.json`
- Stato loading durante la preparazione
- Toast di conferma o errore

### Note

- Implementato interamente lato client (no Edge Function dedicata)
- Il file contiene tutti i dati personali dell'utente — avviso nella UI di conservarlo in modo sicuro
