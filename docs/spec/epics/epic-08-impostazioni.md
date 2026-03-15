# Epic 08 — Impostazioni (Implementato)

---

## Cosa è stato costruito

Pagina `/app/impostazioni` con gestione account, consensi privacy, data portability GDPR, assistenza, sicurezza e cancellazione account.

---

## Layout

Route `/app/impostazioni` — accessibile dalla sidebar (desktop) e tab bar (mobile).

---

## Sezioni

### 1. Account

- Mostra **email** dell'utente
- Mostra **nome utente** (da profilo)
- Dati in sola lettura

#### Piano

Sottosezione nella card Account che mostra lo stato dell'abbonamento.

**Utente Free:**
- Label: "Piano: Free"
- Link "Scopri Versō Pro" → `/upgrade`

**Utente Pro:**
- Label: "Piano: Versō Pro" con badge accent
- Data rinnovo: "Si rinnova il [pro_expires_at formattata]"
- "Gestisci fatturazione" → Stripe Customer Portal (edge function `customer-portal`)
- "Cancella abbonamento" → dialog di conferma → chiama edge function `cancel-subscription` → imposta `cancel_at_period_end: true`

**Utente Pro in scadenza (`cancel_at_period_end: true`):**
- Mostra data di scadenza
- Messaggio che l'accesso Pro resta attivo fino alla scadenza

---

### 2. Privacy e Dati

#### Lista consensi

Visualizza lo stato di ogni consenso con `ConsentRow`:

| Tipo consenso | Revocabile | Note |
|---------------|------------|------|
| `terms` | No | Obbligatorio — accettazione Termini di Servizio |
| `privacy` | No | Obbligatorio — accettazione Privacy Policy |
| `sensitive_data` | Sì | Consenso art. 9 GDPR per trattamento CV |
| `cookies` | Sì | Consenso cookie analitici/profilazione |

**ConsentRow** — ogni riga mostra:

- Icona stato: ✓ (granted) / ✗ (revoked)
- Label del consenso
- Data di concessione/revoca
- Pulsante **Revoca** (solo per consensi revocabili)

**Comportamento revoca:**

- **Terms e Privacy** → pulsante Revoca assente (consensi obbligatori, non revocabili)
- **Sensitive data** → revocabile con warning: "Non potrai caricare nuovi CV finché il consenso non viene ri-concesso"
- **Cookie** → reset tramite `resetCookieConsent()`, ripristina il banner cookie

#### Data Portability (Art. 20 GDPR)

- Pulsante **"Scarica i miei dati"**
- Genera un file JSON strutturato con i dati dell'utente estratti da 5 tabelle:
  - `profiles`
  - `master_cvs`
  - `applications`
  - `tailored_cvs`
  - `consent_logs`
- Download diretto nel browser

---

### 3. Assistenza

- **Guida & FAQ:** link a `/app/faq` (icona `Question`)
- **Supporto generale:** supporto@verso-cv.app
- **Privacy e dati:** privacy@verso-cv.app
- **Tempi di risposta:** entro 48h lavorative

---

### 4. Sicurezza

| Azione | Comportamento |
|--------|--------------|
| Cambio password | Flusso Supabase Auth per reset password |
| Logout | Termina sessione, redirect alla landing page |

---

### 5. Zona pericolosa

- Sezione visivamente separata con stile destructive
- Pulsante **"Elimina account"**
- Richiede conferma: l'utente deve digitare `ELIMINA` per procedere
- Chiama la edge function `/delete-account`
- Dopo conferma: eliminazione account, logout e redirect

---

## Componenti chiave

| Componente | Scopo |
|------------|-------|
| `ConsentRow` | Riga singolo consenso con stato, data e azione revoca |
| `resetCookieConsent()` | Funzione per resettare il consenso cookie e riattivare il banner |
| `useSubscription` | Hook per stato piano Pro (polling `check-subscription`) |
