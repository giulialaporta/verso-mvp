
# Piano di implementazione — Epic 07: Versō Pro ✅

Implementazione completata.

## Cosa è stato costruito

### Database
- Colonne aggiunte a `profiles`: `is_pro`, `stripe_customer_id`, `stripe_subscription_id`, `pro_since`, `pro_expires_at`, `free_apps_used`
- Trigger `trg_increment_free_apps`: incrementa `free_apps_used` quando una candidatura esce da draft (non ko), solo per utenti Free
- Trigger `trg_decrement_on_ko`: decrementa `free_apps_used` quando una candidatura viene segnata come ko
- Migrazione grandfathering: `free_apps_used` impostato per utenti esistenti

### Edge Functions
- `create-checkout` — Crea sessione Stripe Checkout
- `check-subscription` — Verifica stato abbonamento, aggiorna profilo
- `customer-portal` — Sessione Stripe Billing Portal

### Frontend
- `useSubscription` hook — polling ogni 60s
- `useProGate` hook — gate basato su `profiles.free_apps_used` (lifetime counter)
- `/upgrade` page — value prop + CTA checkout
- Gate in Home, Nuova, AppShell FAB, StepCompleta
- Sezione Piano in Impostazioni
- Post-upgrade polling + toast benvenuto
- Server-side gate in `ai-tailor` (403 UPGRADE_REQUIRED, usa `free_apps_used`)
- Micro-banner Free in StepCompleta

### Edge case gestiti
- Eliminazione candidatura non resetta il contatore
- Bozze abbandonate non consumano la candidatura gratuita
- Candidatura in ko restituisce lo slot
- Utenti pre-esistenti grandfathered correttamente
- Soglia server allineata (`>= 1`)
