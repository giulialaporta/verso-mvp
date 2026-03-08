# Story 09.1 — Database consent_logs (Implementata)

**Epic:** 09 — Legal, Privacy, Trasparenza AI
**Status:** Completata

---

## Cosa è stato implementato

Tabella `consent_logs` nel database per audit trail GDPR completo di tutti i consensi utente.

### Schema

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | Auto-generato |
| user_id | uuid | Riferimento utente (anonimizzato a UUID zero dopo eliminazione) |
| user_hash | text | SHA-256 dell'email per ricostruzione audit trail post-eliminazione |
| consent_type | text | terms_and_privacy, sensitive_data, analytics_cookies, account_deletion |
| consent_version | text | Default "1.0" |
| granted | boolean | true = concesso, false = revocato |
| granted_at | timestamptz | Data del consenso |
| revoked_at | timestamptz | Nullable |
| user_agent | text | Browser dell'utente |
| ip_address | text | Non implementato (privacy by design) |
| method | text | registration, pre_upload_modal, cookie_banner, settings_revoke, settings_reset, settings_page |
| metadata | jsonb | Dati contestuali (screen, etc.) |

### Comportamento

- RLS: utenti autenticati possono leggere e inserire solo i propri record
- Alla eliminazione account: user_id → UUID anonimo, user_hash preservato
- Ogni azione di consenso genera un nuovo record (append-only, non update)
