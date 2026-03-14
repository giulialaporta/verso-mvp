
Obiettivo: eliminare gli errori runtime attuali (checkout/subscription) e i warning React che possono destabilizzare il routing.

1) Diagnosi (confermata dai log)
- `check-subscription` ritorna 500 con `Invalid time value`: conversione data Stripe non robusta (`toISOString()` su valore non valido).
- `check-subscription` ritorna 500 con `User not authenticated`: chiamata in race condition dopo logout / token assente, oggi trattata come errore server.
- `create-checkout` in alcuni casi continua a produrre errore “Already subscribed” lato client: va reso completamente idempotente lato backend + parsing client più difensivo.
- Warning React: “Function components cannot be given refs” in `Login` e `ProtectedRoute`, legato al rendering diretto di `<Navigate />` in questi componenti.

2) Interventi da implementare
A. Harden `check-subscription` (file: `supabase/functions/check-subscription/index.ts`)
- Introdurre helper sicuro per timestamp Stripe:
  - accetta `number|string|unknown`
  - valida `Number.isFinite(...)`
  - restituisce `string | null` (mai throw)
- Usare l’helper per `subscription_end` e `pro_since` (con fallback multipli, senza `toISOString()` diretto).
- Gestire token non valido/senza utente come risposta non-fallimentare controllata (es. `200 { subscribed:false, subscription_end:null }`), evitando 500 ricorsivi.
- Mantenere aggiornamento profilo coerente ma solo con date valide.

B. Stabilizzare hook client subscription (file: `src/hooks/useSubscription.ts`)
- Evitare invoke quando `user` o `session.access_token` non sono presenti.
- Passare `Authorization: Bearer ${session.access_token}` esplicitamente all’invoke.
- Pulizia robusta del polling interval su cambio utente/sessione (niente chiamate pendenti dopo logout).
- Gestione “unauthenticated” come stato normale (`isPro=false`) senza warning rumorosi.

C. Rendere idempotente il checkout Pro (file: `supabase/functions/create-checkout/index.ts`)
- Garantire che utente già abbonato ritorni sempre `200 { already_subscribed: true }` (mai 4xx/5xx per questo caso).
- Verificare che nessun ramo possa rilanciare “Already subscribed” come errore.

D. Difesa frontend checkout (file: `src/pages/Upgrade.tsx`)
- Normalizzare lettura errori `invoke` (`error.message`, `error.context` JSON/text, payload nested).
- Se emerge “already subscribed”, mostrare toast success e redirect a `/app/home` senza crash.
- Conservare redirect checkout in stessa tab (`window.location.href`).

E. Eliminare warning `Navigate` + ref (file: `src/pages/Login.tsx`, `src/components/ProtectedRoute.tsx`)
- Sostituire return diretto di `<Navigate />` con redirect imperativo (`useNavigate` + `useEffect`) e render neutro/spinner durante il redirect.
- Obiettivo: rimuovere warning React in console e prevenire side effects nel routing.

3) Verifica finale (end-to-end)
- Caso Pro già attiva: click su Upgrade → niente errore runtime, toast “già abbonata”, ritorno a Home.
- Home caricata: `check-subscription` non deve più dare 500 (`Invalid time value` / `User not authenticated`).
- Logout/login: nessun polling orfano, nessun warning ripetuto.
- Console pulita dai warning “Function components cannot be given refs” su `Login` e `ProtectedRoute`.

Dettagli tecnici (sintesi)
- Nessuna modifica schema database necessaria.
- Modifiche solo su 5 file applicativi + 2 funzioni backend.
- Focus su robustezza runtime, idempotenza checkout e stabilità auth/routing.
