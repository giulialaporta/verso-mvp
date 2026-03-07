# Epic 03 — Wizard Nuova Candidatura (5 Step) (Implementato)

---

## Cosa è stato costruito

Pagina `/app/nuova` — wizard a 5 step che guida l'utente dall'inserimento dell'annuncio fino all'export del CV adattato.

> **Differenza dal piano MVP:** il piano prevedeva 3 step (annuncio → analisi → diff view). Implementati 5 step con pre-screening, patch-based tailoring, e export integrato.

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

---

## Step 4: Analisi e Score

Presenta i risultati dell'analisi AI:

**Match Score (0-100):**
- Compatibilità complessiva CV-ruolo
- Visualizzato con barra gradiente animata (Framer Motion)

**ATS Score (0-100) con 7 check:**
1. Keywords — parole chiave presenti
2. Format — struttura leggibile
3. Dates — date coerenti
4. Measurable — risultati misurabili
5. Clichés — assenza di cliché
6. Sections — sezioni standard
7. Action verbs — verbi d'azione

Ogni check: pass (verde) / warning (giallo) / fail (rosso)

**Honest Score:**
- Confidence (0-100)
- Contatori: esperienze aggiunte, skill inventate, date modificate, bullet riposizionati, bullet riscritti
- Se confidence < 90: flag sezioni da rivedere

---

## Step 5: Export PDF

Integrato nel wizard (non drawer separato come nel piano MVP).

**Template disponibili:**
- **Classico** — header scuro, body bianco, DM Sans
- **Minimal** — tutto bianco, Inter, massima pulizia

**Azioni:**
- Selezione template
- Preview ATS score + 7 check
- Preview Honest Score
- Download PDF locale
- Upload automatico su Supabase Storage (`cv-exports/{userId}/{applicationId}/`)

**Nome file:** `CV-{Nome}-{Azienda}.pdf`

**Al completamento:**
- Crea record in `applications` (company_name, role_title, job_url, job_description, match_score, ats_score, status='draft')
- Crea record in `tailored_cvs` (tailored_data, suggestions, skills_match, ats_score, ats_checks, honest_score, pdf_url, template_id)

---

## Supporto bozze

- Una candidatura può essere salvata come **draft** in qualsiasi momento
- Le bozze sono riprendibili dalla pagina Candidature con pulsante "Riprendi"
- Status iniziale di ogni candidatura: `draft`

---

## Rilevamento lingua

- L'analisi AI è sempre in italiano (per coerenza UX)
- Il contenuto del CV tailored è nella lingua dell'annuncio
- Se l'annuncio è in inglese, il CV viene adattato in inglese

---

## Differenze dal piano MVP

| Area | Piano | Implementato |
|------|-------|-------------|
| Step totali | 3 | 5 |
| Pre-screening | Non previsto | Step dedicato con dealbreaker + follow-up |
| Tailoring | CV completo sostituito | Patch-based (solo modifiche) |
| Diff view | 2 colonne originale/adattato | Non implementata come diff visuale |
| Export | Drawer separato | Integrato come step 5 |
| Template | 4 (2 free + 2 pro) | 2 (entrambi free) |
| DOCX | Previsto | Non implementato |
| Bozze | Non previste | Implementate con ripresa |
| Lingua CV | Non specificata | Adattata alla lingua dell'annuncio |
