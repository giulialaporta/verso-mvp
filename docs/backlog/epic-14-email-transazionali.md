# Epic 14 — Email Transazionali

## Obiettivo

Inviare email automatiche per i momenti chiave del ciclo di vita utente. L'obiettivo e' retention: riportare l'utente nell'app quando ha lavoro in sospeso o motivo di tornare.

Provider: Resend (API semplice, free tier 100 email/giorno, SDK Deno-compatibile).

## Comportamento

### Email previste

| Trigger | Email | Delay | Contenuto |
|---------|-------|-------|-----------|
| Registrazione completata | Benvenuto | Immediata | "Benvenuto su Verso — carica il tuo CV per iniziare" |
| Draft abbandonato (wizard non completato) | Reminder draft | 48h | "Hai una candidatura in bozza per {azienda} — riprendila" |
| Candidatura inviata | Follow-up reminder | 7 giorni | "Hai inviato il CV a {azienda} 7 giorni fa — aggiorna lo status" |
| Upgrade completato | Benvenuto Pro | Immediata | "Benvenuto in Verso Pro — candidature illimitate sbloccate" |

### Edge function `send-email`

**Endpoint:** Funzione interna, chiamata da altre edge function o da un cron job.

**Processo:**
1. Riceve: `to`, `template_id`, `template_data`
2. Costruisce email HTML da template inline (no servizio template esterno)
3. Chiama Resend API con `RESEND_API_KEY`
4. Log risultato (success/error)

**Mittente:** `Verso <noreply@verso-cv.app>`

### Cron per email ritardate

Una edge function `email-scheduler` invocata ogni ora (Supabase Cron / pg_cron):

1. **Draft abbandonati:** cerca `applications` con `status = 'draft'` e `created_at < now() - 48h` e nessuna email gia' inviata per quell'application
2. **Follow-up 7gg:** cerca `applications` con `status = 'sent'` e `updated_at < now() - 7d` e nessuna email follow-up inviata
3. Per ogni match: chiama `send-email` con i dati dell'application

### Tabella `email_log`

```sql
CREATE TABLE email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  template_id text NOT NULL,
  sent_at timestamptz DEFAULT now()
);
```

Serve per evitare duplicati: prima di inviare, controlla se esiste gia' un record con stesso `user_id` + `application_id` + `template_id`.

### Opt-out

Per ora nessun opt-out granulare. L'utente puo' cancellare l'account se non vuole email. In futuro: preferenze email nelle Impostazioni.

## Flussi

1. **Benvenuto** — Signup → trigger immediato → email
2. **Draft abbandonato** — Wizard non completato → 48h dopo → cron trova draft → email → utente torna e completa
3. **Follow-up** — Candidatura inviata → 7gg dopo → cron trova candidatura → email → utente aggiorna status
4. **Duplicato evitato** — Cron trova draft ma email gia' inviata → skip

## Criteri di accettazione

- [ ] Edge function `send-email` funzionante con Resend
- [ ] Email di benvenuto inviata dopo registrazione
- [ ] Email draft abbandonato inviata dopo 48h
- [ ] Email follow-up inviata dopo 7 giorni
- [ ] Email benvenuto Pro inviata dopo upgrade
- [ ] Tabella `email_log` previene duplicati
- [ ] Template email in italiano, stile dark coerente con l'app
- [ ] Mittente: `Verso <noreply@verso-cv.app>`

## Stories

| ID | Story | Priorita' |
|----|-------|----------|
| 14.1 | Creare tabella `email_log` e edge function `send-email` con Resend | Must |
| 14.2 | Email di benvenuto dopo registrazione | Must |
| 14.3 | Cron `email-scheduler` + email draft abbandonato (48h) | Must |
| 14.4 | Email follow-up 7 giorni dopo candidatura inviata | Should |
| 14.5 | Email benvenuto Pro dopo upgrade | Should |
