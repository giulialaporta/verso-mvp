# Story 01.1 — Autenticazione Email (Implementata)

**Epic:** 01 — Auth + Setup
**Status:** Completata

---

## Cosa è stato implementato

Pagina `/login` con form di accesso e registrazione via email + password.

### Comportamento

1. **Login:** campi email + password → click "Accedi" → Supabase auth → redirect `/app/home`
2. **Signup:** toggle "Non hai un account?" → aggiunge campo "Nome completo" → Supabase signup → email di conferma → dopo conferma l'utente può fare login
3. **Redirect:** utente non autenticato su `/app/*` → redirect a `/login`; utente autenticato su `/login` → redirect a `/app/home`

### Componenti

- Pagina `/login` con card centrata
- Logo "VERSO" (Syne 800, "O" accent)
- Form con validazione
- `AuthContext` per state management sessione
- `ProtectedRoute` per guardia route
