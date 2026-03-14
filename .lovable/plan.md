

# Piano di implementazione — Epic 07: Versō Pro

## Riepilogo

Implementare il sistema di abbonamento Versō Pro (€9.90/mese) con Stripe Checkout, limite 1 candidatura per utenti Free, pagina upgrade, e gestione piano nelle impostazioni.

**Stripe già configurato:**
- Prodotto: `prod_U9GMtzF9xUXuJD`
- Prezzo: `price_1TAxqBHrhFDiG0jqQeXXvMMu` (€9.90/mese ricorrente)
- Secret `STRIPE_SECRET_KEY` già presente

---

## Fase 1 — Database

**Migrazione:** aggiungere colonne a `profiles`:
```sql
ALTER TABLE profiles ADD COLUMN is_pro boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN stripe_subscription_id text;
ALTER TABLE profiles ADD COLUMN pro_since timestamptz;
ALTER TABLE profiles ADD COLUMN pro_expires_at timestamptz;
```

Le policy RLS esistenti su `profiles` proteggono già questi campi.

---

## Fase 2 — Edge Functions (3 nuove)

### `create-checkout` 
- Autentica utente via JWT
- Cerca/crea Stripe Customer per email
- Salva `stripe_customer_id` su profiles
- Crea Checkout Session (`mode: subscription`, price `price_1TAxqBHrhFDiG0jqQeXXvMMu`)
- `success_url` → `/app/home?upgrade=success`, `cancel_url` → `/upgrade`

### `check-subscription`
- Autentica utente, cerca customer Stripe per email
- Controlla subscription attiva
- Restituisce `{ subscribed, subscription_end }`
- Usata su login, page load, e polling post-checkout

### `customer-portal`
- Autentica utente, cerca `stripe_customer_id`
- Crea Billing Portal Session
- `return_url` → `/app/impostazioni`

> Niente webhook per ora (come da linee guida Stripe). Lo stato Pro viene verificato in tempo reale via `check-subscription`.

---

## Fase 3 — Frontend: Subscription Context

Nuovo hook `useSubscription` che:
- Chiama `check-subscription` al login e ogni 60s
- Espone `{ isPro, subscriptionEnd, loading, refresh }`
- Integrato nell'`AuthContext` o come context separato

---

## Fase 4 — Gate candidature

### Client-side (UX)
- Prima di navigare a `/app/nuova`: query `applications` con `status != 'ko'`
- Se count ≥ 1 e `isPro === false` → redirect a `/upgrade`
- Punti di gate: CTA dashboard, FAB mobile, sidebar, StepCompleta "Nuova candidatura"

### Server-side (ai-tailor)
- Aggiungere check: se utente non Pro e ha ≥ 1 candidatura attiva → 403 `UPGRADE_REQUIRED`
- Il frontend intercetta e fa redirect a `/upgrade`

---

## Fase 5 — Pagina `/upgrade`

Nuova pagina pubblica (protetta da auth) con:
- **Blocco 1:** riepilogo prima candidatura (azienda, ruolo, match score)
- **Blocco 2:** value proposition e limite Free
- **Blocco 3:** benefit Pro (€9.90/mese, candidature illimitate, tutti i template)
- **Blocco 4:** CTA "Passa a Versō Pro" → invoca `create-checkout` → redirect Stripe
- CTA secondaria "Resta con il piano Free" → torna a dashboard

Stile: layout centrato, spazioso, dark mode coerente con l'app.

---

## Fase 6 — Post-upgrade UX

- Rotta `/app/home?upgrade=success`: polling `check-subscription` (3 tentativi ogni 2s)
- Toast "Benvenuto in Versō Pro!"
- Badge "Versō Pro" nella StatsBar della dashboard (icona Crown)

---

## Fase 7 — Impostazioni → Piano

Sottosezione nella card Account:
- **Free:** "Piano: Free" + "Puoi creare 1 candidatura" + link "Scopri Versō Pro"
- **Pro:** "Piano: Versō Pro" + badge + date attivazione/rinnovo + "Gestisci abbonamento" (→ customer-portal)

---

## Fase 8 — Gate template

- Aggiornare `TEMPLATES` in `cv-templates/index.ts`: marcare template futuri come `free: false`
- Nel selettore template (StepExport): lucchetto su template Pro per utenti Free
- Click → toast con link a `/upgrade`

---

## Fase 9 — Micro-banner StepCompleta

Dopo le 3 card azione esistenti, aggiungere per utenti Free con ≥1 candidatura:
> "Hai usato la tua candidatura gratuita. La prossima volta, Versō Pro."

Tono discreto, nessun CTA aggressivo.

---

## Riepilogo file coinvolti

| Area | File |
|------|------|
| DB | Migrazione `profiles` |
| Edge Functions | `create-checkout/index.ts`, `check-subscription/index.ts`, `customer-portal/index.ts` |
| Config | `supabase/config.toml` (verify_jwt per nuove functions) |
| Context | Nuovo `src/hooks/useSubscription.ts` |
| Pages | Nuova `src/pages/Upgrade.tsx` |
| Routing | `src/App.tsx` (aggiunta rotta `/upgrade`) |
| Gate | `src/pages/Nuova.tsx`, `src/pages/Home.tsx`, `src/components/AppShell.tsx` |
| Wizard | `src/components/wizard/StepCompleta.tsx`, `src/components/wizard/StepExport.tsx` |
| Impostazioni | `src/pages/Impostazioni.tsx` |
| Templates | `src/components/cv-templates/index.ts` |
| Server gate | `supabase/functions/ai-tailor/index.ts` |

