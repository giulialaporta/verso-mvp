# Epic 07 — Versō Pro (Abbonamento)

> **Stato:** backlog — da sviluppare

---

## Obiettivo

Introdurre **Versō Pro**, un abbonamento mensile a **€9.90** che sblocca candidature illimitate. Gli utenti Free possono creare **1 sola candidatura**. Questo epic copre l'esperienza di abbonamento e un customer journey di upgrade progettato per convertire nel momento di massimo valore percepito.

---

## Contesto app attuale

- **Master CV** = il CV originale dell'utente, caricato in onboarding. Sempre 1 per utente. Non è toccato da questo epic.
- **Candidatura** = wizard `/app/nuova` che genera un **tailored CV** adattato a un'offerta specifica. Ogni candidatura crea 1 record in `applications` + 1 in `tailored_cvs`.
- **Il limite Free si applica alle candidature** (e quindi ai tailored CV), non al master CV.
- **Dashboard** (`/app/home`) ha 3 stati (epic-05): virgin, CV caricato, CV + candidature.
- **Impostazioni** (`/app/impostazioni`) ha sezioni: Account, Privacy e Dati, Assistenza, Sicurezza, Zona pericolosa (epic-08). La gestione del piano va dentro la card **Account** come sottosezione "Piano".

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
- Prezzo: **€9.90/mese**, ricorrente
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
| Candidature (tailored CV) | **1** | Illimitate |
| Template CV | Classico, Minimal | Tutti (inclusi futuri) |
| Export | PDF | PDF + DOCX (futuro) |
| Prezzo | Gratis | €9.90/mese |

> Il limite Free è **totale**, non mensile. L'utente Free può creare 1 sola candidatura con status diverso da `ko`. Se la candidatura viene rifiutata (`ko`), può crearne un'altra.

---

## Customer Journey di upgrade

L'upgrade funziona perché l'utente ha **già provato il valore** di Verso con la prima candidatura. Ha visto il pre-screening, il tailoring, lo score, l'export. Sa cosa fa l'app. Il momento in cui prova a creare la seconda candidatura è il punto di massima motivazione: ha un'altra offerta da inseguire e sa che Verso funziona.

### Fase 1 — Prima candidatura (esperienza completa, zero frizione)

L'utente Free attraversa l'intero wizard senza alcun limite:
- Upload CV → Parsing AI → Pre-screening → Tailoring → Review → Export PDF
- Nessun banner, nessun upsell, nessuna interruzione
- L'obiettivo è fargli **sperimentare tutto il valore** prima di chiedere qualcosa

### Fase 2 — Completamento prima candidatura (seed dell'upgrade)

Nello **Step 6 (Completa)** del wizard, dopo "Candidatura pronta!", aggiungere un elemento discreto:

- Sotto le 3 card azione esistenti ("Ho inviato", "La invierò dopo", "Nuova candidatura")
- **Micro-banner:** "Hai usato la tua candidatura gratuita. La prossima volta, Versō Pro." — nessun CTA aggressivo, solo consapevolezza
- Tono: informativo, non pressante

### Fase 3 — Tentativo seconda candidatura (gate + upgrade page)

Quando l'utente clicca "Nuova candidatura" (dashboard, nav, o step 6):

1. Il frontend verifica: `count(applications WHERE status != 'ko') >= 1` AND `is_pro = false`
2. **Non apre il wizard.** Mostra invece un **upgrade interstitial** a pagina intera (`/upgrade`)

### Fase 4 — Pagina upgrade (`/upgrade`)

Pagina dedicata, non un modal. L'utente deve sentire che sta prendendo una decisione, non che è bloccato da un paywall.

**Struttura:**

**Blocco 1 — Riconoscimento del risultato:**
- "La tua prima candidatura è pronta" + riepilogo (azienda, ruolo, match score dalla candidatura esistente)
- Rinforza il valore: "Hai già visto cosa può fare Verso."

**Blocco 2 — Il problema:**
- "Ogni candidatura merita lo stesso livello di preparazione."
- "Con il piano Free, puoi creare 1 solo CV adattato."

**Blocco 3 — La soluzione:**
- **"Versō Pro — €9.90/mese"**
- Benefit chiari:
  - Candidature illimitate — un CV personalizzato per ogni opportunità
  - Tutti i template CV (inclusi i futuri)
  - Cancella quando vuoi
- Eventuali benefit futuri in grigio/muted: "In arrivo: export DOCX, template premium"

**Blocco 4 — CTA:**
- CTA primaria: **"Passa a Versō Pro"** → Stripe Checkout
- CTA secondaria (testo piccolo): "Resta con il piano Free" → torna alla dashboard

**Se l'utente non è loggato:** redirect a `/login?redirect=/upgrade`.
**Se l'utente è già Pro:** redirect a `/app/nuova` (non dovrebbe mai arrivare qui, ma safety net).

**Stile:** dark mode, layout centrato, accent per CTA. Spazioso, non claustrofobico. L'utente deve poter chiudere o tornare indietro senza sentirsi intrappolato.

### Fase 5 — Post-pagamento (conferma immediata)

1. Stripe Checkout completo → redirect a `/app/home?upgrade=success`
2. Dashboard mostra **badge "Versō Pro"** (vedi sotto)
3. Toast: "Benvenuto in Versō Pro! Ora puoi creare candidature illimitate."
4. Il pulsante "Nuova candidatura" funziona normalmente

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

**Dove si applica:** quando l'utente clicca "Nuova candidatura" (CTA su dashboard, pulsante `+` nella nav, o card "Nuova candidatura" nello step 6).

**Logica:**
1. Query: `SELECT count(*) FROM applications WHERE user_id = :uid AND status != 'ko'`
2. Se count ≥ 1 AND `profiles.is_pro = false` → redirect a `/upgrade`
3. Se count < 1 OR `profiles.is_pro = true` → procedi normalmente a `/app/nuova`

**Enforcement lato server (Edge Function `ai-tailor`):**
- Prima di eseguire il tailoring, verifica: utente Pro? Oppure candidature attive < 1?
- Se limite superato → risponde `{ error: 'UPGRADE_REQUIRED' }` con status 403
- Il frontend intercetta e fa redirect a `/upgrade`

> **Importante:** il check lato frontend è per UX (evitare di entrare nel wizard per niente). Il blocco vero è lato server.

---

### 2. Badge "Versō Pro"

**Dove:** Dashboard (`/app/home`), nella StatsBar o accanto al saluto "Ciao [Nome]".

**Quando:** `is_pro = true`.

**Contenuto:** badge compatto con testo "Versō Pro" e icona (es. `Crown` o `Star`), sfondo accent o bordo accent.

**Scopo:** conferma visiva che l'abbonamento è attivo. L'utente sa che non ha limiti.

---

### 3. Gestione piano in Impostazioni

Sottosezione dentro la card **"Account"** in `/app/impostazioni`, subito dopo le info utente (email, nome).

**Utente Free:**
- Label: "Piano: Free"
- Testo: "Puoi creare 1 candidatura."
- Link: "Scopri Versō Pro" → `/upgrade`

**Utente Pro:**
- Label: "Piano: Versō Pro" con badge accent
- Data attivazione: "Attivo dal [pro_since formattata]"
- Data rinnovo: "Si rinnova il [pro_expires_at formattata]"
- Link: "Gestisci abbonamento" → apre Stripe Customer Portal

---

### 4. Gate template

- **Free:** solo "Classico" e "Minimal"
- **Pro:** tutti i template (inclusi quelli aggiunti in futuro)
- Gate nel selettore template (wizard step 5 — Export): template Pro mostrano icona lucchetto e tooltip "Disponibile con Versō Pro"
- Click su template bloccato → toast con link a `/upgrade`

---

### 5. Edge Function `create-checkout-session`

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
   - `cancel_url`: `https://<app-url>/upgrade`
   - `metadata`: `{ supabase_user_id: user_id }`
7. Restituisce `{ url: session.url }`

**Dipendenza:** `stripe` (npm package) — importare con `import Stripe from 'https://esm.sh/stripe@14'` nelle Edge Functions Supabase.

---

### 6. Edge Function `stripe-webhook`

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

### 7. Edge Function `create-portal-session`

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

1. Utente Free completa la prima candidatura → vede micro-banner "Hai usato la tua candidatura gratuita"
2. Torna alla dashboard, clicca "Nuova candidatura"
3. Redirect a `/upgrade` — vede riepilogo prima candidatura + value proposition Pro
4. Clicca "Passa a Versō Pro" → redirect a Stripe Checkout
5. Paga → Stripe invia webhook `checkout.session.completed`
6. DB aggiornato: `is_pro = true`
7. Redirect a `/app/home?upgrade=success`
8. Dashboard: badge "Versō Pro" visibile, toast di benvenuto
9. Clicca "Nuova candidatura" → wizard si apre normalmente

### Cancellazione

1. Utente Pro → Impostazioni → Account → Piano → "Gestisci abbonamento"
2. Redirect a Stripe Customer Portal → cancella
3. Stripe invia webhook `customer.subscription.deleted` a fine periodo pagato
4. DB: `is_pro = false`
5. L'utente mantiene accesso Pro fino a `pro_expires_at`
6. Dopo scadenza → limite 1 candidatura riattivato
7. Le candidature esistenti restano accessibili (consultabili, non cancellate)

### Utente torna dopo la cancellazione

1. Ha 8 candidature create quando era Pro
2. Ora è Free con `is_pro = false`
3. Può vedere e consultare tutte le 8 candidature
4. Non può crearne di nuove (ha più di 1 attiva)
5. Se archivia candidature fino ad averne 0 attive (tutte `ko`), può crearne 1 nuova
6. Pagina `/upgrade` accessibile per ri-abbonarsi

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
| Utente non loggato visita `/upgrade` | Redirect a `/login?redirect=/upgrade` |
| Utente già Pro visita `/upgrade` | Redirect a `/app/nuova` |
| Utente Pro clicca "Nuova candidatura" | Wizard si apre normalmente |
| Webhook arriva prima del redirect | Nessun problema — DB già aggiornato |
| Webhook arriva dopo il redirect | Polling breve: 3 tentativi ogni 2s su `/app/home?upgrade=success`, query `profiles.is_pro` fino a `true` |
| Utente Free con 1 candidatura in `ko` | Non conta — può creare una nuova candidatura (count esclude `ko`) |
| Utente cancella e ri-sottoscrive | Funziona: `create-checkout-session` crea nuova subscription, webhook aggiorna `is_pro = true` |
| Candidatura in stato `draft` | Conta nel limite — una draft è una candidatura iniziata |
| Edge Function `ai-tailor` chiamata senza Pro | Risponde 403 `UPGRADE_REQUIRED` se limite superato |
| Template Pro selezionato da utente Free | Toast "Disponibile con Versō Pro" + link a `/upgrade` |
| Utente Free clicca "Nuova candidatura" da step 6 | Stesso gate: redirect a `/upgrade` se ha già 1 candidatura attiva |

---

## Criteri di accettazione

- [ ] Utente Free può creare 1 sola candidatura (check client + server)
- [ ] Prima candidatura: esperienza completa senza interruzioni o upsell
- [ ] Step 6 (Completa): micro-banner informativo "Hai usato la tua candidatura gratuita"
- [ ] Seconda candidatura: redirect a `/upgrade` invece di aprire il wizard
- [ ] Pagina `/upgrade` mostra riepilogo prima candidatura + value proposition + CTA Stripe
- [ ] CTA su `/upgrade` avvia Stripe Checkout e completa il pagamento
- [ ] Dopo il pagamento, redirect alla dashboard con badge "Versō Pro" e toast
- [ ] Webhook aggiorna `is_pro` su `profiles`
- [ ] Badge "Versō Pro" visibile su dashboard per utenti Pro
- [ ] Impostazioni → Account → Piano mostra stato piano corrente
- [ ] Utente Pro vede date attivazione/rinnovo e link "Gestisci abbonamento"
- [ ] "Gestisci abbonamento" apre Stripe Customer Portal
- [ ] Candidature esistenti restano accessibili dopo downgrade a Free
- [ ] Edge Function `ai-tailor` blocca tailoring se limite superato e utente non Pro
- [ ] Template Pro mostrano lucchetto per utenti Free
- [ ] Nessun dato di pagamento salvato nel DB di Verso
