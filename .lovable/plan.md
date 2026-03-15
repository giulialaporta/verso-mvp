

# Flusso di registrazione differenziato Free vs Pro

## Stato attuale
Tutti i CTA della landing (`Inizia gratis`, `Inizia con Pro`, `Accedi`) puntano a `/login` senza distinzione. Non esiste un flusso che tenga traccia dell'intento Pro.

## Design del flusso

```text
Landing                    /login                         Post-signup
─────────────────────────────────────────────────────────────────────
"Inizia gratis"    →  /login?plan=free   → signup mode  → /app/home → onboarding
"Inizia con Pro"   →  /login?plan=pro    → signup mode  → /upgrade  → Stripe checkout
"Accedi" (navbar)  →  /login             → login mode   → /app/home
"Registrati" (toggle interno) → resta su signup mode, mantiene il plan param
```

Chi arriva con `?plan=pro` vede un piccolo badge "Piano Pro" sotto il form (non invasivo), che conferma la scelta ma consente di cambiare. L'utente può sempre tornare indietro: il flusso Pro porta a `/upgrade` dopo la registrazione, dove c'è già il bottone "Resta con il piano Free".

## Modifiche

### 1. `Login.tsx`
- Leggere `searchParams.get("plan")` dall'URL
- Se `plan=pro` o `plan=free`: auto-impostare `isSignUp = true`
- Dopo signup riuscito con `plan=pro`: redirect a `/upgrade` invece di `/app/home`
- Dopo OAuth con `plan=pro`: salvare `localStorage.setItem("verso_pending_plan", "pro")` prima del redirect OAuth; nell'effect post-login leggere e redirect a `/upgrade`
- Mostrare un indicatore discreto sotto il titolo quando `plan=pro` (es. badge mono "Piano Pro · €9,90/mese") con link "Oppure inizia gratis" che toglie il param

### 2. `PricingSection.tsx`
- "Inizia gratis" → `navigate("/login?plan=free")`
- "Inizia con Pro" → `navigate("/login?plan=pro")`

### 3. `LandingHero.tsx`
- "Inizia gratis" → `navigate("/login?plan=free")`

### 4. `FinalCTASection.tsx`
- "Inizia gratis" → `navigate("/login?plan=free")`

### 5. `LandingNavbar.tsx`
- "Inizia gratis" (mobile/desktop) → `navigate("/login?plan=free")`
- "Accedi" resta `/login` (login mode, non signup)

### 6. `LandingHero.tsx` — fix copy
- Rimuovere "3 tailoring gratuiti al mese" (non corrisponde alla realtà)

### 7. `FinalCTASection.tsx` — fix copy
- Rimuovere "3 tailoring gratuiti" dal footer

Nessuna modifica a `Upgrade.tsx` — funziona già come landing Pro con "Resta con il piano Free".

