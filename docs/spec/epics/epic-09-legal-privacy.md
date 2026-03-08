# Epic 09 — Legal, Privacy e Trasparenza AI (Implementato)

---

## Cosa è stato costruito

1. Tre pagine legali pubbliche (/termini, /privacy, /cookie-policy) con layout dedicato
2. Sistema di consensi alla registrazione con salvataggio in `consent_logs`
3. Consenso dati sensibili (art. 9 GDPR) pre-upload CV
4. Componente trasparenza AI con label dedicate
5. Cookie banner con persistenza localStorage e logging
6. Tabella `consent_logs` con RLS e indici
7. Edge function di cancellazione account con audit trail e anonimizzazione

---

## 1. Pagine legali

Route pubbliche, accessibili senza autenticazione:

| Route | Documento | Versione |
|-------|-----------|----------|
| `/termini` | Termini di Servizio | v1.0 |
| `/privacy` | Privacy Policy | v1.0 |
| `/cookie-policy` | Cookie Policy | v1.0 |

### LegalLayout

Tutte le pagine legali usano `LegalLayout`, un layout condiviso che include:

- **Desktop:** sidebar con Table of Contents (TOC) navigabile
- **Header:** backlink per tornare alla pagina precedente
- **Metadata:** versione del documento + data di ultimo aggiornamento

### Termini di Servizio (v1.0)

11 articoli:

1. Oggetto del servizio
2. Descrizione del servizio
3. Limiti dell'AI
4. Account e registrazione
5. Obblighi dell'utente
6. Contenuti dell'utente
7. Proprietà intellettuale
8. Disponibilità del servizio
9. Limitazione di responsabilità
10. Legge applicabile e foro competente
11. Diritto di recesso

### Privacy Policy (v1.0)

Sezioni principali:

- **Dati trattati:** dati identificativi, CV, dati di navigazione
- **Art. 9 GDPR:** trattamento dati particolari (contenuti nel CV) con consenso esplicito
- **Finalità e basi giuridiche:** consenso, esecuzione contratto, legittimo interesse
- **Subprocessori:** Supabase (hosting/DB), Google Gemini (AI), Google OAuth (autenticazione)
- **Diritti dell'interessato:** accesso, rettifica, cancellazione, portabilità, opposizione
- **Misure di sicurezza:** crittografia, RLS, accesso minimo
- **Conservazione:** 30 giorni dopo cancellazione account

### Cookie Policy (v1.0)

| Tipo | Utilizzati | Consenso richiesto |
|------|-----------|-------------------|
| Tecnici | Sì | No (necessari) |
| Analitici | No | — |
| Profilazione | No | — |

---

## 2. Consensi alla registrazione

### ConsentCheckboxes

Componente usato nel form di registrazione:

- **2 checkbox** obbligatorie (Termini + Privacy)
- Checkbox **non pre-spuntate** (requisito GDPR)
- Pulsante di registrazione **disabilitato** finché entrambe non sono spuntate
- Al submit: salvataggio dei consensi nella tabella `consent_logs` con tipo `terms` e `privacy`

---

## 3. Consenso dati sensibili (Art. 9 GDPR)

### SensitiveDataConsent

Modal che appare **prima dell'upload del CV**:

- Spiega che il CV può contenere dati particolari (art. 9 GDPR)
- Richiede consenso esplicito per il trattamento
- Senza consenso, l'upload è bloccato
- Consenso registrato in `consent_logs` con tipo `sensitive_data`

---

## 4. Trasparenza AI

### AiLabel

Componente inline che indica dove l'AI interviene nel processo:

- Utilizzato negli step del wizard di candidatura
- Indica chiaramente quali output sono generati dall'intelligenza artificiale
- Soddisfa il requisito di trasparenza dell'AI Act

---

## 5. Cookie banner

### CookieBanner

- Posizione: **bottom sticky** (fisso in basso)
- Appare al primo accesso o dopo reset dei cookie
- Persistenza: **localStorage** per utenti anonimi
- Se utente autenticato: salvataggio anche in `consent_logs` con tipo `cookies`
- Azioni: Accetta / Rifiuta / Personalizza

---

## 6. Tabella consent_logs

### Schema

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK a `auth.users` |
| `consent_type` | text | `terms`, `privacy`, `sensitive_data`, `cookies` |
| `status` | text | `granted` / `revoked` |
| `ip_address` | text | IP al momento del consenso |
| `user_agent` | text | User-agent del browser |
| `created_at` | timestamptz | Timestamp del record |

- **RLS abilitata:** ogni utente vede solo i propri consensi
- **Indici:** su `user_id` e su `(user_id, consent_type)`

---

## 7. Cancellazione account

### Edge function `/delete-account`

Flusso di cancellazione:

1. Utente conferma digitando `ELIMINA` nella pagina Impostazioni
2. Client chiama la edge function `/delete-account`
3. La function esegue in ordine:
   - **Audit trail:** registra la richiesta di cancellazione in `consent_logs`
   - **Anonimizzazione:** anonimizza i dati personali nelle tabelle correlate
   - **Eliminazione:** rimuove l'account da `auth.users`
4. Logout e redirect alla landing page

---

## Componenti chiave

| Componente | Scopo |
|------------|-------|
| `ConsentCheckboxes` | 2 checkbox obbligatorie nel form di registrazione |
| `CookieBanner` | Banner cookie bottom sticky con persistenza |
| `SensitiveDataConsent` | Modal consenso art. 9 pre-upload CV |
| `AiLabel` | Label trasparenza AI negli step del wizard |
| `LegalLayout` | Layout condiviso per pagine legali (TOC, header, versione) |
