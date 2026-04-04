

# Trial Mode — Tutti Pro, senza menzione carta di credito

## Modifiche

### 1. `src/hooks/useSubscription.ts`
Aggiungere `const TRIAL_MODE = true;` in cima. Quando attivo, il hook ritorna subito `{ isPro: true, subscriptionEnd: null, cancelAtPeriodEnd: false, loading: false }` senza chiamare l'edge function. Commento: "Set to false to restore freemium."

### 2. `src/hooks/useProGate.ts`
Importare `TRIAL_MODE` da useSubscription (o duplicare la costante). Quando attivo, `checkCanCreate` ritorna sempre `true` senza query né redirect.

### 3. `src/components/landing/PricingSection.tsx`
Sostituire le due card Free/Pro con una singola card centrata:
- Titolo: "Accesso completo. Gratis."
- Sottotitolo: "Verso è in fase di lancio — tutte le funzionalità Pro sono gratuite per i primi utenti."
- Lista feature completa (quella attuale del piano Pro)
- CTA: "Inizia ora" → `/login`
- Nota sotto: "Setup in 2 minuti · Accesso completo incluso"

### 4. `src/components/landing/LandingHero.tsx`
Cambiare la riga sotto la CTA da:
> "Nessuna carta di credito · 1 candidatura gratuita"

A:
> "Accesso completo · Setup in 2 minuti"

### 5. `src/components/landing/FinalCTASection.tsx`
Cambiare la nota sotto il bottone da:
> "Nessuna carta di credito · Setup in 3 minuti"

A:
> "Tutte le funzionalità Pro · Setup in 2 minuti"

### Nessun'altra modifica
Database, Stripe, edge functions, pagina `/upgrade` — tutto resta intatto. Reversibile con `TRIAL_MODE = false`.

