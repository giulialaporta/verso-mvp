# Epic 07 — Versō Pro (Implementato)

---

## Cosa è stato costruito

Sistema di abbonamento premium con Stripe: limite 1 candidatura per utenti Free, upgrade flow, gestione piano, cancellazione in-app. Approccio polling-based (no webhook).

> **Differenza dal piano backlog:** il piano prevedeva un webhook Stripe per aggiornare lo stato. Implementato un approccio polling con `check-subscription` che interroga Stripe direttamente. Aggiunta edge function `cancel-subscription` per cancellazione in-app (non solo via Stripe Portal). Aggiunta pagina FAQ. Counter `free_apps_used` con trigger DB invece di count dinamico.

---

## Modello

| | Free | Versō Pro |
|--|------|-----------|
| Candidature (tailored CV) | **1** | Illimitate |
| Template CV | Classico, Minimal | Tutti (inclusi futuri) |
| Export | PDF | PDF + DOCX (futuro) |
| Prezzo | Gratis | €9.90/mese |

> Il limite Free è **lifetime**, non mensile. L'utente Free può creare 1 sola candidatura con status diverso da `ko` e `draft`. Se la candidatura viene rifiutata (`ko`), il counter si decrementa e può crearne un'altra.

---

## Schema DB

### Colonne aggiunte a `profiles`

```sql
ALTER TABLE profiles ADD COLUMN is_pro boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN stripe_subscription_id text;
ALTER TABLE profiles ADD COLUMN pro_since timestamptz;
ALTER TABLE profiles ADD COLUMN pro_expires_at timestamptz;
ALTER TABLE profiles ADD COLUMN free_apps_used integer DEFAULT 0;
```

### Trigger `free_apps_used`

Due trigger sulla tabella `applications`:

1. **`trg_increment_free_apps`** — `AFTER UPDATE`: quando `status` cambia da `draft` a qualsiasi altro valore (escluso `ko`), incrementa `free_apps_used` di 1 per utenti non-Pro.
2. **`trg_decrement_on_ko`** — `AFTER UPDATE`: quando `status` cambia a `ko`, decrementa `free_apps_used` di 1 (minimo 0) per utenti non-Pro.

**Grandfathering:** migrazione che aggiorna `free_apps_used` per utenti esistenti contando le candidature con status diverso da `ko` e `draft`.

---

## Edge Functions (4 nuove)

### 1. `create-checkout`

**Endpoint:** `POST /functions/v1/create-checkout`

**Processo:**
1. Verifica Bearer token → estrai utente (email + id)
2. Cerca Stripe Customer per email — se non esiste, lo crea con `metadata.supabase_user_id`
3. Salva `stripe_customer_id` su `profiles`
4. Se esiste già una subscription attiva → restituisce `{ already_subscribed: true }` (200, idempotente)
5. Crea Stripe Checkout Session (mode: subscription)
6. Restituisce `{ url: session.url }`

**Price ID:** hardcoded come costante `PRICE_ID` nel codice.

**URLs:**
- `success_url`: `{origin}/app/home?upgrade=success`
- `cancel_url`: `{origin}/upgrade`

---

### 2. `check-subscription`

**Endpoint:** `POST /functions/v1/check-subscription`

**Processo:**
1. Verifica Bearer token → utente
2. Se no auth o token invalido → risponde `{ subscribed: false }` (graceful, no 401)
3. Cerca Stripe Customer per email
4. Se non trovato → aggiorna `profiles` (`is_pro: false`) → risponde `{ subscribed: false }`
5. Cerca subscription attiva per il customer
6. Se trovata → aggiorna `profiles` (`is_pro: true`, `stripe_customer_id`, `stripe_subscription_id`, `pro_since`, `pro_expires_at`)
7. Se non trovata → aggiorna `profiles` (`is_pro: false`, clear subscription fields)
8. Risponde `{ subscribed, subscription_end, cancel_at_period_end }`

**Nota:** questa funzione è il sostituto del webhook. Viene chiamata dal frontend via polling.

---

### 3. `cancel-subscription`

**Endpoint:** `POST /functions/v1/cancel-subscription`

**Processo:**
1. Verifica Bearer token → utente
2. Legge `stripe_subscription_id` da `profiles`
3. Se non presente → 400 "No active subscription found"
4. Chiama `stripe.subscriptions.update` con `cancel_at_period_end: true`
5. Risponde `{ canceled: true, cancel_at: ISO_date }`

**Nota:** cancellazione soft — l'utente mantiene l'accesso fino a fine periodo.

---

### 4. `customer-portal`

**Endpoint:** `POST /functions/v1/customer-portal`

**Processo:**
1. Verifica Bearer token → utente
2. Legge `stripe_customer_id` da `profiles`
3. Se non presente → 400
4. Crea Stripe Billing Portal Session con `return_url` → `/app/impostazioni`
5. Risponde `{ url: session.url }`

---

## Hook React

### `useSubscription`

- Chiama `check-subscription` al mount, ogni 60 secondi, e al tab focus (`visibilitychange`)
- Restituisce `{ isPro, subscriptionEnd, cancelAtPeriodEnd, loading }`
- Usato da Home, Impostazioni, e per il pro gate

### `useProGate`

- Legge `profiles.free_apps_used` da Supabase
- Se `free_apps_used >= 1` e `is_pro = false` → redirect a `/upgrade`
- Gate client-side per la CTA "Nuova candidatura"

---

## Pagina Upgrade (`/upgrade`)

Route protetta, fuori dall'AppShell (pagina a sé).

**Struttura:**

1. **Riepilogo prima candidatura:** mostra azienda, ruolo, match score dalla candidatura esistente
2. **Card Pro benefits:** "Versō Pro — €9.90/mese" con lista benefit (candidature illimitate, tutti i template, cancella quando vuoi)
3. **CTA primaria:** "Passa a Versō Pro" → chiama `create-checkout` → redirect a Stripe Checkout
4. **CTA secondaria:** "Resta con il piano Free" → torna alla dashboard
5. **Già iscritto:** se `already_subscribed: true` da create-checkout, mostra messaggio e redirect

**Stile:** dark mode, layout centrato, accent per CTA.

---

## Customer Journey (implementato)

### Fase 1 — Prima candidatura
L'utente Free completa l'intero wizard senza limiti o interruzioni.

### Fase 2 — Completamento (seed)
In `StepCompleta` (step 6 wizard), dopo le card azione: micro-banner "Hai usato la tua candidatura gratuita. La prossima volta, Versō Pro." — solo per utenti Free.

### Fase 3 — Gate
Click "Nuova candidatura" → `useProGate` verifica `free_apps_used >= 1` AND `is_pro = false` → redirect a `/upgrade`.

### Fase 4 — Upgrade page
Pagina `/upgrade` con riepilogo + value proposition + CTA Stripe.

### Fase 5 — Post-pagamento
Redirect a `/app/home?upgrade=success` → polling `check-subscription` fino a `is_pro = true` → toast "Benvenuto in Versō Pro!".

---

## Dashboard — PlanCard

Componente `PlanCard` nella dashboard (`/app/home`), mostra 3 stati:

| Stato | Contenuto |
|-------|-----------|
| **Free** | "Piano Free" — info limite candidature |
| **Pro** | "Versō Pro" con badge — data rinnovo |
| **Pro (in scadenza)** | "Versō Pro" — "Scade il [data]", suggerimento rinnovo |

---

## Impostazioni — Sezione Piano

Nella pagina `/app/impostazioni`, nuova sezione "Piano" nella card Account:

**Utente Free:**
- Label: "Piano: Free"
- Link "Scopri Versō Pro" → `/upgrade`

**Utente Pro:**
- Label: "Piano: Versō Pro" con badge
- Data rinnovo/scadenza
- "Gestisci fatturazione" → Stripe Customer Portal (`customer-portal`)
- "Cancella abbonamento" → dialog di conferma → chiama `cancel-subscription`

**Utente Pro in scadenza (cancel_at_period_end):**
- Mostra data di scadenza
- Messaggio che l'accesso Pro resta attivo fino alla scadenza

---

## Server-side gate (ai-tailor)

Prima di eseguire il tailoring, `ai-tailor` verifica:
1. Legge `profiles` → `is_pro` e `free_apps_used`
2. Se `is_pro = false` AND `free_apps_used >= 1` → risponde 403 `{ error: "UPGRADE_REQUIRED" }`
3. Il frontend intercetta il 403 e fa redirect a `/upgrade`

---

## Pagina Guida & FAQ (`/app/faq`)

Nuova pagina accessibile dalla sidebar (voce "Guida", icona `Question`) e dalla sezione Assistenza in Impostazioni.

Titolo: "Guida & FAQ". 4 sezioni accordion:

1. **ATS** — domande su sistemi ATS
2. **Filosofia Verso** — come funziona, perché (voce in prima persona singolare)
3. **Consigli d'uso** — best practice
4. **Dati e Privacy** — gestione dati, GDPR

Route: `/app/faq` — dentro AppShell.

---

## Componenti chiave

| Componente | Scopo |
|------------|-------|
| `PlanCard` | Card piano nella dashboard (Free/Pro/Expiring) |
| `useSubscription` | Hook polling stato abbonamento |
| `useProGate` | Hook gate candidature per utenti Free |
| `Upgrade.tsx` | Pagina upgrade con CTA Stripe |
| `Faq.tsx` | Pagina FAQ con accordion |
| `StepCompleta` micro-banner | Banner "Hai usato la tua candidatura gratuita" |

---

## Cosa NON è stato implementato (rispetto al backlog)

| Feature | Stato |
|---------|-------|
| `stripe-webhook` edge function | Non implementato — usa polling con `check-subscription` |
| Gate template (lucchetto su template Pro) | Non implementato — solo 2 template free |
| Export DOCX per Pro | Non implementato |
| Template Pro aggiuntivi | Non implementato |
