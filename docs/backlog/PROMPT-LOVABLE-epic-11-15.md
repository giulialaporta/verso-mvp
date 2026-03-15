# Prompt Lovable — Epic 11→15 (sequenziale)

Implementa le 5 epic seguenti in ordine. Per ognuna: sviluppa, verifica che funzioni, poi passa alla successiva. Non iniziare l'epic successiva finché la precedente non è completa e funzionante.

---

## Epic 11 — Stripe Webhook (CRITICA)

### Cosa fare

Crea una nuova edge function `stripe-webhook` che riceve eventi da Stripe e aggiorna il profilo utente in tempo reale.

### Specifiche

1. **Nuova edge function `supabase/functions/stripe-webhook/index.ts`:**
   - Endpoint `POST`, nessuna autenticazione Bearer (Stripe chiama direttamente)
   - Leggi `STRIPE_WEBHOOK_SECRET` dalle env var
   - Valida la firma con `Stripe.webhooks.constructEvent(body, sig, secret)`
   - Se firma invalida → 400
   - Gestisci questi eventi:

   | Evento | Azione |
   |--------|--------|
   | `checkout.session.completed` | Trova utente tramite `customer` → aggiorna `profiles`: `is_pro: true`, `stripe_customer_id`, `stripe_subscription_id`, `pro_since: now()` |
   | `customer.subscription.updated` | Trova utente tramite `stripe_customer_id` in profiles → aggiorna `pro_expires_at` (da `current_period_end`), `cancel_at_period_end` |
   | `customer.subscription.deleted` | Trova utente tramite `stripe_customer_id` → imposta `is_pro: false`, clear `stripe_subscription_id`, `pro_expires_at`, `pro_since` |

   - Per `checkout.session.completed`: estrai `subscription` dall'evento, poi `stripe.subscriptions.retrieve(subscription)` per ottenere `current_period_end`
   - Usa `supabaseAdmin` (service_role) per aggiornare profiles
   - Tutti gli eventi non gestiti → rispondi 200 (ignora)
   - Utente non trovato → log errore, rispondi 200

2. **Modifica `useSubscription`:**
   - Cambia l'intervallo di polling da 60 secondi a **5 minuti** (300000ms)
   - Il polling resta come fallback

### Verifica

- Simula un `checkout.session.completed` con Stripe CLI (`stripe trigger checkout.session.completed`) — il profilo deve aggiornarsi a Pro senza bisogno di polling
- Verifica che la firma invalida restituisca 400
- Verifica che il polling a 5 minuti funzioni ancora come fallback

---

## Epic 12 — Event Tracking

### Cosa fare

Crea un sistema di tracciamento eventi leggero per misurare il funnel.

### Specifiche

1. **Migrazione DB — tabella `user_events`:**
   ```sql
   CREATE TABLE user_events (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
     event_name text NOT NULL,
     event_data jsonb DEFAULT '{}',
     created_at timestamptz DEFAULT now()
   );

   ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
   -- Nessuna policy utente. Solo service_role può leggere/scrivere.
   ```

2. **Hook `useTrackEvent`** (in `src/hooks/useTrackEvent.ts`):
   ```typescript
   // Chiama supabase.from('user_events').insert() fire-and-forget
   // Parametri: eventName (string), eventData (object opzionale)
   // Non deve bloccare UI, non deve mostrare errori
   ```

3. **Integra questi eventi:**

   | Evento | Dove | Trigger |
   |--------|------|---------|
   | `signup_completed` | AuthProvider o pagina post-signup | Dopo registrazione riuscita. `{ method: "email" \| "google" }` |
   | `cv_uploaded` | Upload CV success handler | Dopo parse-cv riuscito. `{ file_type: "pdf" }` |
   | `wizard_started` | `Nuova.tsx` mount | Quando il wizard si carica. `{ is_draft_resume: boolean }` |
   | `wizard_step_completed` | Ogni transizione step nel wizard | `{ step: N, step_name: "annuncio\|verifica\|tailoring\|revisione\|export\|completa" }` |
   | `wizard_abandoned` | `Nuova.tsx` unmount o `beforeunload` | Se step < 5. `{ last_step: N }` |
   | `upgrade_page_viewed` | `Upgrade.tsx` mount | `{}` |
   | `upgrade_completed` | Post-pagamento success | `{ source: "checkout" }` |
   | `pdf_downloaded` | StepExport download handler | `{ template: "classico\|minimal\|executive\|moderno" }` |
   | `application_status_changed` | Candidature page status update | `{ from: "sent", to: "colloquio" }` |

### Verifica

- Crea un account, carica CV, completa wizard → controlla in Supabase che ci siano almeno 7 record in `user_events`
- Abbandona un wizard a metà → controlla che `wizard_abandoned` venga inserito
- Verifica che l'UI non rallenti (insert fire-and-forget)

---

## Epic 13 — Template Pro-only

### Cosa fare

Rendi Executive e Moderno disponibili solo per utenti Pro. Gli utenti Free vedono una preview blurrata con lucchetto.

### Specifiche

1. **In `StepExport.tsx`:**
   - Definisci quali template sono Pro: `executive` e `moderno`
   - Per utenti Free (`isPro === false` da `useSubscription`):
     - I template Pro mostrano un overlay con: blur/opacità, icona `Lock` da lucide-react, badge "Pro" in accent
     - Click su template Pro → toast: "Sblocca questo template con Versō Pro" con action button che naviga a `/upgrade`
     - Il template NON viene selezionato
   - Per utenti Pro: tutti i template selezionabili, nessun overlay
   - Template di default: `classico` per tutti

2. **Stile overlay:**
   - Overlay semi-trasparente sopra la preview del template
   - Icona Lock centrata, grande (24px)
   - Badge "Pro" in alto a destra, sfondo accent, testo bianco, piccolo
   - Tutto coerente con dark mode

### Verifica

- Utente Free: i 4 template sono visibili, Executive e Moderno hanno lucchetto
- Click su Executive da Free → toast con link upgrade, template non cambia
- Utente Pro: tutti i template selezionabili senza restrizioni
- Il template di default è Classico

---

## Epic 14 — Email Transazionali

### Cosa fare

Invia email automatiche per i momenti chiave (benvenuto, draft abbandonato, follow-up).

### Specifiche

1. **Migrazione DB — tabella `email_log`:**
   ```sql
   CREATE TABLE email_log (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
     application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
     template_id text NOT NULL,
     sent_at timestamptz DEFAULT now()
   );
   ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
   -- Nessuna policy utente.
   ```

2. **Edge function `send-email`** (`supabase/functions/send-email/index.ts`):
   - Parametri: `to` (email), `template_id` (string), `template_data` (object)
   - Usa Resend API (`RESEND_API_KEY` env var)
   - Mittente: `Verso <noreply@verso-cv.app>`
   - Template HTML inline (no servizio esterno). Stile: sfondo scuro (#0F172A), testo bianco, accent per CTA, font DM Sans
   - Template supportati:
     - `welcome`: "Benvenuto su Verso" + CTA "Carica il tuo CV"
     - `draft_reminder`: "Hai una candidatura in bozza" + CTA "Riprendi" con azienda e ruolo
     - `followup_7d`: "Aggiorna la tua candidatura" + CTA "Aggiorna status" con azienda e ruolo
     - `welcome_pro`: "Benvenuto in Versō Pro" + riepilogo benefit
   - Log in `email_log` dopo invio riuscito

3. **Email immediata — Benvenuto:**
   - Dopo signup riuscito (email o Google), chiama `send-email` con template `welcome`
   - Fire-and-forget (non bloccare il flusso)

4. **Email immediata — Benvenuto Pro:**
   - Dopo upgrade riuscito (quando `is_pro` diventa true post-checkout), chiama `send-email` con template `welcome_pro`

5. **Cron `email-scheduler`** (`supabase/functions/email-scheduler/index.ts`):
   - Invocato ogni ora (configura con pg_cron o Supabase Cron)
   - **Draft abbandonati:** cerca `applications` con `status = 'draft'` AND `created_at < now() - interval '48 hours'` AND nessun record in `email_log` con `template_id = 'draft_reminder'` per quella application
   - **Follow-up 7gg:** cerca `applications` con `status = 'sent'` AND `updated_at < now() - interval '7 days'` AND nessun record in `email_log` con `template_id = 'followup_7d'` per quella application
   - Per ogni match: chiama `send-email` internamente

### Verifica

- Registra nuovo utente → controlla di ricevere email di benvenuto
- Crea candidatura, abbandona → dopo 48h (simula cambiando created_at) → cron invia reminder
- Candidatura in status "sent" → dopo 7gg → cron invia follow-up
- Controlla che non vengano inviate email duplicate (secondo run del cron = 0 email)

---

## Epic 15 — Verso Score + Honest Badge

### Cosa fare

Crea un punteggio composito "Verso Score" e un badge "CV Onesto" per comunicare la qualità della candidatura.

### Specifiche

1. **Componente `VersoScore`** (`src/components/candidatura/VersoScore.tsx`):
   - Riceve: `matchScore`, `atsScore`, `honestScore` (tutti 0-100)
   - Calcola: `versoScore = Math.round(matchScore * 0.4 + atsScore * 0.35 + honestScore * 0.25)`
   - Mostra un anello circolare animato (SVG o CSS) con il numero al centro
   - Sotto l'anello: breakdown con 3 mini-barre o etichette (Match X%, ATS X%, Onestà X%)
   - Colore anello per range:
     - 0-40: rosso (`destructive`)
     - 41-65: giallo/amber
     - 66-85: verde
     - 86-100: accent
   - Label sotto il numero: "Da migliorare" / "Buono" / "Forte" / "Eccellente"

2. **Badge "CV Onesto":**
   - Se `honestScore >= 85`: mostra badge con icona ShieldCheck + "CV Onesto"
   - Colore: accent (sfondo trasparente, bordo accent)
   - Tooltip (o testo sotto): "Il tuo CV è stato adattato senza informazioni inventate"
   - Se `honestScore < 85`: nessun badge (non mostrare nulla di negativo)

3. **Integrazioni:**
   - **StepCompleta (step 5 wizard):** Verso Score grande (160px anello) al centro della pagina, con breakdown sotto e badge CV Onesto accanto se applicabile. Sostituisce i due score separati attualmente mostrati.
   - **Card candidatura** (`src/components/candidature/`): Verso Score compatto (40px anello, solo numero). Al posto dei badge match% e ATS% separati. Hover/long-press mostra tooltip con breakdown.
   - **Dashboard Home — stats bar:** "Verso Score medio" al posto di "Match score medio". Calcola la media dei Verso Score di tutte le candidature attive.

### Verifica

- Completa wizard → StepCompleta mostra Verso Score con anello animato + breakdown
- Score < 40 → anello rosso, label "Da migliorare"
- Score > 85 + honest > 85 → anello accent, label "Eccellente", badge "CV Onesto"
- Lista candidature → ogni card mostra Verso Score compatto
- Dashboard → stats bar mostra media Verso Score

---

## Regole generali

- Dark mode only — nessun light mode
- Tutti i testi in italiano
- Font: DM Sans (già nel progetto)
- Colori: segui il design system esistente (accent, destructive, muted)
- Ogni epic è indipendente: completa e verifica una prima di passare alla successiva
- Se qualcosa non è chiaro, segui il pattern già usato nel codice esistente
