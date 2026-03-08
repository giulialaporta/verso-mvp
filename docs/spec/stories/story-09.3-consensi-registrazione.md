# Story 09.3 — Consensi in Registrazione (Implementata)

**Epic:** 09 — Legal, Privacy, Trasparenza AI
**Status:** Completata

---

## Cosa è stato implementato

Due checkbox obbligatori nella form di registrazione per accettazione T&C e Privacy Policy.

### Comportamento

- Checkbox "Ho letto e accetto i Termini e Condizioni d'Uso" (link a `/termini`)
- Checkbox "Ho letto l'Informativa Privacy e acconsento al trattamento dei miei dati personali" (link a `/privacy`)
- Entrambi obbligatori: il pulsante di registrazione è disabilitato finché non sono selezionati
- Dopo signup riuscito: `saveRegistrationConsents()` inserisce due record in `consent_logs` (type: terms, privacy)
- Record include: user_id, user_hash (SHA-256 email), user_agent, method "registration"

### Componenti

- `src/components/ConsentCheckboxes.tsx` — checkbox + labels
- `saveRegistrationConsents()` — funzione per salvare i consensi post-signup
