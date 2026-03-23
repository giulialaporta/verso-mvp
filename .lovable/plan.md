

# Fix CORS: aggiungere domini custom e rendere robusto

## Problema

La CORS whitelist non include `versocv.com`, `www.versocv.com`, `versocv.it`, `www.versocv.it`. Qualsiasi chiamata da produzione su dominio custom viene bloccata dal browser.

## Intervento

### 1) Aggiornare `supabase/functions/_shared/cors.ts`

Sostituire la whitelist rigida con una che includa tutti i domini e usi anche pattern matching per i sottodomini Lovable:

```typescript
const ALLOWED_ORIGINS = [
  "https://verso-cv.lovable.app",
  "https://versocv.com",
  "https://www.versocv.com",
  "https://versocv.it",
  "https://www.versocv.it",
  "http://localhost:5173",
  "http://localhost:8080",
];

const ALLOWED_PATTERNS = [
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const hostname = new URL(origin).hostname;
    return ALLOWED_PATTERNS.some(p => p.test(hostname));
  } catch { return false; }
}
```

La funzione `getCorsHeaders` userà `isAllowedOrigin()` e aggiungerà `Vary: Origin`.

### 2) Nessun altro file da modificare

Tutte le edge functions importano `getCorsHeaders` da `_shared/cors.ts`. Aggiornando solo quel file e facendo redeploy, tutte le funzioni riceveranno il fix.

### 3) Redeploy delle funzioni critiche

Dopo la modifica, redeploy di: `parse-cv`, `scrape-job`, `ai-prescreen`, `ai-tailor`, `cv-review`, `check-subscription`, `render-cv`, `compact-headline`, `cv-formal-review`, `create-checkout`, `cancel-subscription`, `customer-portal`, `stripe-webhook`, `delete-account`, `track-event`.

## File da toccare

- `supabase/functions/_shared/cors.ts` — unico file da modificare

## Risultato atteso

Tutte le chiamate da `versocv.com`, `versocv.it`, `verso-cv.lovable.app`, preview e localhost funzioneranno senza errori CORS.

