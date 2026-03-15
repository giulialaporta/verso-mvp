# Epic 01 — Auth + Supabase + App Shell + Brand System (Implementato)

---

## Cosa è stato costruito

Fondamenta dell'app: design system dark mode, autenticazione Supabase con 3 metodi, database con RLS, e shell di navigazione responsive.

---

## 1. Design System (implementato)

- **Dark mode only.** Background: `#0C0D10`. `<html class="dark">` permanente.
- **Font:** Syne (700, 800 — headline), DM Sans (400, 500 — body), JetBrains Mono (400, 500 — numeri/chip)
- **CSS variables:** colori custom in `index.css`, override completo dei default shadcn/ui
- **Icone:** @phosphor-icons/react (duotone, regular, fill weights)
- **Animazioni:** Framer Motion per transizioni e animazioni
- **Accent:** `#A8FF78` — usato per CTA, score, elementi interattivi

---

## 2. Database (implementato)

6 tabelle create attraverso 9 migrazioni:

| Tabella | Scopo |
|---------|-------|
| `profiles` | Profilo utente (auto-creato via trigger) |
| `master_cvs` | CV master con `parsed_data` JSONB |
| `applications` | Candidature con status e score |
| `tailored_cvs` | CV adattati con analisi completa |
| `job_cache` | Cache scraping URL (7 giorni) |
| `consent_logs` | Tracciamento consensi GDPR (user_id, consent_type, consent_version, granted, granted_at, revoked_at, ip_address, user_agent, method, metadata) |

**RLS:** attivo su tutte le tabelle — ogni utente vede solo i propri dati (`auth.uid() = user_id`).

**Trigger:**
- Auto-create riga in `profiles` al signup (copia id + full_name da metadata)
- Auto-update `updated_at` su modifiche a master_cvs e applications

---

## 3. Autenticazione (implementata)

**Pagina `/login`:**
- Card centrata su sfondo `#0C0D10`
- Logo "VERSO" in Syne 800, lettera "O" in accent
- Form login: email + password
- Pulsante "Accedi" primario (sfondo accent, testo nero)
- Divisore "oppure"
- "Continua con Google" (OAuth via Lovable Auth SDK)
- Toggle signup: aggiunge campo "Nome completo"

**Flusso signup:**
1. Email → password → nome completo
2. 2 checkbox obbligatorie (T&C + Privacy Policy), non pre-spuntate
3. Pulsante "Crea account" disabilitato finché entrambe le checkbox non sono spuntate
4. Supabase invia email di conferma
5. Dopo la registrazione, i consensi vengono salvati in `consent_logs`
6. Click conferma → utente può fare login
7. Profilo auto-creato via trigger

**Google OAuth:** bloccato se le checkbox T&C + Privacy non sono spuntate.

**Flusso login:**
- Email + password OPPURE Google OAuth
- Redirect a `/app/home` dopo login

**Password reset (implementato):**
1. Link "Password dimenticata?" nella pagina login
2. Inserisci email → Supabase invia link di reset
3. Link apre `/reset-password` con `type=recovery` nell'hash
4. Utente imposta nuova password → redirect a `/app/home`

**Protezione route:**
- Componente `ProtectedRoute` guarda `/app/*` e `/onboarding`
- Non autenticato → redirect a `/login`
- Autenticato su `/login` → redirect a `/app/home`

**State management:** `AuthContext` con React Context + persistenza sessione Supabase.

---

## 4. App Shell (implementata)

Route `/app` — layout wrapper per tutte le pagine autenticate.

**Desktop (≥1024px) — Sidebar sinistra:**
- Background: `--color-surface` (`#141518`)
- Logo "VERSO" in alto
- Link navigazione verticale con icone Phosphor:
  - Home → `House`
  - Candidature → icona lista
  - Nuova candidatura → `Plus` (accent)
  - Guida → `Question`
  - Impostazioni → `GearSix`
- Nome utente in fondo

**Mobile (<1024px) — Bottom tab bar:**
- Background blur con backdrop-filter
- 3 tab: Home | + (FAB accent, più grande) | Candidature
- Tab attiva: dot accent sotto l'icona

**Route:**

| Route | Tipo | Descrizione |
|-------|------|-------------|
| `/login` | pubblica | Login / signup |
| `/reset-password` | pubblica | Reset password |
| `/termini` | pubblica | Termini e condizioni |
| `/privacy` | pubblica | Privacy policy |
| `/cookie-policy` | pubblica | Cookie policy |
| `/app/home` | protetta | Dashboard |
| `/app/candidature` | protetta | Lista candidature |
| `/app/impostazioni` | protetta | Impostazioni utente |
| `/app/cv-edit` | protetta | Editor CV master |
| `/app/candidatura/:id` | protetta | Dettaglio candidatura |
| `/app/faq` | protetta | FAQ (ATS, filosofia, consigli, dati) |
| `/upgrade` | protetta | Pagina upgrade a Versō Pro (fuori AppShell) |
| `*` | pubblica | Pagina 404 (in italiano) |

---

## Componenti chiave

| Componente | Scopo |
|------------|-------|
| `AppShell` | Layout responsive (sidebar/tab bar) |
| `ProtectedRoute` | Auth guard per route protette |
| `ErrorBoundary` | Gestione errori globale |
| Logo "VERSO" | Syne 800, "O" in accent |
| `ConsentCheckboxes` | Checkbox T&C + Privacy per form signup |
| `CookieBanner` | Banner cookie bottom sticky |
| `AiLabel` | Label trasparenza AI |
| `LegalLayout` | Wrapper per pagine legali (/termini, /privacy, /cookie-policy) |
| `PageSkeleton` | Loading placeholder |
| `SensitiveDataConsent` | Modal art. 9 GDPR pre-upload CV |

---

## Sicurezza

- **CORS dinamico:** modulo `_shared/cors.ts` con whitelist (`verso-cv.lovable.app`, `localhost`). Tutte le edge functions usano `getCorsHeaders()` invece di `Access-Control-Allow-Origin: *`.
- **Redirect sanitizer:** nel flusso Login, solo path `/app/*` ammessi come redirect post-login.

---

## Note aggiuntive

- **Pagina 404:** ora in italiano.
- **`Index.tsx` eliminata:** la pagina placeholder è stata rimossa.

---

## Differenze dal piano MVP

| Area | Piano | Implementato |
|------|-------|-------------|
| Password reset | Non previsto | Implementato con flusso completo |
| OAuth | Google via Supabase | Google via Lovable Auth SDK |
| Sidebar collapsata | Prevista (1024-1279px) | Implementata |
| Candidature nella nav | Placeholder | Link attivo a `/app/candidature` |
