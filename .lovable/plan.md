

# Piano — Auth Acceptance Criteria Fix

Analisi della checklist rispetto al codice attuale. Molti criteri sono già soddisfatti. Ecco i gap da colmare:

## Già soddisfatti (nessun intervento)

- **A1, A5, A6, A7, A10, A11** — Form signup funziona, loading state presente
- **B1-B4, B5-B8** — Login, sessione persistente, redirect se autenticato
- **C1-C5** — Logout presente in sidebar/mobile
- **D1-D8, D11-D12** — Reset password flow completo
- **F1-F4** — ProtectedRoute gestisce tutto
- **G4, G6** — Password mascherata, layout responsive
- **G7** — Form con `onSubmit` supporta Enter

## Gap da implementare

### 1. Disabilitare submit se campi vuoti (A2)
Il `required` HTML non basta per disabilitare il bottone. Aggiungere logica `disabled` basata su campo vuoto.

### 2. Errori in italiano e non rivelatori (A3, A4, A8, A9, B2, B3)
Attualmente `error.message` è passato direttamente — spesso in inglese e può rivelare se l'email esiste. Mappare i messaggi Supabase a messaggi italiani generici:
- `Invalid login credentials` → "Email o password non corretti"
- `Email not confirmed` → "Conferma la tua email prima di accedere"
- `User already registered` → "Controlla la tua email per completare la registrazione" (non rivela esistenza)

### 3. Deep link redirect dopo login (F5)
`ProtectedRoute` deve salvare la location tentata. Dopo login, redirect alla pagina originale invece che sempre `/app/home`.

### 4. Protezione doppio click OAuth (G1)
I pulsanti Google/Apple OAuth non hanno protezione contro doppio click. Aggiungere stato `oauthLoading`.

### 5. Fix build error `ai-fetch.ts` (TS2698)
Il spread condizionale `...(options.tool_choice && { ... })` causa errore TypeScript in Deno. Costruire l'oggetto body esplicitamente.

## File coinvolti

| File | Modifiche |
|------|-----------|
| `src/pages/Login.tsx` | Disable button, error mapping, OAuth loading, deep link redirect |
| `src/components/ProtectedRoute.tsx` | Salvare location tentata per deep link |
| `supabase/functions/_shared/ai-fetch.ts` | Fix TS2698 spread error |

