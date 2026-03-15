

## Piano: Completare la configurazione del webhook Stripe

### Problema
La edge function `stripe-webhook` esiste ed e' funzionante nel codice, ma manca la registrazione in `supabase/config.toml`. Senza questa entry, la funzione non viene deployata correttamente. Inoltre, Stripe non invia JWT, quindi serve `verify_jwt = false`.

### Modifiche

**1. `supabase/config.toml`** — Aggiungere:
```toml
[functions.stripe-webhook]
verify_jwt = false
```

**2. Passo manuale (tuo)**
Dopo il deploy, devi registrare il webhook nella dashboard Stripe:
- URL: `https://omazcdcyqrdvyyxzvmyx.supabase.co/functions/v1/stripe-webhook`
- Eventi: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Copiare il Signing Secret generato da Stripe e verificare che corrisponda al secret `STRIPE_WEBHOOK_SECRET` gia' configurato nel backend

