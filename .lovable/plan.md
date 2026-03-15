

# Sessione con timeout 30 minuti di inattività

## Flusso utente

Quando l'utente torna dopo il timeout:

1. La sessione è stata invalidata → `AuthContext` rileva `user = null`
2. Se era su una rotta `/app/*` → `ProtectedRoute` lo manda a `/login`
3. Se torna sulla root `/` → vede la **Landing page** (già implementata)
4. Un **toast** gli comunica: "Sessione scaduta per inattività. Accedi di nuovo."

L'utente non vede mai una pagina bianca — vede o la landing (se torna su `/`) o la login (se era nell'app).

## Implementazione tecnica

### 1. Hook `useInactivityTimeout` (nuovo file)
- Traccia `mousemove`, `keydown`, `click`, `scroll`, `touchstart` sul `window`
- Ad ogni evento, resetta un timer di 30 minuti
- Allo scadere: chiama `signOut()`, salva un flag `sessionStorage.setItem("inactivity_logout", "true")`, e naviga a `/login`
- Cleanup dei listener on unmount
- Il timer si resetta anche al focus della finestra (per gestire tab in background)

### 2. Integrazione in `ProtectedRoute`
- Chiama `useInactivityTimeout(30)` — attivo solo per utenti autenticati
- Nessun impatto sulle rotte pubbliche (landing, login, legal)

### 3. Toast nella pagina Login
- Al mount, controlla `sessionStorage.getItem("inactivity_logout")`
- Se presente: mostra toast "Sessione scaduta per inattività" e rimuove il flag
- L'utente capisce perché è stato disconnesso

### File coinvolti

| File | Azione |
|------|--------|
| `src/hooks/useInactivityTimeout.ts` | Creare — hook con timer 30min |
| `src/components/ProtectedRoute.tsx` | Aggiungere chiamata all'hook |
| `src/pages/Login.tsx` | Aggiungere controllo toast inattività |

