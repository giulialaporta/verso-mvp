

# Fix: Stripe checkout redirect perde la sessione

## Problema
`window.open(data.url, "_blank")` apre una nuova tab. La sessione Supabase è in `localStorage` del dominio dell'app, ma la nuova tab viene prima su `checkout.stripe.com` e poi redirige a `verso-cv.lovable.app/app/home?upgrade=success`. Siccome la tab originale aveva la sessione ma questa nuova tab non ha mai caricato l'app prima del redirect Stripe, il `localStorage` potrebbe non essere disponibile o la sessione non inizializzata.

## Soluzione
Cambiare `window.open(url, "_blank")` → `window.location.href = url` in `src/pages/Upgrade.tsx`. Così il checkout avviene nella stessa tab, e al ritorno da Stripe il browser torna sullo stesso dominio con `localStorage` intatto e la sessione Supabase valida.

## File modificato

| File | Modifica |
|------|----------|
| `src/pages/Upgrade.tsx` | Riga ~33: `window.open(data.url, "_blank")` → `window.location.href = data.url` |

Modifica di una sola riga — nessun impatto su altri componenti.

