# Epic 11 — Stripe Webhook

## Obiettivo

Sostituire il polling ogni 60 secondi con un webhook Stripe che aggiorna lo stato dell'abbonamento in tempo reale. Il polling resta come fallback di sicurezza.

Oggi se l'utente paga e il polling fallisce, rimane Free. Se Stripe cancella l'abbonamento (chargeback, carta scaduta), il profilo potrebbe restare Pro per ore.

## Comportamento

### Edge function `stripe-webhook`

**Endpoint:** `POST /functions/v1/stripe-webhook`

Riceve eventi Stripe firmati con `STRIPE_WEBHOOK_SECRET`. Gestisce:

| Evento Stripe | Azione |
|---------------|--------|
| `checkout.session.completed` | Imposta `is_pro: true`, salva `stripe_customer_id`, `stripe_subscription_id`, `pro_since` |
| `customer.subscription.updated` | Aggiorna `pro_expires_at`, `cancel_at_period_end` |
| `customer.subscription.deleted` | Imposta `is_pro: false`, clear subscription fields |
| `invoice.payment_failed` | (opzionale) Log per monitoraggio |

### Validazione firma

Ogni richiesta deve essere verificata con `Stripe.webhooks.constructEvent()` usando il `STRIPE_WEBHOOK_SECRET` (env var). Se la firma non corrisponde → 400.

### Lookup utente

Il webhook identifica l'utente tramite `stripe_customer_id` in `profiles`. Se non trovato → log errore, 200 (non ritentare).

### Idempotenza

Il webhook puo' essere chiamato piu' volte per lo stesso evento. Le operazioni devono essere idempotenti (upsert, non insert).

### Polling come fallback

`useSubscription` resta attivo ma con intervallo ridotto a **5 minuti** (da 60 secondi). Il webhook gestisce il 99% dei casi, il polling copre eventuali miss.

## Flussi

1. **Happy path** — Utente paga → Stripe chiama webhook → `is_pro: true` → utente gia' Pro quando torna all'app
2. **Chargeback** — Stripe cancella subscription → webhook → `is_pro: false` → utente vede Piano Free
3. **Carta scaduta** — `invoice.payment_failed` → log → dopo retry Stripe falliti → `subscription.deleted` → webhook → `is_pro: false`
4. **Webhook down** — Polling a 5 minuti copre il caso. Stripe riprova i webhook per 72h.

## Stati

| Stato | Descrizione |
|-------|-------------|
| Webhook ricevuto | Firma valida, evento processato |
| Firma invalida | 400, log errore |
| Utente non trovato | Log warning, 200 (no retry) |
| Evento non gestito | 200 (ignora silenziosamente) |

## Criteri di accettazione

- [ ] Edge function `stripe-webhook` deployata
- [ ] Verifica firma con `STRIPE_WEBHOOK_SECRET`
- [ ] `checkout.session.completed` → `is_pro: true` + campi subscription
- [ ] `customer.subscription.updated` → aggiorna `pro_expires_at`, `cancel_at_period_end`
- [ ] `customer.subscription.deleted` → `is_pro: false`, clear fields
- [ ] Polling ridotto a 5 minuti (da 60 secondi)
- [ ] Webhook registrato nella dashboard Stripe (manuale)
- [ ] Test: pagamento → profilo aggiornato senza polling

## Stories

| ID | Story | Priorita' |
|----|-------|----------|
| 11.1 | Creare edge function `stripe-webhook` con validazione firma e gestione 3 eventi | Must |
| 11.2 | Ridurre intervallo polling `useSubscription` a 5 minuti | Must |
| 11.3 | Aggiungere gestione `invoice.payment_failed` (log) | Should |
