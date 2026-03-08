# Story 09.4 — Consenso Dati Sensibili pre-Upload (Implementata)

**Epic:** 09 — Legal, Privacy, Trasparenza AI
**Status:** Completata

---

## Cosa è stato implementato

Modal di consenso Art. 9 GDPR mostrata prima del primo upload CV, per informare l'utente sul trattamento di dati sensibili potenzialmente presenti nel CV.

### Comportamento

- Prima dell'upload CV: check `hasSensitiveDataConsent(userId)`
- Se assente → mostra `SensitiveDataConsent` modal
- Il modal spiega che il CV potrebbe contenere dati sensibili (salute, religione, etnia, etc.)
- Checkbox: "Acconsento al trattamento delle eventuali categorie particolari di dati contenute nel mio CV (art. 9 GDPR)"
- "Continua" → salva record in `consent_logs` (type: sensitive_data, method: pre_upload_modal) → procede con upload
- "Annulla" → chiude modal, non procede
- Il consenso è one-time: una volta dato, non viene più richiesto

### Componente

`src/components/SensitiveDataConsent.tsx`

### Revoca

Revocabile dalla pagina Impostazioni → sezione Privacy e Dati. La revoca blocca nuovi upload ma non elimina CV esistenti.
