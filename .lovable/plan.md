

# Fix: Recupero password, Google OAuth e accesso

## Problema 1 — Recupero password bloccato su loading

**Causa**: Race condition in `ResetPassword.tsx`. Il componente aspetta l'evento `PASSWORD_RECOVERY` da `onAuthStateChange`, ma:
- L'evento puo' scattare PRIMA che il componente si monti (perche' `AuthContext` processa il token hash prima)
- Il fallback `hash.includes("type=recovery")` non funziona perche' Supabase JS consuma il hash fragment durante l'inizializzazione

**Fix**: Riscrivere la logica di `ResetPassword.tsx`:
1. Usare `supabase.auth.getSession()` per verificare se c'e' gia' una sessione recovery attiva
2. Ascoltare `PASSWORD_RECOVERY` come prima, ma anche `SIGNED_IN` (che scatta dopo il recovery)
3. Aggiungere un timeout di 5 secondi: se nessun evento arriva, mostrare un messaggio di errore con link per riprovare invece di restare in loading infinito
4. Se l'utente ha una sessione attiva (il recovery ha funzionato ma l'evento e' stato perso), mostrare direttamente il form

```text
Logica:
1. Al mount: check getSession() — se c'e' sessione, mostra il form
2. Ascolta onAuthStateChange per PASSWORD_RECOVERY o SIGNED_IN
3. Timeout 5s: se ancora !ready, mostra messaggio "Il link potrebbe essere scaduto" + bottone "Richiedi nuovo link"
```

**File**: `src/pages/ResetPassword.tsx`

## Problema 2 — Google OAuth (audience mismatch)

**Causa**: Il log mostra:
```
Unacceptable audience in id_token: [288002387414-6cvdo0ftcmsi36l9npigsaoj3m86oedc.apps.googleusercontent.com]
```
Questo succede quando il token Google viene presentato al backend con un client ID che non e' nella lista degli audience accettati. L'errore avviene solo sull'URL pubblicato (`verso-cv.lovable.app`), non sul preview.

**Fix**: Questo e' un problema di configurazione dell'integrazione Lovable Auth, non del codice. Il codice e' corretto (`lovable.auth.signInWithOAuth("google")`). Il problema e' che l'URL pubblicato potrebbe non essere configurato correttamente come redirect URI nel progetto Google OAuth.

**Azione**: Verificare la configurazione del connettore Google OAuth e, se necessario, riconnettere il provider per includere l'URL pubblicato.

## Problema 3 — Accesso impossibile

**Causa**: Il refresh token dell'utente `giulialaporta@libero.it` e' invalido. Questo puo' succedere quando:
- Il recovery link crea una nuova sessione ma la vecchia sessione nel browser ha un token scaduto
- Il browser ha token stale nel localStorage

**Fix nel codice**: Migliorare la gestione dell'errore `refresh_token_not_found` in `AuthContext.tsx`:
1. Intercettare l'errore di refresh token
2. Fare `signOut()` automaticamente per pulire i token corrotti
3. Redirect a `/login` con un messaggio chiaro

**File**: `src/contexts/AuthContext.tsx`

**Fix immediato per l'utente**: Una volta fixato il recupero password, l'utente potra' fare un nuovo reset e accedere.

## Riepilogo file da modificare

| File | Modifica |
|------|----------|
| `src/pages/ResetPassword.tsx` | Fix race condition: getSession + timeout + fallback UI |
| `src/contexts/AuthContext.tsx` | Gestione errore refresh token invalido con auto-signout |

## Dettagli tecnici

### ResetPassword.tsx — nuova logica

```typescript
useEffect(() => {
  let timeout: NodeJS.Timeout;
  
  // 1. Check if already has a session (recovery processed before mount)
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) setReady(true);
  });

  // 2. Listen for recovery events
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
      setReady(true);
    }
  });

  // 3. Timeout fallback — show error UI instead of infinite loading
  timeout = setTimeout(() => {
    if (!ready) setExpired(true);
  }, 5000);

  return () => { subscription.unsubscribe(); clearTimeout(timeout); };
}, []);
```

Quando `expired` e' true, mostrare:
- "Il link di recupero potrebbe essere scaduto o gia' utilizzato."
- Bottone "Richiedi un nuovo link" che porta a `/login` con il form di recupero

### AuthContext.tsx — gestione token corrotto

Aggiungere nel `useEffect` la gestione dell'evento `TOKEN_REFRESHED` fallito:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || (!session && event === "TOKEN_REFRESHED")) {
    setSession(null);
    setUser(null);
  }
  // ... rest
});
```

E nel `getSession`, gestire l'errore:

```typescript
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    supabase.auth.signOut(); // pulisce token corrotti
  }
  // ...
});
```

