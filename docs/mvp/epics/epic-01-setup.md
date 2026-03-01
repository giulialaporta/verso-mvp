# Epic 01 — Auth + Supabase + App Shell + Brand System

> Carica insieme a questo epic: `brand-system.md`

---

## Cosa costruire

Configura le fondamenta dell'app Verso: design system, autenticazione Supabase, database e shell di navigazione.

---

## 1. Design System

Applica il brand system caricato (`brand-system.md`) globalmente, PRIMA di costruire qualsiasi componente:

- **Dark mode only.** Background: `#0C0D10`. Imposta `<html class="dark">` permanentemente. Mai bianco, mai grigio chiaro.
- **Font:** importa da Google Fonts — `Syne` (700, 800), `DM Sans` (400, 500), `JetBrains Mono` (400, 500).
- **CSS variables:** applica tutte le variabili colore dalla sezione 2 del brand system in `index.css`.
- **Tailwind config:** crea un tema custom che mappa i token del brand system come classi Tailwind. Override completo dei colori shadcn/ui default. Nessun colore shadcn deve restare visibile.
- **Installa:** `@phosphor-icons/react`, `framer-motion`.

---

## 2. Supabase — Tabelle + RLS

Connetti Supabase e crea queste tabelle:

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  plan text default 'free',
  created_at timestamptz default now()
);

create table master_cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  content jsonb,
  raw_text text,
  source text default 'upload',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  company_name text not null,
  role_title text not null,
  role_description text,
  role_url text,
  match_score int,
  created_at timestamptz default now()
);

create table tailored_cvs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content jsonb,
  diff jsonb,
  pdf_url text,
  created_at timestamptz default now()
);
```

**Nota:** Le tabelle `applications` e `tailored_cvs` vengono create qui con le colonne base. L'epic 04 (AI Engine) aggiunge via migrazione le colonne aggiuntive: `applications.ats_score`, `applications.template_id`, `tailored_cvs.ats_score`, `tailored_cvs.ats_checks`, `tailored_cvs.seniority_match`, `tailored_cvs.honest_score`, `tailored_cvs.template_id`. Tutte nullable con default, nessun impatto sui dati esistenti.

**RLS su tutte le tabelle:** ogni utente accede solo ai propri dati (`auth.uid() = user_id` o `auth.uid() = id` per profiles).

**Trigger:** crea automaticamente una riga in `profiles` quando un nuovo utente si registra in `auth.users` (copia `id`, `email`, `raw_user_meta_data->full_name`).

---

## 3. Autenticazione

Pagina `/login`:

- Card centrata verticalmente e orizzontalmente su sfondo `#0C0D10`
- Logo: "VERSO" in Syne 800, lettera "O" in `#A8FF78`
- Form con:
  - Campo email (input con bordo `--color-border`, focus bordo `--color-accent`)
  - Campo password
  - Pulsante "Accedi" primario (sfondo `#A8FF78`, testo nero)
  - Divisore "oppure"
  - Pulsante "Continua con Google" secondario (bordo, icona Google)
  - Link "Non hai un account? Registrati" che switcha al form signup (aggiunge campo "Nome completo")
- Dopo login/signup → redirect a `/app/home`
- Se utente non autenticato accede a `/app/*` → redirect a `/login`
- Se utente autenticato accede a `/login` → redirect a `/app/home`

---

## 4. App Shell

Route `/app` — layout wrapper per tutte le pagine autenticate.

**Desktop (≥1024px) — Sidebar sinistra:**
- Background: `#141518` (`--color-surface`)
- Bordo destro: `1px solid #2A2D35`
- Logo "VERSO" in alto (Syne 800, "O" in accent)
- Link navigazione verticale con icone Phosphor (Regular, 20px):
  - Home → `House`
  - Candidature → `Kanban` (placeholder per ora)
  - Nuova → `Plus` (accent)
- In fondo: nome utente + avatar (dalle `profiles`)
- Larghezza: 240px espansa (≥1280px), 64px collassata (1024–1279px, solo icone)

**Mobile (<1024px) — Bottom tab bar:**
- Background: `rgba(12,13,16,0.85)`, `backdrop-filter: blur(16px)`
- Bordo top: `1px solid #2A2D35`
- 3 tab per l'MVP: Home | + (FAB accent) | Candidature (placeholder)
- Tab attiva: dot `#A8FF78` sotto l'icona
- Il "+" centrale: sfondo `#A8FF78`, icona `Plus` nera, leggermente più grande

---

## 5. Pagine placeholder

Crea pagine semplici per ogni route (titolo in Syne 700 + sottotitolo in DM Sans muted):

- `/app/home` → "Ciao [Nome]" + messaggio "Nessuna candidatura ancora. Inizia caricando il tuo CV." + CTA "Carica il tuo CV →" che porta a `/onboarding`
- `/app/nuova` → "Nuova candidatura" + "In costruzione"

---

## Criteri di accettazione

- [ ] Brand system applicato globalmente (dark mode, font Syne/DM Sans/JetBrains Mono, colori, icone Phosphor)
- [ ] Nessun colore shadcn default visibile
- [ ] Login email + password funzionante (signup + signin)
- [ ] Login Google OAuth funzionante
- [ ] Tabella profiles + master_cvs + applications + tailored_cvs create con RLS
- [ ] Trigger auto-create profile su signup
- [ ] Redirect non-autenticato → `/login`
- [ ] Redirect post-login → `/app/home`
- [ ] Sidebar desktop con logo + navigazione + nome utente
- [ ] Bottom tab bar mobile con FAB accent
- [ ] Pagine placeholder raggiungibili
