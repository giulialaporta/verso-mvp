# Epic 07 — Versō Pro (Abbonamento)

> **Stato:** backlog — da sviluppare

---

## Obiettivo

Introdurre **Versō Pro**, un abbonamento mensile a €9.99 che sblocca candidature illimitate. Gli utenti Free possono creare **1 sola candidatura** (= 1 tailored CV). Questo epic copre l'esperienza di abbonamento, non la logica dei contenuti premium futuri.

---

## Contesto app attuale

Per capire dove si inserisce questa feature:

- **Master CV** = il CV originale dell'utente, caricato in onboarding. Sempre 1 per utente. Non è toccato da questo epic.
- **Candidatura** = wizard `/app/nuova` che genera un **tailored CV** adattato a un'offerta specifica. Ogni candidatura crea 1 record in `applications` + 1 in `tailored_cvs`.
- **Il limite Free si applica alle candidature** (e quindi ai tailored CV), non al master CV.
- **Dashboard** (`/app/home`) ha 3 stati (epic-05): virgin, CV caricato, CV + candidature. Il banner Pro appare nello stato 3.
- **Impostazioni** (`/app/impostazioni`) ha sezioni: Account, Privacy e Dati, Assistenza, Sicurezza, Zona pericolosa (epic-08).

---

## Setup Stripe (prerequisiti)

Prima di sviluppare, serve configurare Stripe. Questi step sono manuali, non li fa Lovable.

### 1. Creare account Stripe

- Vai su [dashboard.stripe.com](https://dashboard.stripe.com) e crea un account
- Completa la verifica (dati aziendali/personali, IBAN per i pagamenti)
- Resta in **modalità Test** durante lo sviluppo (toggle in alto a destra)

### 2. Creare il prodotto e il prezzo

- Dashboard Stripe → Prodotti → "+ Aggiungi prodotto"
- Nome: "Versō Pro"
- Prezzo: €9.99/mese, ricorrente
- Copia il `price_id` (inizia con `price_...`) — serve nella Edge Function

### 3. Configurare il webhook

- Dashboard Stripe → Sviluppatori → Webhook → "+ Aggiungi endpoint"
- URL: `https://<tuo-progetto>.supabase.co/functions/v1/stripe-webhook`
- Eventi da ascoltare:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- Copia il **Webhook Signing Secret** (`whsec_...`) — serve nella Edge Function

### 4. Salvare i secret in Supabase

- Dashboard Supabase → Impostazioni → Edge Functions → Secrets
- Aggiungi:
  - `STRIPE_SECRET_KEY` = `sk_test_...` (da Stripe → Sviluppatori → Chiavi API)
  - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (dal webhook creato sopra)
  - `STRIPE_PRICE_ID` = `price_...` (dal prodotto creato sopra)

### 5. Quando vai in produzione

- Disattiva la modalità Test su Stripe
- Ricrea prodotto/prezzo in modalità Live
- Aggiorna i 3 secret su Supabase con le chiavi Live
- Aggiorna l'URL del webhook con quello di produzione

---

## Modello

| | Free | Versō Pro |
|--|------|-----------|
| Candidature (tailored CV) | 1 | Illimitate |
| Prezzo | Gratis | €9.99/mese |

> Il conteggio candidature include quelle con status diverso da `ko`. Le candidature rifiutate non contano ai fini del limite.

---

## Schema DB

Aggiungere colonne a `profiles` (migrazione):

```sql
ALTER TABLE profiles ADD COLUMN is_pro boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN stripe_subscription_id text;
ALTER TABLE profiles ADD COLUMN pro_since timestamptz;
ALTER TABLE profiles ADD COLUMN pro_expires_at timestamptz;
```

> **Perché su `profiles` e non una tabella separata:** l'app ha un solo piano (Free vs Pro). Una tabella `subscriptions` separata ha senso solo con piani multipli. Per ora, campi su `profiles` è la scelta più semplice e coerente con lo schema esistente.

**RLS:** questi campi sono già protetti dalla policy esistente su `profiles` (`auth.uid() = id`). Nessuna policy aggiuntiva necessaria.

---

## Comportamento

### 1. Limite candidature per utenti Free

**Dove si applica:** quando l'utente clicca "Nuova candidatura" (CTA su dashboard o pulsante `+` nella nav).

**Logica:**
1. Query: `SELECT count(*) FROM applications WHERE user_id = :uid AND status != 'ko'`
2. Se count ≥ 1 AND `profiles.is_pro = false` → **non aprire il wizard**, mostra il banner Pro
3. Se count < 1 OR `profiles.is_pro = true` → procedi normalmente a `/app/nuova`

**Enforcement lato server (Edge Function `ai-tailor`):**
- Prima di eseguire il tailoring, verifica: utente Pro? Oppure candidature attive < 1?
- Se limite superato → risponde `{ error: 'UPGRADE_REQUIRED' }` con status 403
- Il frontend intercetta e mostra il banner

> **Importante:** il check lato frontend è per UX (evitare di entrare nel wizard per niente). Il blocco vero è lato server.

---

### 2. Banner promozionale

**Dove:** Dashboard (`/app/home`), visibile nello stato 3 (CV + candidature presenti). Appare **sopra** la sezione "Candidature recenti".

**Quando appare:**
- `is_pro = false` AND l'utente ha già 1 candidatura attiva (status ≠ `ko`)

**Contenuto:**
- Icona (es. `Star` o `RocketLaunch` da Phosphor)
- Titolo: "Sblocca candidature illimitate"
- Sottotitolo: "Con Versō Pro crei CV personalizzati per ogni opportunità. €9.99/mese."
- CTA: "Scopri Versō Pro" → redirect a `/pro`

**Quando NON appare:**
- Utente è Pro → al suo posto, badge "Versō Pro" (vedi punto 4)
- Utente non ha ancora candidature → non serve, non ha raggiunto il limite
- Utente ha 1 candidatura ma è in stato `ko` → non conta, può crearne un'altra

**Stile:** coerente col brand system — sfondo `surface` (`#141518`), bordo accent (`#A8FF78`), CTA accent. Non deve sembrare un annuncio invadente.

---

### 3. Pagina Versō Pro (`/pro`)

**Route:** `/pro` — pagina pubblica (accessibile anche senza login, ma la CTA richiede login).

**Layout:**
- Headline: "Versō Pro"
- Value proposition: 2-3 punti chiari
  - CV personalizzato per ogni candidatura
  - Nessun limite al numero di candidature
  - Supporto prioritario (o altro benefit percepito)
- Prezzo: "€9.99/mese" ben visibile
- CTA: "Abbonati" → chiama Edge Function `create-checkout-session`, redirect a Stripe Checkout
- Se utente non loggato → CTA porta a `/login` prima, poi torna a `/pro`
- Se utente già Pro → messaggio "Sei già Versō Pro!" + badge, nessuna CTA di acquisto

**Stile:** dark mode, accent per CTA e highlight, coerente con brand system.

---

### 4. Badge "Versō Pro"

**Dove:** Dashboard (`/app/home`), nello stesso punto dove apparirebbe il banner.

**Quando:** `is_pro = true`.

**Contenuto:** badge compatto con testo "Versō Pro" e icona (es. `Crown` o `Star`), sfondo accent o bordo accent.

**Scopo:** conferma visiva che l'abbonamento è attivo. L'utente sa che non ha limiti.

---

### 5. Sezione abbonamento in Impostazioni

Aggiungere una nuova sezione in `/app/impostazioni`, **tra "Account" e "Privacy e Dati"**.

**Utente Free:**
- Label: "Piano: Free"
- Testo: "Puoi creare 1 candidatura."
- Link: "Scopri Versō Pro" → `/pro`

**Utente Pro:**
- Label: "Piano: Versō Pro" con badge accent
- Data rinnovo: "Si rinnova il [pro_expires_at formattata]"
- Data attivazione: "Attivo dal [pro_since formattata]"
- Link: "Gestisci abbonamento" → apre Stripe Customer Portal (vedi Edge Function sotto)

---

### 6. Edge Function `create-checkout-session`

**Endpoint:** `POST /functions/v1/create-checkout-session`

**Input:** nessun body — `user_id` estratto dal JWT Supabase nell'header `Authorization`.

**Behavior:**
1. Verifica JWT → estrai `user_id`
2. Query `profiles` per `user_id` → prendi email e `stripe_customer_id`
3. Se `is_pro = true` → 400 `{ error: 'Hai già un abbonamento attivo' }`
4. Se `stripe_customer_id` è null → crea Stripe Customer con email e `metadata.supabase_user_id`
5. Salva `stripe_customer_id` su `profiles`
6. Crea Stripe Checkout Session:
   - `customer`: lo stripe_customer_id
   - `mode`: `'subscription'`
   - `line_items`: `[{ price: STRIPE_PRICE_ID, quantity: 1 }]`
   - `success_url`: `https://<app-url>/app/home?upgrade=success`
   - `cancel_url`: `https://<app-url>/pro`
   - `metadata`: `{ supabase_user_id: user_id }`
7. Restituisce `{ url: session.url }`

**Dipendenza:** `stripe` (npm package) — importare con `import Stripe from 'https://esm.sh/stripe@14'` nelle Edge Functions Supabase.

---

### 7. Edge Function `stripe-webhook`

**Endpoint:** `POST /functions/v1/stripe-webhook`

**Sicurezza:** verifica firma con `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`. Se la firma non è valida → 400.

**Eventi gestiti:**

| Evento | Cosa fare |
|--------|-----------|
| `checkout.session.completed` | Estrarre `supabase_user_id` da `metadata`. Estrarre `subscription` dall'evento. Aggiornare `profiles`: `is_pro = true`, `stripe_subscription_id`, `pro_since = now()`, `pro_expires_at = subscription.current_period_end` |
| `customer.subscription.updated` | Aggiornare `pro_expires_at` con il nuovo `current_period_end` |
| `customer.subscription.deleted` | Aggiornare: `is_pro = false`, `pro_expires_at = null` |
| `invoice.payment_failed` | Opzionale: loggare l'evento. Stripe gestisce i retry automaticamente (fino a 4 tentativi in ~3 settimane). Non serve bloccare l'utente subito — `subscription.deleted` arriverà se tutti i retry falliscono |

**Nota su `invoice.payment_failed`:** non complicare il flusso con stati intermedi (`past_due`). Stripe gestisce i retry. Quando il pagamento fallisce definitivamente, Stripe invia `customer.subscription.deleted` e il webhook imposta `is_pro = false`. L'utente perde l'accesso Pro solo a quel punto.

---

### 8. Edge Function `create-portal-session`

Per permettere all'utente Pro di gestire il suo abbonamento (cancellare, aggiornare carta).

**Endpoint:** `POST /functions/v1/create-portal-session`

**Behavior:**
1. Verifica JWT → `user_id`
2. Query `profiles` → `stripe_customer_id`
3. Se null → 400 "Nessun abbonamento trovato"
4. Crea Stripe Billing Portal Session con `return_url` = `/app/impostazioni`
5. Restituisce `{ url: session.url }`

> **Nota:** il Customer Portal di Stripe va attivato nella dashboard Stripe → Impostazioni → Customer Portal. Attivare: cancellazione abbonamento e aggiornamento metodo di pagamento.

---

## Flussi

### Happy path — Upgrade

1. Utente Free ha 1 candidatura attiva
2. Clicca "Nuova candidatura" sulla dashboard
3. Vede il banner "Sblocca candidature illimitate" (il wizard non si apre)
4. Clicca "Scopri Versō Pro" → atterra su `/pro`
5. Clicca "Abbonati" → redirect a Stripe Checkout
6. Paga → Stripe invia webhook `checkout.session.completed`
7. DB aggiornato: `is_pro = true`
8. Redirect a `/app/home?upgrade=success`
9. Dashboard: banner scomparso, badge "Versō Pro" visibile
10. Utente clicca "Nuova candidatura" → wizard si apre normalmente

### Cancellazione

1. Utente Pro → Impostazioni → "Gestisci abbonamento"
2. Redirect a Stripe Customer Portal → cancella
3. Stripe invia webhook `customer.subscription.deleted` a fine periodo pagato
4. DB: `is_pro = false`
5. L'utente mantiene accesso Pro fino a `pro_expires_at`
6. Dopo scadenza → limite 1 candidatura riattivato
7. Le candidature esistenti restano accessibili (consultabili, non cancellate)

### Utente torna dopo la cancellazione

1. Ha 5 candidature create quando era Pro
2. Ora è Free con `is_pro = false`
3. Può vedere e consultare tutte le 5 candidature
4. Non può crearne di nuove (ha più di 1 attiva)
5. Se archivia candidature fino ad averne 0 attive (tutte `ko`), può crearne 1 nuova
6. Banner Pro visibile per invitarlo a ri-abbonarsi

### Pagamento fallito

1. Stripe tenta il rinnovo → carta rifiutata
2. Stripe ritenta automaticamente (fino a 4 volte in ~3 settimane)
3. Se un retry ha successo → `subscription.updated`, tutto OK
4. Se tutti falliscono → `subscription.deleted` → `is_pro = false`
5. L'utente perde l'accesso Pro

---

## Edge case

| Caso | Comportamento |
|------|---------------|
| Utente non loggato visita `/pro` | Vede la pagina, CTA porta a `/login?redirect=/pro` |
| Utente già Pro visita `/pro` | Messaggio "Sei già Versō Pro!", nessuna CTA acquisto |
| Utente Pro clicca "Nuova candidatura" | Wizard si apre normalmente, nessun banner |
| Webhook arriva prima del redirect | Nessun problema — DB già aggiornato quando l'utente atterra sulla dashboard |
| Webhook arriva dopo il redirect | L'utente vede la dashboard senza badge; implementare polling breve: 3 tentativi ogni 2s su `/app/home?upgrade=success`, query `profiles.is_pro` fino a `true` |
| Utente Free con 1 candidatura in `ko` | Non conta — può creare una nuova candidatura (count esclude `ko`) |
| Utente cancella e ri-sottoscrive | Funziona normalmente: `create-checkout-session` crea nuova subscription, webhook aggiorna `is_pro = true` |
| Candidatura in stato `draft` | Conta nel limite — una draft è una candidatura iniziata |
| Edge Function `ai-tailor` chiamata senza Pro | Risponde 403 `UPGRADE_REQUIRED` se limite superato |

---

## Criteri di accettazione

- [ ] Utente Free può creare 1 sola candidatura (check client + server)
- [ ] Banner Pro appare sulla dashboard quando Free ha 1 candidatura attiva e tenta di crearne un'altra
- [ ] Banner non appare se utente è Pro
- [ ] Badge "Versō Pro" visibile su dashboard per utenti Pro
- [ ] Pagina `/pro` mostra benefici, prezzo e CTA
- [ ] CTA su `/pro` avvia Stripe Checkout e completa il pagamento
- [ ] Dopo il pagamento, utente è reindirizzato alla dashboard con badge Pro
- [ ] Webhook aggiorna `is_pro` su `profiles`
- [ ] Impostazioni mostra stato piano e data rinnovo per utenti Pro
- [ ] "Gestisci abbonamento" apre Stripe Customer Portal
- [ ] Candidature esistenti restano accessibili dopo downgrade a Free
- [ ] Edge Function `ai-tailor` blocca tailoring se limite superato e utente non Pro
