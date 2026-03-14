

# Piano — Cancellazione abbonamento in-app

## Situazione attuale

Oggi l'utente deve uscire dall'app e andare sullo Stripe Customer Portal per cancellare. Questo rompe il flusso e crea confusione.

## Cosa costruire

Un flusso di cancellazione diretto nella pagina Impostazioni, senza mai uscire dall'app.

### 1. Pulsante "Annulla abbonamento" in Impostazioni

Nella card Piano, quando l'utente è Pro, aggiungere un link/pulsante "Annulla abbonamento" sotto "Gestisci abbonamento". Click → apre un AlertDialog di conferma.

### 2. Dialog di conferma con conseguenze chiare

Il dialog mostra:
- "Vuoi annullare Versō Pro?"
- Cosa succede: accesso mantenuto fino a fine periodo (data mostrata), poi ritorno al piano Free con limite di 1 candidatura
- Cosa resta: candidature e CV già creati rimangono accessibili
- CTA primaria: "Mantieni Pro" (chiude dialog)
- CTA secondaria/destructive: "Conferma annullazione"

### 3. Edge function o tool call per cancellare

Due opzioni possibili:

**Opzione A — Usare il tool Stripe `cancel_subscription`** durante l'implementazione per verificare che funzioni, poi creare una edge function dedicata `cancel-subscription` che:
- Autentica l'utente
- Recupera il `stripe_subscription_id` dal profilo
- Chiama `stripe.subscriptions.update(subId, { cancel_at_period_end: true })` (cancella a fine periodo, non immediata)
- Aggiorna il profilo con lo stato di cancellazione
- Ritorna `{ canceled: true, cancel_at: "..." }`

**Opzione B — Approccio diretto (consigliato):** nuova edge function `cancel-subscription` che usa l'SDK Stripe per impostare `cancel_at_period_end: true`.

### 4. Stato "in scadenza" dopo cancellazione

Come già proposto nel piano precedente:
- `check-subscription` ritorna `cancel_at_period_end` da Stripe
- `useSubscription` espone `cancelAtPeriodEnd`
- Card Piano mostra badge amber "In scadenza il [data]" + CTA "Riattiva" (che apre il Stripe Portal per ri-attivare)

### 5. Refresh immediato post-cancellazione

Dopo la conferma, chiamare `refresh()` di `useSubscription` per aggiornare immediatamente la UI senza aspettare il polling.

## File coinvolti

| File | Modifica |
|------|----------|
| `supabase/functions/cancel-subscription/index.ts` | Nuova edge function |
| `supabase/config.toml` | Aggiungere config per cancel-subscription |
| `supabase/functions/check-subscription/index.ts` | Aggiungere `cancel_at_period_end` alla response |
| `src/hooks/useSubscription.ts` | Esporre `cancelAtPeriodEnd` |
| `src/pages/Impostazioni.tsx` | Dialog cancellazione + stato "in scadenza" + refresh on focus |

Nessuna migrazione DB necessaria.

