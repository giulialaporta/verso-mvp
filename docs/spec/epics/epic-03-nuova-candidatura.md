# Epic 03 — Wizard Nuova Candidatura (6 Step) (Implementato)

---

## Cosa è stato costruito

Pagina `/app/nuova` — wizard a 6 step che guida l'utente dall'inserimento dell'annuncio fino al completamento della candidatura.

> **Differenza dal piano MVP:** il piano prevedeva 3 step (annuncio → analisi → diff view). Implementati 6 step con pre-screening, patch-based tailoring, cv-review, export integrato e step "Prossimi passi".

---

## Step 1: Job Input

**Due modalità di input:**

**URL:**
- Campo input per incollare il link all'offerta
- Chiama Edge Function `scrape-job`
- Cache 7 giorni (hash SHA-256 dell'URL)
- Loading: skeleton durante lo scraping

**Testo:**
- Textarea per incollare il testo dell'annuncio direttamente
- Invio diretto a AI per estrazione dati

**Dati estratti dall'annuncio:**
- `company_name` — nome azienda
- `role_title` — titolo ruolo
- `location` — sede
- `job_type` — tipo contratto
- `description` — descrizione completa
- `requirements` — requisiti chiave
- `required_skills` — competenze richieste
- `nice_to_have` — competenze preferenziali

**Preview card:** mostra dati estratti (azienda, ruolo, requisiti) — editabili inline.

**Errore URL:** messaggio di errore + suggerimento di incollare il testo direttamente.

---

## Step 2: Pre-screening AI (NUOVO — non nel piano MVP)

Chiama Edge Function `ai-prescreen` con CV master + job posting.

**Cosa analizza:**
- **Dealbreaker** — gap critici non colmabili (critical/significant)
- **Requirements matrix** — requisiti classificati come mandatory/preferred/nice_to_have
- **Follow-up questions** — max 5 domande per gap colmabili
- **Feasibility** — valutazione low/medium/high
- **Salary analysis** (opzionale) — confronto retributivo candidato vs posizione

**UI:**
- Se ci sono dealbreaker → mostrati con indicazione di severità
- Se ci sono gap colmabili → domande di follow-up presentate all'utente
- L'utente può rispondere alle domande (risposte salvate in `applications.user_answers`)
- Le risposte vengono passate allo step successivo per migliorare il tailoring
- Se disponibile salary analysis → card `SalaryAnalysisCard` con barre animate, delta percentuale, nota

**Salary analysis:**
- Attivata se l'utente ha `salary_expectations` nel profilo OPPURE l'annuncio menziona un range RAL
- Mostra: aspettativa candidato, range posizione, delta (positive/neutral/negative), nota esplicativa
- Fonte dati indicata con badge: "Da te", "Dall'annuncio", "Stimata"

**Output tutto in italiano.**

---

## Step 3: CV Tailoring

Chiama Edge Function `ai-tailor` con CV master + job posting + analisi pre-screening + risposte utente.

**Controlli utente prima del tailoring:**

- **Language selector:** l'utente puo' scegliere la lingua del CV output (Italiano/English), sovrascrivendo quella rilevata automaticamente. La lingua selezionata viene passata ad `ai-tailor` nel campo `detected_language` e usata anche per l'export PDF.
- **Skill overrides:** l'utente puo' cliccare su una skill nella lista "Ti mancano" per dire "ce l'ho" → la skill si sposta nella lista "Hai gia'" (bordo tratteggiato). Le skill overriddate vengono escluse da `skills_missing` prima di chiamare `ai-tailor` e passate come `skills_overridden`. Click di nuovo per annullare.

**Approccio patch-based (diverso dal piano MVP):**
- Non genera un CV completo sostitutivo
- Genera **patch JSON** (path → nuovo valore) per i soli campi da modificare
- Le patch vengono applicate al CV master per ottenere il CV adattato

**Due livelli di tailoring:**

**Strutturale:**
- Rimuovere esperienze irrilevanti (mai tutte — minimo 2)
- Riordinare per rilevanza rispetto al ruolo
- Condensare bullet point secondari

**Contenutistico:**
- Riscrivere summary per allinearlo al ruolo
- Riscrivere bullet con verbi d'azione + metriche
- Riordinare skill per rilevanza
- Usare keyword dall'annuncio in modo naturale

**Protezioni:**
- Mai inventare esperienze o skill
- Mai modificare date, nomi aziende, titoli
- Mai rimuovere più del 50% delle esperienze
- Sempre almeno 2 esperienze nel CV finale

**Output:** array di patch + reason per ogni modifica + structural changes + honest_score

**Post-tailoring — CV Review:**
Dopo l'applicazione delle patch, il CV adattato viene passato automaticamente alla Edge Function `cv-review` per una revisione qualita' HR (uniformita' lingua, bullet con verbi d'azione, deduplicazione skill, formato date, ecc.). Se la review fallisce, il CV originale tailored viene usato senza bloccare il flusso.

---

## Step 4: Revisione

Riepilogo di cosa e' cambiato nel CV, con confronto originale vs adattato.

**Score compatti (in alto):**
- Match Score (0-100) — barra compatta
- ATS Score (0-100) — barra compatta

**Blocco "Cosa abbiamo cambiato":**
- Contatori calcolati dal frontend (confronto CV originale vs tailored):
  - Bullet riscritti (su totale)
  - Esperienze riordinate
  - Esperienze rimosse
  - Summary riscritto
  - Skill rimosse
- Confidence calcolato dal frontend (non dall'AI)
- Label "Verificato" sempre presente

**Diff view (collassata di default):**
- Toggle "Mostra modifiche" espande la lista di diff
- Ogni diff: testo originale (rosso) → testo suggerito (verde) + reason
- Structural changes (esperienze rimosse) incluse

---

## Step 5: Export PDF

Step a pagina intera del wizard (non drawer separato come nel piano MVP).

**Template disponibili:**
- **Classico** — header scuro, body bianco, DM Sans
- **Minimal** — tutto bianco, Inter, massima pulizia

**Azioni:**
- Selezione template (card con bordo accent sulla selezionata)
- Preview PDF live che si aggiorna al cambio template
- Badge ATS Score e Confidence in basso
- Download PDF locale
- Upload automatico su Supabase Storage (`cv-exports/{userId}/{applicationId}/`)

**Nome file:** `CV-{Nome}-{Azienda}.pdf`

**Al completamento:**
- Crea record in `applications` (company_name, role_title, job_url, job_description, match_score, ats_score, status='draft')
- Crea record in `tailored_cvs` (tailored_data, suggestions, skills_match, ats_score, ats_checks, honest_score, pdf_url, template_id)

---

## Step 6: Completa (Prossimi passi)

Step finale che guida l'utente dopo l'export.

**Contenuto:**
- Titolo "Candidatura pronta!" con icona Target
- Ruolo + azienda + match score

**3 card azione:**
- **"Ho inviato la candidatura"** → update status a `inviata`, redirect a `/app/candidature`
- **"La inviero' dopo"** → status resta `draft`, redirect a `/app/home`
- **"Nuova candidatura"** → redirect a `/app/nuova` (wizard pulito)

---

## Architettura componenti

Il wizard è stato refactored da monolitico (Nuova.tsx ~1450 righe) a componenti modulari:

| Componente | Step | File |
|------------|------|------|
| `StepAnnuncio` | 0 | `src/components/wizard/StepAnnuncio.tsx` |
| `StepVerifica` | 1 | `src/components/wizard/StepVerifica.tsx` |
| `StepTailoring` | 2 | `src/components/wizard/StepTailoring.tsx` |
| `StepRevisione` | 3 | `src/components/wizard/StepRevisione.tsx` |
| `StepExport` | 4 | `src/components/wizard/StepExport.tsx` |
| `StepCompleta` | 5 | `src/components/wizard/StepCompleta.tsx` |
| `StepIndicator` | — | `src/components/wizard/StepIndicator.tsx` |
| `wizard-types.ts` | — | Type definitions (JobData, PrescreenResult, AnalyzeResult, TailorResult) |
| `wizard-utils.ts` | — | Utilities (applyPatchesFrontend, computeConfidence, useAnimatedCounter, getDomainHint) |

**State management:** step corrente via URL query param `?step=N`. Draft resumption via `?draft=ID`.

---

## Supporto bozze

- Una candidatura viene creata come `draft` all'inizio dello Step 1
- Le bozze sono riprendibili dalla pagina Candidature con pulsante "Riprendi" (`?draft=ID`)
- Il resume ricarica: jobData, userAnswers, overriddenSkills, analyzeResult, tailorResult
- Status iniziale di ogni candidatura: `draft`

---

## Rilevamento lingua

- L'analisi AI è sempre in italiano (per coerenza UX)
- La lingua del CV viene rilevata automaticamente dall'annuncio
- L'utente puo' sovrascrivere la lingua con il language selector (IT/EN) nello step 3
- La lingua selezionata viene usata sia per il tailoring che per l'export PDF

---

## Differenze dal piano MVP

| Area | Piano | Implementato |
|------|-------|-------------|
| Step totali | 3 | 6 |
| Pre-screening | Non previsto | Step dedicato con dealbreaker + follow-up |
| Tailoring | CV completo sostituito | Patch-based (solo modifiche) |
| Diff view | 2 colonne originale/adattato | Non implementata come diff visuale |
| Export | Drawer separato | Integrato come step 5 |
| Template | 4 (2 free + 2 pro) | 2 (entrambi free) |
| DOCX | Previsto | Non implementato |
| Bozze | Non previste | Implementate con ripresa |
| Lingua CV | Non specificata | Adattata alla lingua dell'annuncio |
