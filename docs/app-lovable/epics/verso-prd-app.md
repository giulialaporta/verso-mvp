# VERSO — PRD App Sviluppata
> Stato: sviluppata su Lovable
> Stack: React 18 + TypeScript + Vite + Supabase + Tailwind + shadcn/ui
> AI: Lovable API Gateway → Google Gemini 2.5 Flash

---

## 1. Cosa fa Verso (oggi)

Verso è un assistente AI per candidature di lavoro. L'utente carica il CV, incolla un annuncio, e ottiene:
- **Pre-screening onesto** — dealbreaker, gap analysis, domande di approfondimento
- **CV adattato** — tailoring strutturale e contenutistico via patch AI
- **Score di compatibilità** — match score, ATS score, honest score
- **PDF esportabile** — 2 template ATS-safe

**Flusso principale:**
```
Signup → Upload CV (PDF) → Parsing AI → Preview + Edit
    ↓
Nuova Candidatura → Job Input → Pre-screening → Tailoring → Score → Export PDF
    ↓
Dashboard Home ←→ Candidature (tracker con stati)
```

---

## 2. Tech Stack

| Layer | Scelta |
|-------|--------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui + Framer Motion |
| Icone | @phosphor-icons/react (duotone, regular, fill) |
| Backend / DB | Supabase (Auth, DB, Storage, Edge Functions) |
| AI | Lovable API Gateway → Google Gemini 2.5 Flash |
| PDF | @react-pdf/renderer |
| State Management | React Context (auth) + React Query (data) |
| Forms | React Hook Form + Zod |
| Toast | Sonner |

---

## 3. Information Architecture

```
/login              → Auth (email/password + Google OAuth)
/reset-password     → Recupero password

/onboarding         → 3 step: upload → parse → preview + edit

/app                → App shell (autenticata)
  /app/home         → Dashboard (CV card, stats, candidature recenti)
  /app/nuova        → Wizard nuova candidatura (5 step)
  /app/candidature  → Lista candidature con stati e note
```

**Mobile:** bottom tab bar (Home | + Nuova | Candidature)
**Desktop:** sidebar sinistra

---

## 4. Database Schema (implementato)

```sql
-- Profili utente (auto-creati via trigger su signup)
create table profiles (
  user_id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- CV Master (uno per utente, sostituito a ogni nuovo upload)
create table master_cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  parsed_data jsonb,          -- CV strutturato completo
  file_name text,
  file_url text,
  raw_text text,
  source text default 'upload',
  photo_url text,             -- foto estratta dal PDF
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Candidature
create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  company_name text,
  role_title text,
  job_url text,
  job_description text,
  match_score int,
  ats_score int,
  status text default 'draft',   -- draft|inviata|visualizzata|contattato|follow-up|ko
  notes text,
  user_answers jsonb,            -- risposte pre-screening
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CV adattati
create table tailored_cvs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade,
  user_id uuid references auth.users on delete cascade,
  master_cv_id uuid references master_cvs(id),
  tailored_data jsonb,           -- CV dopo patch
  suggestions jsonb,
  skills_match jsonb,
  ats_score int,
  ats_checks jsonb,
  honest_score jsonb,
  pdf_url text,
  template_id text,
  created_at timestamptz default now()
);

-- Cache job scraping (7 giorni)
create table job_cache (
  url_hash text primary key,     -- SHA-256 dell'URL
  job_data jsonb,
  created_at timestamptz default now()
);
```

**RLS:** ogni utente accede solo ai propri dati su tutte le tabelle.
**Trigger:** auto-create profilo su signup + auto-update `updated_at`.

---

## 5. Schema CV (ParsedCV)

Lo schema CV è molto più ricco rispetto al piano MVP:

```json
{
  "personal": {
    "name": "", "email": "", "phone": "", "location": "",
    "linkedin": "", "website": ""
  },
  "summary": "",
  "experience": [{
    "company": "", "role": "", "start": "", "end": "",
    "current": false, "description": "", "bullets": []
  }],
  "education": [{
    "institution": "", "degree": "", "field": "",
    "start": "", "end": "",
    "grades": "", "honors": "", "programs": "", "publications": ""
  }],
  "skills": {
    "technical": [], "soft": [], "tools": [],
    "languages": [{ "language": "", "level": "" }]  // livelli CEFR
  },
  "certifications": [{ "name": "", "issuer": "", "year": "" }],
  "projects": [{ "name": "", "description": "" }],
  "extra": []  // hobbies, volunteering, awards, etc.
}
```

---

## 6. Features implementate

### F1 — Auth + App Shell
- Login/signup email + Google OAuth + password reset
- App shell responsive (sidebar desktop / tab bar mobile)
- Brand system dark mode, Phosphor icons, Framer Motion
→ [epic-01-setup.md](epic-01-setup.md)

### F2 — Onboarding (3 step)
- Upload PDF (drag & drop, max 10 MB)
- Parsing AI multimodale (Gemini 2.5 Flash, estrazione foto)
- Preview con edit inline di tutte le sezioni
→ [epic-02-onboarding.md](epic-02-onboarding.md)

### F3 — Wizard Nuova Candidatura (5 step)
- Job input (URL con scraping + cache, o testo)
- Pre-screening AI (dealbreaker, gap analysis, follow-up questions)
- CV tailoring (patch-based, strutturale + contenutistico)
- Analisi score (match, ATS 7 check, honest score)
- Export PDF (2 template, download + upload storage)
→ [epic-03-nuova-candidatura.md](epic-03-nuova-candidatura.md)

### F4 — AI Engine (4 Edge Functions)
- `parse-cv` — parsing multimodale PDF → JSON
- `scrape-job` — scraping URL + cache 7gg
- `ai-prescreen` — analisi gap e dealbreaker
- `ai-tailor` — tailoring patch-based + score
→ [epic-04-ai-engine.md](epic-04-ai-engine.md)

### F5 — Export PDF + Dashboard
- 2 template (Classico, Minimal) con @react-pdf/renderer
- Dashboard con 3 stati (no CV / no candidature / lista)
- Stats: candidature attive, score medio, stato CV
→ [epic-05-export-dashboard.md](epic-05-export-dashboard.md)

### F6 — Candidature (Tracker)
- Lista candidature con sezione bozze separata
- Gestione stati (draft → inviata → visualizzata → contattato → follow-up → ko)
- Edit drawer (stato, note, download CV)
→ [epic-06-candidature.md](epic-06-candidature.md)

---

## 7. Cosa NON è stato implementato

| Feature | Stato |
|---------|-------|
| Settings / Profilo | Non implementato (solo nome da auth metadata) |
| Template Pro (Executive, Moderno) | Non implementato |
| Export DOCX | Non implementato |
| Landing page pubblica | Non implementata |
| Real-time updates | Non implementato (refresh manuale) |
| Freemium / Piano Pro | Non implementato |
| Dettaglio candidatura (pagina dedicata) | Non implementato |

---

## 8. Lingua

- **UI:** solo italiano
- **Contenuto CV:** preserva la lingua originale
- **Tailoring:** output nella lingua dell'annuncio
- **Analisi AI:** sempre in italiano

---

*VERSO PRD App — Documentazione dello sviluppato*
