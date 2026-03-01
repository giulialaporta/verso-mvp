# VERSO — PRD MVP
> Target: Lovable AI Builder
> Stack: React + TypeScript + Supabase + Tailwind + shadcn/ui
> Brand reference: `../brand-system.md`

---

## 1. Obiettivo dell'MVP

Validare l'ipotesi core: **un utente può caricare il suo CV, incollare un annuncio di lavoro, e ottenere un CV adattato con score di compatibilità, scaricabile in PDF.**

Un solo flusso lineare, nessuna funzionalità secondaria.

**Flusso:**
```
Signup → Upload CV (PDF) → Incolla annuncio → Score + CV adattato → Scarica PDF
```

---

## 2. Tech Stack

| Layer | Scelta |
|-------|--------|
| Frontend | Lovable (React + TypeScript + Tailwind + shadcn/ui) |
| Backend / DB | Supabase (Auth, DB, Storage, Edge Functions) |
| AI | Supabase Edge Function → Claude API |
| PDF Export | react-pdf o jspdf + html2canvas |
| Animation | Framer Motion |
| Icone | @phosphor-icons/react |

---

## 3. Information Architecture

```
/login              → Accesso (email + Google OAuth)
/onboarding         → Upload CV (1 step)

/app                → App shell (autenticata)
  /app/home         → Dashboard (lista candidature semplice)
  /app/nuova        → Wizard nuova candidatura (3 step)
```

**Mobile:** bottom tab bar (Home | + Nuova)
**Desktop:** sidebar sinistra minimale

---

## 4. Database Schema

Solo le tabelle necessarie all'MVP:

```sql
-- Profilo utente
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  plan text default 'free',
  created_at timestamptz default now()
);

-- CV Master (uno per utente)
create table master_cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  content jsonb,
  raw_text text,
  source text default 'upload',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Candidature
create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  company_name text not null,
  role_title text not null,
  role_description text,
  role_url text,
  match_score int,
  ats_score int,
  template_id text default 'classico',
  created_at timestamptz default now()
);

-- CV adattati
create table tailored_cvs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content jsonb,
  diff jsonb,
  pdf_url text,
  ats_score int,
  ats_checks jsonb,
  seniority_match jsonb,
  honest_score jsonb,
  template_id text default 'classico',
  created_at timestamptz default now()
);

-- RLS su tutte le tabelle: utente accede solo ai propri dati
```

**CV Content JSON Schema:**
```json
{
  "personal": { "name": "", "email": "", "phone": "", "location": "" },
  "summary": "",
  "experience": [{ "company": "", "role": "", "start": "", "end": "", "current": false, "bullets": [] }],
  "education": [{ "institution": "", "degree": "", "field": "", "start": "", "end": "" }],
  "skills": { "technical": [], "soft": [], "languages": [] },
  "certifications": [{ "name": "", "issuer": "", "date": "" }],
  "projects": [{ "name": "", "description": "" }]
}
```

---

## 5. Features MVP

### F1 — Auth
- Login/signup con email + Google OAuth
- Tabella profiles con trigger auto-create
- RLS su tutte le tabelle
- Redirect: non autenticato → `/login`, autenticato → `/app/home`

### F2 — Onboarding (1 step)
- Upload PDF
- Edge function: parsing PDF → estrazione testo → strutturazione in JSON schema CV
- Salvataggio in `master_cvs`
- Loading: "Verso sta leggendo il tuo CV..."
- Errore: "Non riesco a leggere questo file. Prova con un altro PDF."
- Dopo parsing: mostra anteprima dati estratti → CTA "Continua"

### F3 — Wizard Nuova Candidatura (3 step)
**Step 1: L'annuncio**
- Campo URL + pulsante "Analizza" (edge function: fetch server-side + estrazione testo)
- Textarea fallback: "Copia e incolla il testo dell'annuncio"
- Preview card con dati estratti (azienda, ruolo) — editabili
- Errore URL: "Non riesco ad aprire questo link. Incolla il testo qui sotto."

**Step 2: Analisi AI**
- Avviata automaticamente dopo step 1
- Edge function chiama Claude API con CV master + job description
- Output: match score (0–100), lista skill possedute/mancanti, suggerimenti di modifica CV
- UI: skeleton durante analisi → score meter (barra gradiente animata) + chip skill verdi/rossi + lista suggerimenti
- Timeout >15s: "L'elaborazione sta richiedendo più del solito. Riprova."

**Step 3: CV adattato**
- Diff view: originale vs adattato (desktop: 2 colonne, mobile: tab)
- Sezioni modificate evidenziate con border-left accent
- Score badge in alto a destra
- Pulsante "Scarica PDF"
- Pulsante "Salva candidatura" → salva in DB → redirect a `/app/home`

### F4 — AI Engine (1 edge function)
**Endpoint:** `POST /functions/v1/ai-tailor`

Funzione unica che fa analisi + tailoring in una chiamata:

**Input:**
```json
{
  "master_cv": { "...CV JSON..." },
  "job_description": "...",
  "task": "analyze_and_tailor"
}
```

**Output:**
```json
{
  "match_score": 74,
  "ats_score": 82,
  "skills_present": [{ "label": "Gestione del team", "has": true }],
  "skills_missing": [{ "label": "Analisi dei dati", "importance": "essenziale" }],
  "seniority_match": {
    "candidate_level": "mid",
    "role_level": "senior",
    "match": false,
    "note": "Il ruolo richiede 8+ anni di esperienza, il candidato ne ha 5."
  },
  "ats_checks": [
    { "check": "keywords", "label": "Parole chiave presenti", "status": "pass", "detail": "7 su 9 keyword trovate" }
  ],
  "honest_score": {
    "confidence": 97,
    "experiences_added": 0,
    "skills_invented": 0,
    "dates_modified": 0,
    "bullets_repositioned": 3,
    "bullets_rewritten": 2,
    "sections_removed": 0,
    "flags": []
  },
  "tailored_cv": { "...CV JSON adattato..." },
  "diff": [{ "section": "experience", "original": "...", "suggested": "...", "reason": "..." }]
}
```

**Regole AI (system prompt):**
- MAI inventare esperienze, certificazioni o competenze
- MAI modificare date, nomi aziende o titoli di ruolo
- PUÒ riordinare bullet point per rilevanza
- PUÒ riscrivere bullet point usando keyword dall'annuncio
- PUÒ adattare il summary ai requisiti del ruolo
- DEVE restituire JSON strutturato
- DEVE eseguire 7 check ATS (keyword, formato, date, risultati misurabili, cliché, sezioni standard, verbi d'azione) e restituire `ats_score` + `ats_checks`
- DEVE verificare coerenza seniority candidato vs ruolo e restituire `seniority_match`
- DEVE produrre un `honest_score` con verifica di onestà (contatori per categoria + confidence)
- DEVE applicare calibrazione mercato italiano (laurea magistrale, albi professionali, certificazioni locali)

### F5 — Export PDF
- Genera PDF dal CV adattato (template "Verso Classico": pulito, ATS-friendly, dark header con nome)
- Download diretto nel browser
- Salva URL in `tailored_cvs.pdf_url` (Supabase Storage)

### F6 — Dashboard Home
- Route `/app/home`
- Lista semplice delle candidature salvate (card con: azienda, ruolo, Match Score + ATS Score, data)
- Seniority warning icon se `seniority_match.match` è false
- CTA "Nuova candidatura" se lista vuota
- Tap su card → per ora nessun dettaglio (placeholder)

---

## 6. Design

> Caricare `brand-system.md` su Lovable al primo epic.

- Dark mode only. Background `#0C0D10`.
- Accent `#A8FF78` — solo CTA e score.
- Font: Syne (headline), DM Sans (body), JetBrains Mono (numeri/chip).
- Phosphor Icons.
- Loading: skeleton only, no spinner.
- Score: barra gradiente animata (Framer Motion, 800ms).
- Card: hover `translateY(-2px)`.

---

## 7. Build Order

1. **Epic 01:** Auth + Supabase + app shell + brand system
2. **Epic 02:** Onboarding (upload PDF + parsing)
3. **Epic 03:** Wizard nuova candidatura (3 step)
4. **Epic 04:** Edge function AI (analyze + tailor)
5. **Epic 05:** Export PDF + dashboard home

---

*VERSO PRD MVP — Pronto per Lovable*
