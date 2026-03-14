
# Piano di implementazione — Cancellazione abbonamento in-app ✅

Implementazione completata.

## Cosa è stato costruito

### Edge Functions
- `cancel-subscription` — Autentica utente, recupera `stripe_subscription_id` dal profilo, chiama `stripe.subscriptions.update(subId, { cancel_at_period_end: true })`. Ritorna `{ canceled: true, cancel_at: "..." }`
- `check-subscription` — Aggiunto `cancel_at_period_end` alla response

### Frontend
- `useSubscription` hook — Espone `cancelAtPeriodEnd` nello state + refresh automatico su window focus
- `Impostazioni.tsx` — Piano card con tre stati:
  1. **Pro attivo**: badge verde + "Gestisci abbonamento" + link "Annulla abbonamento"
  2. **In scadenza** (cancelAtPeriodEnd): badge amber + data scadenza + "Riattiva abbonamento"
  3. **Free**: link a /upgrade
- AlertDialog di conferma cancellazione con conseguenze chiare
- Toast di conferma post-cancellazione con data di scadenza
- Refresh immediato dopo cancellazione

### Flusso utente
1. Pro → Impostazioni → "Annulla abbonamento"
2. Dialog: "Vuoi annullare Versō Pro?" con dettagli su cosa succede
3. "Conferma annullazione" → edge function → badge diventa "In scadenza il [data]"
4. Se cambia idea → "Riattiva abbonamento" → Stripe Portal per ri-attivare
