

# Story 1 — Eliminazione account

## Obiettivo
Permettere all'utente di eliminare il proprio account (GDPR art. 17). Pagina Impostazioni con flow di conferma + edge function che elimina tutti i dati.

## Modifiche

### 1. Nuova Edge Function `delete-account`
- File: `supabase/functions/delete-account/index.ts`
- Config: `verify_jwt = false` in `supabase/config.toml`
- Logica:
  1. Verifica auth (Bearer token → `getUser`)
  2. Con service role client:
     - Lista e rimuovi file da `cv-uploads` (prefisso `userId/`)
     - Lista e rimuovi file da `cv-exports` (prefisso `userId/`)
     - `DELETE FROM tailored_cvs WHERE user_id = ?`
     - `DELETE FROM applications WHERE user_id = ?`
     - `DELETE FROM master_cvs WHERE user_id = ?`
     - `DELETE FROM profiles WHERE user_id = ?`
     - `auth.admin.deleteUser(userId)`
  3. Ritorna `{ success: true }`

### 2. Nuova pagina `src/pages/Impostazioni.tsx`
- Sezioni:
  - **Account**: email (read-only), full_name (read-only)
  - **Zona pericolosa**: pulsante "Elimina account" (rosso, ghost)
- Modal di conferma (AlertDialog):
  - Warning chiaro: "Tutti i tuoi dati verranno eliminati permanentemente"
  - Input di conferma: l'utente digita "ELIMINA"
  - Pulsante conferma rosso, disabilitato finché non digita correttamente
- Post-eliminazione: `signOut()` → redirect `/login` → toast "Account eliminato"

### 3. Route + Navigazione
- `src/App.tsx`: aggiungere route `/app/impostazioni`
- `src/components/AppShell.tsx`:
  - Desktop sidebar: aggiungere "Impostazioni" con icona `Gear` in fondo (prima di "Esci")
  - Mobile tab bar: aggiungere icona `Gear` come quarto tab (prima del FAB)

### File coinvolti

| File | Azione |
|------|--------|
| `supabase/functions/delete-account/index.ts` | Nuovo |
| `supabase/config.toml` | Aggiungere `[functions.delete-account]` |
| `src/pages/Impostazioni.tsx` | Nuovo |
| `src/App.tsx` | Nuova route |
| `src/components/AppShell.tsx` | Nav item Impostazioni |

