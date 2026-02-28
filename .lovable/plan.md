

# Allineamento Backend alle Nuove Specifiche (Epic 01-04)

Questo piano copre solo le modifiche logiche e backend necessarie per allineare il codice esistente al nuovo PRD. Nessuna modifica UI/styling verra' sovrascritta.

---

## 1. Migrazione Database — Nuove colonne

Le tabelle attuali mancano di colonne richieste dall'Epic 04. Tutte nullable con default, nessun impatto sui dati esistenti.

**Tabella `applications`:**
- `ats_score int` (nuovo)
- `template_id text default 'classico'` (nuovo)

**Tabella `tailored_cvs`:**
- `ats_score int` (nuovo)
- `ats_checks jsonb` (nuovo)
- `seniority_match jsonb` (nuovo)
- `honest_score jsonb` (nuovo)
- `template_id text default 'classico'` (nuovo)
- `diff jsonb` (gia' presente come `suggestions` -- da rinominare o aggiungere colonna `diff` separata)

Nota: attualmente `tailored_cvs` ha `suggestions jsonb` e `tailored_data jsonb`. Il PRD usa `content` e `diff`. Conviene aggiungere `diff jsonb` come nuova colonna e continuare a usare `tailored_data` per il contenuto (rinominarlo sarebbe distruttivo). Il codice frontend mappera' i nomi.

---

## 2. Edge Function `ai-tailor` — Aggiornamento completo

Il system prompt e lo schema di output devono cambiare significativamente.

### Cambiamenti al system prompt:
- Aggiungere le **regole ATS** (7 check specifici: keywords, format, dates, measurable, cliches, sections, action_verbs)
- Aggiungere la sezione **HONEST SCORE** (verifica di onesta' con contatori per categoria + confidence)
- Aggiungere la sezione **SENIORITY MATCH** (confronto livello candidato vs ruolo)
- Aggiungere la **calibrazione mercato italiano** (laurea magistrale, albi professionali, certificazioni locali)
- Aggiornare le regole di onesta' con i divieti specifici (MAI modificare date, nomi aziende, titoli)

### Cambiamenti al tool schema (output JSON):
Da (attuale):
```
match_score, matching_skills[], missing_skills[{skill, importance}],
tailored_cv{}, changes[], summary_note
```

A (nuovo):
```
match_score, ats_score,
skills_present[{label, has}], skills_missing[{label, importance}],
seniority_match{candidate_level, role_level, match, note},
ats_checks[{check, label, status, detail}],
tailored_cv{},
honest_score{confidence, experiences_added, skills_invented,
  dates_modified, bullets_repositioned, bullets_rewritten,
  sections_removed, flags[]},
diff[{section, index, original, suggested, reason}]
```

### Cambiamenti all'input:
Attualmente riceve solo `job_data`. Il nuovo spec prevede anche `company_name`, `role_title`, `task`. Possiamo passare tutto dentro `job_data` come facciamo gia' (contiene company_name e role_title).

---

## 3. Frontend `Nuova.tsx` — Adattamento tipi e salvataggio

### 3a. Tipo `TailorResult` (riga ~48)
Aggiornare per riflettere il nuovo output AI:

```typescript
type TailorResult = {
  match_score: number;
  ats_score: number;
  skills_present: { label: string; has: boolean }[];
  skills_missing: { label: string; importance: string }[];
  seniority_match: {
    candidate_level: string;
    role_level: string;
    match: boolean;
    note: string;
  };
  ats_checks: {
    check: string;
    label: string;
    status: "pass" | "warning" | "fail";
    detail?: string;
  }[];
  tailored_cv: Record<string, unknown>;
  honest_score: {
    confidence: number;
    experiences_added: number;
    skills_invented: number;
    dates_modified: number;
    bullets_repositioned: number;
    bullets_rewritten: number;
    sections_removed: number;
    flags: string[];
  };
  diff: {
    section: string;
    index?: number;
    original: string;
    suggested: string;
    reason: string;
  }[];
  master_cv_id: string;
};
```

### 3b. Step2 — Aggiornare rendering skill
- Cambiare `matching_skills` -> `skills_present` (array di `{label, has}`)
- Cambiare `missing_skills[].skill` -> `missing_skills[].label`
- Cambiare `missing_skills[].importance` valori da "alta/media/bassa" a "essenziale/importante/utile"
- Cambiare `changes` -> `diff` per i suggerimenti

### 3c. Step3 `handleSave` — Salvare i nuovi campi
Quando l'utente salva la candidatura, aggiornare l'application con:
- `ats_score`
- `template_id` (default 'classico')

Salvare nel `tailored_cvs` anche:
- `ats_score`
- `ats_checks`
- `seniority_match`
- `honest_score`
- `diff` (nella colonna `diff`)

### 3d. `handleStep1Confirm` — Salvare `ats_score` nel draft update
Dopo l'analisi AI, aggiornare il draft con sia `match_score` che `ats_score`.

---

## 4. `Home.tsx` — Doppio score (Match + ATS)

Le card nella lista "Ultime candidature" devono mostrare anche `ats_score`. Richiede:
- Aggiungere `ats_score` alla query SELECT
- Mostrare doppio badge nella card (Match Score + ATS Score)

Questo e' un cambiamento minimo e non tocca il layout generale.

---

## 5. Navbar — FAB "+" centrale

Il nuovo PRD specifica: "Mobile: bottom tab bar (Home | + Nuova)". La navbar attuale ha 2 tab (Home, Candidature). Il PRD prevede un bottone "+" centrale per nuova candidatura.

In `AppShell.tsx`:
- Aggiungere un terzo elemento nella `MobileTabBar`: un FAB "+" circolare al centro che naviga a `/app/nuova`
- Desktop sidebar: aggiungere voce "Nuova candidatura" con icona Plus

---

## Riepilogo file coinvolti

| File | Modifica |
|------|----------|
| Migrazione DB | Aggiungere 7 colonne (2 su applications, 5 su tailored_cvs) |
| `supabase/functions/ai-tailor/index.ts` | Nuovo system prompt + nuovo tool schema con ATS, honest_score, seniority |
| `src/pages/Nuova.tsx` | Tipo TailorResult, Step2 rendering, Step3 salvataggio campi extra |
| `src/pages/Home.tsx` | Query ats_score, doppio badge nelle card |
| `src/components/AppShell.tsx` | FAB "+" nella navbar mobile e sidebar desktop |

Nessun file esistente viene riscritto: solo aggiornamenti mirati. Tutto il lavoro UI fatto finora (padding, margini, CV card, draft, Candidature) resta intatto.

