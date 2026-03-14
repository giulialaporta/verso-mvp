

# Fix: Race condition nel pro gate blocca utenti con abbonamento in scadenza

## Problema

C'è una race condition in `Nuova.tsx`. Il flusso attuale:

1. `useSubscription()` parte con `isPro: false, loading: true`
2. L'`useEffect` del pro gate scatta subito con `isPro = false`
3. `checkCanCreate(false)` vede `free_apps_used >= 1` → redirect a `/upgrade`
4. Solo dopo arriva la risposta di `check-subscription` con `subscribed: true`

L'utente viene bloccata prima che il sistema sappia che è ancora Pro.

## Soluzione

Aggiungere `loading` dalla destructuring di `useSubscription` e attendere che il caricamento sia completato prima di eseguire il pro gate check.

### File: `src/pages/Nuova.tsx`

- Destructure `loading` da `useSubscription()`: `const { isPro, loading } = useSubscription();`
- Nel `useEffect` del pro gate (riga 61), aggiungere un early return se `loading` è `true`:
  ```
  if (loading) return; // aspetta che lo stato subscription sia noto
  ```
- Aggiungere `loading` nelle dipendenze dell'`useEffect`
- Nel guard finale del render (spinner), aggiungere `loading` alla condizione:
  ```
  if (cvCheck === "loading" || !proChecked || loading)
  ```

Nessun altro file coinvolto. La fix è chirurgica: 3 righe modificate.

