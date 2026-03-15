# Check — Versō Pro: Acceptance Criteria

**Ultimo test:** -

---

## A. Limite candidature Free

- [ ] **A1** — Utente Free: prima candidatura completa senza limiti o interruzioni
- [ ] **A2** — Utente Free con 1 candidatura attiva: click "Nuova candidatura" → redirect a `/upgrade`
- [ ] **A3** — Gate attivo su tutti i punti di ingresso: CTA dashboard, nav `+`, card "Nuova candidatura" in step 6
- [ ] **A4** — Utente Free con candidatura in `ko`: può crearne una nuova (counter decrementato)
- [ ] **A5** — Utente Pro: nessun limite, wizard si apre normalmente
- [ ] **A6** — Server-side: `ai-tailor` risponde 403 `UPGRADE_REQUIRED` se Free + `free_apps_used >= 1`
- [ ] **A7** — Frontend intercetta 403 e fa redirect a `/upgrade`

---

## B. Counter `free_apps_used`

- [ ] **B1** — Colonna `free_apps_used` esiste in `profiles` con default 0
- [ ] **B2** — Trigger incrementa quando candidatura esce da `draft` (non ko) per utenti non-Pro
- [ ] **B3** — Trigger decrementa quando candidatura va in `ko` per utenti non-Pro
- [ ] **B4** — Counter non scende sotto 0 (GREATEST)
- [ ] **B5** — Utenti Pro: trigger non modifica `free_apps_used`

---

## C. Pagina Upgrade

- [ ] **C1** — Route `/upgrade` accessibile (protetta: richiede login)
- [ ] **C2** — Mostra riepilogo prima candidatura (azienda, ruolo, score)
- [ ] **C3** — Card Pro benefits con prezzo €9.90/mese
- [ ] **C4** — CTA "Passa a Versō Pro" → chiama `create-checkout` → redirect a Stripe Checkout
- [ ] **C5** — CTA "Resta con il piano Free" → torna alla dashboard
- [ ] **C6** — Utente già Pro: redirect a `/app/nuova`
- [ ] **C7** — Utente non loggato: redirect a `/login`

---

## D. Stripe Checkout (create-checkout)

- [ ] **D1** — Endpoint `POST /functions/v1/create-checkout` risponde correttamente
- [ ] **D2** — Richiede autenticazione (senza token: 401)
- [ ] **D3** — Crea Stripe Customer se non esiste (con email + metadata)
- [ ] **D4** — Salva `stripe_customer_id` su `profiles`
- [ ] **D5** — Se subscription già attiva → risponde `{ already_subscribed: true }` (200)
- [ ] **D6** — Crea Checkout Session → restituisce `{ url }`
- [ ] **D7** — success_url punta a `/app/home?upgrade=success`
- [ ] **D8** — cancel_url punta a `/upgrade`

---

## E. Check Subscription (polling)

- [ ] **E1** — Endpoint `POST /functions/v1/check-subscription` risponde correttamente
- [ ] **E2** — Senza auth → risponde `{ subscribed: false }` (non 401)
- [ ] **E3** — Token invalido → risponde `{ subscribed: false }` (graceful)
- [ ] **E4** — Utente senza Stripe Customer → `is_pro: false` su profiles
- [ ] **E5** — Utente con subscription attiva → aggiorna `is_pro: true`, `stripe_subscription_id`, `pro_since`, `pro_expires_at`
- [ ] **E6** — Utente senza subscription attiva → aggiorna `is_pro: false`, clear subscription fields
- [ ] **E7** — Risposta include `subscribed`, `subscription_end`, `cancel_at_period_end`

---

## F. Cancel Subscription

- [ ] **F1** — Endpoint `POST /functions/v1/cancel-subscription` risponde correttamente
- [ ] **F2** — Richiede autenticazione (senza token: 401)
- [ ] **F3** — Senza subscription → 400
- [ ] **F4** — Imposta `cancel_at_period_end: true` (non cancellazione immediata)
- [ ] **F5** — Risponde `{ canceled: true, cancel_at: ISO_date }`

---

## G. Customer Portal

- [ ] **G1** — Endpoint `POST /functions/v1/customer-portal` risponde correttamente
- [ ] **G2** — Richiede autenticazione
- [ ] **G3** — Senza `stripe_customer_id` → 400
- [ ] **G4** — Restituisce URL del Billing Portal Stripe
- [ ] **G5** — `return_url` punta a `/app/impostazioni`

---

## H. useSubscription hook

- [ ] **H1** — Polling ogni 60 secondi
- [ ] **H2** — Refresh al tab focus (visibilitychange)
- [ ] **H3** — Restituisce `isPro`, `subscriptionEnd`, `cancelAtPeriodEnd`, `loading`

---

## I. Dashboard — PlanCard

- [ ] **I1** — PlanCard visibile nella dashboard per tutti gli utenti
- [ ] **I2** — Stato Free: mostra "Piano Free" con info limite
- [ ] **I3** — Stato Pro: mostra "Versō Pro" con badge e data rinnovo
- [ ] **I4** — Stato Pro in scadenza: mostra data scadenza

---

## J. Post-pagamento

- [ ] **J1** — Redirect a `/app/home?upgrade=success` dopo pagamento Stripe
- [ ] **J2** — Polling `check-subscription` fino a `is_pro = true`
- [ ] **J3** — Toast "Benvenuto in Versō Pro!" mostrato
- [ ] **J4** — Badge/PlanCard aggiornato a Pro
- [ ] **J5** — "Nuova candidatura" funziona senza limiti

---

## K. StepCompleta — Micro-banner

- [ ] **K1** — Utente Free: micro-banner "Hai usato la tua candidatura gratuita" visibile
- [ ] **K2** — Utente Pro: micro-banner NON visibile
- [ ] **K3** — Banner non è aggressivo, solo informativo

---

## L. Pagina Guida & FAQ

- [ ] **L1** — Route `/app/faq` accessibile
- [ ] **L2** — Voce "Guida" visibile nella sidebar desktop con icona `Question`
- [ ] **L3** — Link "Guida & FAQ" presente nella sezione Assistenza delle Impostazioni
- [ ] **L4** — 4 sezioni accordion (ATS, Filosofia, Consigli, Dati/Privacy)
- [ ] **L5** — Tutti i testi in italiano e in prima persona singolare
- [ ] **L6** — Stile dark mode coerente
