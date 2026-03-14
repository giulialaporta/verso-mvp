
# Piano di implementazione — Epic 07: Versō Pro ✅

Implementazione completata.

## Cosa è stato costruito

### Database
- Colonne aggiunte a `profiles`: `is_pro`, `stripe_customer_id`, `stripe_subscription_id`, `pro_since`, `pro_expires_at`

### Edge Functions
- `create-checkout` — Crea sessione Stripe Checkout
- `check-subscription` — Verifica stato abbonamento, aggiorna profilo
- `customer-portal` — Sessione Stripe Billing Portal

### Frontend
- `useSubscription` hook — polling ogni 60s
- `useProGate` hook — gate candidature client-side
- `/upgrade` page — value prop + CTA checkout
- Gate in Home, Nuova, AppShell FAB, StepCompleta
- Sezione Piano in Impostazioni
- Post-upgrade polling + toast benvenuto
- Server-side gate in `ai-tailor` (403 UPGRADE_REQUIRED)
- Micro-banner Free in StepCompleta
