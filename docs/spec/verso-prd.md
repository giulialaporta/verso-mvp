# VERSO — Product Requirements Document (PRD)
> Version 1.1 | Target: Lovable AI Builder
> Stack: React + TypeScript + Supabase + Tailwind + shadcn/ui
> Brand reference: `brand-system/brand-system.md` (caricare sempre insieme a questo file)

---

## 1. Product Vision

**Cos'è Verso?**
Verso aiuta chiunque stia cercando lavoro a fare candidature più intelligenti. Per ogni annuncio, adatta automaticamente il CV e scrive una cover letter, studia l'azienda, calcola quanto il profilo è adatto al ruolo e indica cosa fare per migliorare — senza mai inventare nulla.

**Promessa:**
*Candidature più intelligenti. Sempre oneste.*

**Principio di onestà (non negoziabile):**
Verso non inventa competenze, non cambia date, non aggiunge esperienze inesistenti. Prende quello che l'utente ha davvero fatto e lo racconta nel modo più efficace per quella specifica opportunità. Ogni modifica è visibile, spiegata e approvata dall'utente.

**Monetizzazione:** Freemium
- **Free:** 1 candidatura, 2 template (Classico, Minimal), export PDF.
- **Versō Pro (€9.90/mese):** candidature illimitate, tutti i template, export PDF + DOCX (futuro).

---

## 2. User Personas

**Marco, 31, Product Manager** — Job hunting attivo, 10–20 candidature/mese. CV solido ma generico. Vuole qualità, non volume.

**Giulia, 27, Designer** — Career switcher, vuole capire i gap e come migliorare. Usa principalmente mobile.

**Roberto, 48, Responsabile commerciale** — Non tecnologico, CV in Word non aggiornato da anni. Ogni termine tecnico è un ostacolo.

> **Principio UX:** Nessun jargon tecnico nell'UI. L'app è per qualsiasi professionista.

---

## 3. Tech Stack

| Layer | Scelta |
|-------|--------|
| Frontend | Lovable (React + TypeScript + Tailwind + shadcn/ui) |
| Backend / DB | Supabase (Auth, DB, Storage, Edge Functions) |
| AI Gateway | Edge Function → Claude API / OpenAI (provider-agnostic) |
| Web Research | Edge Function → Search API (Brave/Serper) + scraping |
| State | Zustand |
| Drag & Drop | @dnd-kit/core |
| Animation | Framer Motion |
| Icone | @phosphor-icons/react |
| PDF/DOCX | react-pdf + docx.js |
| Rich Text | Tiptap |

---

## 4. Information Architecture

```
/                          → Landing page
/login                     → Accesso (email + Google OAuth)
/onboarding                → Configurazione iniziale

/app                       → App shell (autenticata)
  /app/home                → Dashboard
  /app/candidature         → Kanban board
  /app/candidature/:id     → Dettaglio candidatura
  /app/nuova               → Nuova candidatura (wizard)
  /app/profilo             → Profilo + CV master
  /app/impostazioni        → Impostazioni
```

**Mobile:** bottom tab bar (Home | Candidature | + | Profilo | Impostazioni)
**Desktop:** sidebar sinistra (collapsed/expanded)

---

## 5. Database Schema (Supabase)

```sql
profiles (
  id uuid references auth.users primary key,
  full_name text,
  email text,
  avatar_url text,
  plan text default 'free',
  ai_provider text default 'claude',
  linkedin_connected boolean default false,
  gmail_connected boolean default false,
  outlook_connected boolean default false,
  tailoring_count_this_month int default 0,
  created_at timestamptz default now()
)

master_cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  content jsonb,
  raw_text text,
  source text,            -- 'upload' | 'editor' | 'linkedin'
  version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

cv_templates (
  id uuid primary key default gen_random_uuid(),
  name text,
  description text,
  thumbnail_url text,
  structure jsonb,
  is_pro boolean default false,
  created_at timestamptz default now()
)

applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  company_name text not null,
  company_logo_url text,
  company_description text,
  company_sector text,
  company_size text,
  company_insights jsonb,
  company_insights_sources jsonb,
  role_title text not null,
  role_description text,
  role_url text,
  status text default 'inviata',
  match_score int,
  match_score_breakdown jsonb,
  ats_score int,
  tailored_cv_id uuid references tailored_cvs(id),
  cover_letter_id uuid references cover_letters(id),
  template_id uuid references cv_templates(id),
  notes text,
  applied_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

tailored_cvs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id),
  user_id uuid references profiles(id),
  content jsonb,
  diff jsonb,
  pdf_url text,
  docx_url text,
  share_token text unique,
  ai_provider text,
  ats_score int,
  ats_checks jsonb,
  seniority_match jsonb,
  honest_score jsonb,
  created_at timestamptz default now()
)

cover_letters (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id),
  user_id uuid references profiles(id),
  content text,
  diff_from_base text,
  pdf_url text,
  docx_url text,
  ai_provider text,
  created_at timestamptz default now()
)

skill_gaps (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id),
  skill_name text,
  skill_label text,
  importance text,
  user_has boolean default false,
  course_suggestions jsonb,
  created_at timestamptz default now()
)

application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id),
  event_type text,
  old_status text,
  new_status text,
  metadata jsonb,
  created_at timestamptz default now()
)

email_threads (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id),
  user_id uuid references profiles(id),
  thread_id text,
  provider text,
  subject text,
  last_message_at timestamptz,
  messages jsonb,
  created_at timestamptz default now()
)
```

**CV Content JSON Schema:**
```json
{
  "personal": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "" },
  "summary": "",
  "experience": [{ "company": "", "role": "", "start": "", "end": "", "current": false, "bullets": [] }],
  "education": [{ "institution": "", "degree": "", "field": "", "start": "", "end": "" }],
  "skills": { "technical": [], "soft": [], "languages": [] },
  "certifications": [{ "name": "", "issuer": "", "date": "" }],
  "projects": [{ "name": "", "description": "", "url": "" }]
}
```

---

## 6. Features

| # | Feature | Descrizione | Epic |
|---|---------|-------------|------|
| F1 | Onboarding | Wizard 3 step: upload CV, connessione account, setup profilo. | [Epic 01](epics/epic-01-onboarding.md) |
| F2 | Nuova Candidatura | Wizard 4 step: annuncio → analisi AI + ricerca azienda → template → CV e lettera pronti. | [Epic 02](epics/epic-02-nuova-candidatura.md) |
| F3 | Application Tracker | Kanban 5 colonne (desktop) / lista con swipe (mobile) per tracciare tutte le candidature. | [Epic 03](epics/epic-03-application-tracker.md) |
| F4 | Dettaglio Candidatura | Vista completa: CV, lettera, info azienda, gap analysis, email, note. | [Epic 04](epics/epic-04-dettaglio-candidatura.md) |
| F5 | Profilo e Master CV | Editor Tiptap per CV master, skill cloud, versioni CV, account collegati. | [Epic 05](epics/epic-05-profilo-master-cv.md) |
| F6 | AI Engine | 3 edge functions: ricerca azienda, analisi + scoring, tailoring CV + cover letter. | [Epic 06](epics/epic-06-ai-engine.md) |
| F7 | Versō Pro | 1 candidatura Free, Pro €9.90/mese illimitato, Stripe Checkout, gate template. | [Epic 07](../backlog/epic-07-verso-pro.md) |
| F8 | Impostazioni | Account, integrazioni, provider AI, piano, notifiche. | [Epic 08](epics/epic-08-settings.md) |

---

## 7. Non-Functional Requirements

- **FCP** < 1.5s su 4G
- **AI streaming:** primi risultati entro 3s
- **PDF generation:** < 5s
- **Kanban drag:** 60fps
- **Sicurezza:** API key solo in edge functions, OAuth token cifrati, RLS su tutti i dati, signed URL per file
- **Accessibilità:** WCAG 2.1 AA, keyboard nav completa, screen reader labels, plain language ovunque
- **Offline:** lista candidature cached (service worker), wizard richiede connessione

---

## 8. Out of Scope (v1)

- App nativa iOS/Android (PWA sufficiente)
- Job discovery / ricerca offerte
- Multi-utente / team
- Integrazione ATS (Greenhouse, Lever, Workday)
- Calendario / scheduling colloqui
- AI interview prep
- Generazione CV da zero (serve CV esistente)

---

## 9. Build Order per Lovable

1. Auth + Supabase setup
2. Onboarding wizard
3. Wizard nuova candidatura (con stub template e company research)
4. Kanban board
5. Dettaglio candidatura
6. CV tailoring + cover letter + export
7. Template system
8. Gap analysis + corsi
9. Profilo + editor CV
10. Company research edge function (completa)
11. Email integration
12. Freemium gates + Stripe
13. Link condivisibile
14. LinkedIn import
15. Settings
16. Polish (animazioni, empty states, error states, PWA)

---

## 10. Design

> Caricare sempre `brand-system/brand-system.md` — tutte le decisioni di design devono conformarsi.

- Dark mode only. Background `#0C0D10`. Mai bianco.
- Accent `#A8FF78` (lime green) — solo CTA e score.
- Font: Syne (headline), DM Sans (body), JetBrains Mono (numeri/label/chip).
- Mobile bottom tab bar, no hamburger menu.
- Loading: skeleton only, no spinner.
- Tono: diretto, asciutto, leggermente caldo. Mai jargon. Mai corporate enthusiasmo.
- La parola "onesto" deve apparire almeno una volta per sessione dove si generano documenti.

---

*VERSO PRD v1.1 — Pronto per build Lovable*
*Usare insieme a: `brand-system/brand-system.md` | Dettagli feature: `epics/`*
