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

**Parallelismo:** al confirm dell'annuncio (step 0→1), il frontend lancia in parallelo sia `ai-prescreen` che `ai-tailor` (mode: `analyze`). Il risultato dell'analisi viene cachato in un ref e riusato allo step 3 se l'utente non risponde alle domande di follow-up.

**Cosa analizza:**
- **Dealbreaker** — gap critici non colmabili (critical/significant)
- **Requirements matrix** — requisiti classificati come mandatory/preferred/nice_to_have
- **Follow-up questions** — max 5 domande per gap colmabili, ciascuna con 3-4 **answer chips** contestuali (opzioni specifiche alla domanda, da match forte a negativo)
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

`ai-tailor` opera in due modalità separate:
- **`mode: "analyze"`** (task `ai-tailor-analyze`, Haiku 4.5) — scoring, ATS check, skills analysis. Chiamata in parallelo con il pre-screening.
- **`mode: "tailor"`** (task `ai-tailor`, Sonnet 4) — generazione patch CV effettiva. Chiamata solo quando l'utente procede allo step 3.

Se l'utente non risponde alle domande di follow-up, il risultato `analyze` cachato viene usato immediatamente (nessuna seconda chiamata).

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

**CV Review integrata nel prompt:**
Le 10 regole di revisione qualita' HR (uniformita' lingua, bullet con verbi d'azione, deduplicazione skill, formato date, ecc.) sono ora integrate direttamente nel system prompt di `ai-tailor` (sezione "CV QUALITY RULES"). Non c'e' piu' una chiamata separata a `cv-review` nel flusso wizard. L'endpoint `cv-review` resta disponibile ma non e' usato dal wizard.

---

## Step 4: Revisione

Riepilogo di cosa e' cambiato nel CV, con confronto originale vs adattato.

**SkillManager (riordinamento e visibilita' skill):**
- Componente `SkillManager` integrato nello step di revisione
- Ogni skill e' un chip con frecce su/giu' per riordinare e icona occhio per nascondere/mostrare
- Le skill nascoste non appaiono nel PDF/DOCX ma restano nel JSON
- Conversione da skills categorizzate (technical/soft/tools) a lista piatta gestita (ManagedSkill[])
- Al salvataggio: le skill visibili vengono riassegnate nella struttura originale

**Score compatti (in alto):**
- Match Score (0-100) — barra compatta (componente `MatchScore`, rinominato da `VersoScore`)
- ATS Score (0-100) — barra compatta

**Blocco "Cosa ho cambiato":**
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

## Step 5: Export PDF + DOCX

Step a pagina intera del wizard (non drawer separato come nel piano MVP).

**Revisione formale automatica:**
- Al mount dello step, viene chiamata `cv-formal-review` in background
- Il revisore AI controlla coerenza date, maiuscole, lingua, bullet, punteggiatura
- Status visibile: "Revisione in corso..." → "N correzioni applicate" (con lista espandibile)
- Se la review fallisce, viene usato il CV originale (nessun blocco)
- Il CV revisionato viene usato per tutti gli export (PDF e DOCX)

**Template disponibili:**
- **Classico** — header scuro, body bianco, DM Sans (free)
- **Minimal** — tutto bianco, Inter, massima pulizia (free)
- **Executive** — layout professionale con sidebar (Pro-only)
- **Moderno** — design contemporaneo con colori accent (Pro-only)

**Template Pro-only:** i template Executive e Moderno mostrano icona lucchetto per utenti Free. Click → redirect a `/upgrade`.

**Azioni:**
- Selezione template (card con bordo accent sulla selezionata)
- Preview PDF live che si aggiorna al cambio template
- Badge ATS Score e Confidence in basso
- **Download PDF** locale + upload automatico su Supabase Storage
- **Download DOCX** (Pro-only) — genera file .docx con libreria `docx`, stile adattato al template selezionato. Icona lucchetto + Crown per utenti Free.
- Upload automatico su Supabase Storage (`cv-exports/{userId}/{applicationId}/`)

**Nome file:** `CV-{Nome}-{Azienda}.pdf` / `CV-{Nome}-{Azienda}.docx`

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
| `StepAnnuncio` | 0 (Annuncio) | `src/components/wizard/StepAnnuncio.tsx` |
| `StepVerifica` | 1 (Verifica) | `src/components/wizard/StepVerifica.tsx` |
| `StepTailoring` | 2 (Analisi) | `src/components/wizard/StepTailoring.tsx` |
| `StepRevisione` | 3 (CV Adattato) | `src/components/wizard/StepRevisione.tsx` — include loading animato del tailoring |
| `StepExport` | 4 (Download) | `src/components/wizard/StepExport.tsx` |
| `StepCompleta` | 5 (Fatto) | `src/components/wizard/StepCompleta.tsx` |
| `StepIndicator` | — | `src/components/wizard/StepIndicator.tsx` |
| `wizard-types.ts` | — | Type definitions (JobData, PrescreenResult, AnalyzeResult, TailorResult) |
| `wizard-utils.ts` | — | Utilities (applyPatchesFrontend, computeConfidence, useAnimatedCounter, getDomainHint) |
| `SkillManager.tsx` | 3 | Riordinamento skill (frecce su/giu') + toggle visibilita' (occhio) |

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
| Template | 4 (2 free + 2 pro) | 4 (2 free: Classico, Minimal + 2 Pro: Executive, Moderno) |
| DOCX | Previsto | Implementato (libreria `docx`, Pro-only, 4 stili template) |
| Formal review | Non prevista | Implementata (cv-formal-review, automatica allo step export) |
| Skill management | Non previsto | Implementato (SkillManager: riordinamento + visibilita') |
| Bozze | Non previste | Implementate con ripresa |
| Lingua CV | Non specificata | Adattata alla lingua dell'annuncio |
