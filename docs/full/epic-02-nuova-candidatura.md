# Epic 02 — Wizard Nuova Candidatura

## Obiettivo

Permettere all'utente di creare una nuova candidatura in 4 step: inserimento annuncio, analisi AI + ricerca azienda, scelta template, revisione CV e lettera generati. È il flusso core del prodotto.

---

## Comportamento

**Trigger:** FAB (+) su mobile, pulsante "Nuova candidatura" su desktop.
**UI:** wizard fullscreen a 4 step con step indicator e navigazione back.
**Step labels in plain language** — nessun termine tecnico.

### Step 1: L'annuncio

Due modalità input (tab switcher):

**URL (default):**
- Campo testo con placeholder "Incolla il link all'offerta di lavoro"
- Pulsante "Analizza" → edge function:
  - Fetch server-side del contenuto URL (no CORS)
  - Strip HTML, estrazione testo job description
  - AI: estrae nome azienda, titolo ruolo, requisiti strutturati
- Loading: "Verso sta leggendo l'annuncio..."
- Successo: preview card con dati estratti (azienda, ruolo, requisiti principali) — editabili dall'utente

**Testo libero:**
- Textarea grande: "Copia e incolla il testo dell'annuncio qui"
- Utile quando l'URL è dietro login o paywall

### Step 2: Verso studia tutto

Avviato automaticamente dopo conferma step 1. Due processi paralleli:

**2a. Ricerca azienda (web research):**
- Edge function chiama Search API (Brave/Serper) + scraping sito azienda
- AI sintetizza in: summary plain-language, culture tags, segnali dimensione, notizie recenti
- Sources list (URLs usati, mostrati come accordion "Fonti" collassato)
- Disclaimer: "Informazioni raccolte da fonti pubbliche. Potrebbero non essere aggiornate."
- Se poche info trovate: "Non ho trovato molte informazioni su questa azienda."

**2b. Analisi profilo + scoring:**
- AI confronta CV master con job description + company insights
- Output: match score composito (0–100), breakdown (profile_fit 50%, role_alignment 30%, company_context 20%), skill match, gap, opportunità tailoring

**UI durante analisi — 4 skeleton card sequenziali:**
"Verso legge l'annuncio..." → "Verso studia l'azienda..." → "Verso confronta il tuo profilo..." → "Verso prepara i suggerimenti..."

**UI dopo analisi:**
- **Company insight card:** logo, nome, settore, cultura, notizie recenti (da web research)
- **Score meter:** barra gradiente animata 0 → score (800ms). Label: "Quanto sei adatto a questo ruolo". Breakdown accessibile via tooltip/expand.
- **Cosa hai già / Cosa ti manca:** due colonne — chip verdi (strengths) e chip rossi (gaps) — tutto in plain language
- **Suggerimenti per il CV:** lista 3–5 proposte di modifica, ciascuna con originale vs riscrittura + spiegazione

### Step 3: Scegli il modello

- Grid 3 colonne (desktop) / scroll orizzontale (mobile)
- Card template: anteprima, nome plain language ("Classico", "Essenziale", "Creativo", "Tecnico"...), nota compatibilità
- Template Pro: badge "Disponibile con Verso Pro", locked per utenti free
- Default: "Verso Classico" (pulito, leggibile)
- Selezionato: accent border glow

### Step 4: CV e lettera pronti

Due tab in cima: **Il tuo CV** | **La tua lettera**

**Tab CV:**
- Diff view side-by-side (desktop: 2 colonne | mobile: tab "Originale" / "Adattato")
- Sezioni modificate: border-left accent color
- Hover/tap su sezione modificata: tooltip che spiega la modifica in plain language
- Score badge (top-right): Match Score + ATS Score affiancati
- **Pannello Honest Score** (accordion collassato sotto la diff view):
  - Contatori: "0 esperienze aggiunte · 0 competenze inventate · 0 date modificate · [N] bullet riposizionati · [N] bullet riscritti"
  - Confidence badge: verde (≥ 90) o giallo (< 90 con sezioni flaggate)
  - Copy: *"Ogni modifica è visibile. Nulla viene inventato."*

**Tab Lettera:**
- Stesso pattern diff view
- Intro: "Verso ha scritto questa lettera partendo da quello che hai davvero fatto. Leggila, modificala se vuoi, poi scaricala."
- Editabile inline (Tiptap light) prima del download
- La lettera riferisce solo esperienze presenti nel CV

**Azioni (entrambi i tab):**
- "Scarica CV (PDF)"
- "Scarica lettera (PDF)"
- "Scarica tutto (ZIP)" → CV + lettera
- "Scarica in Word" (DOCX, Pro)
- "Crea link condivisibile" (Pro)
- "Salva candidatura" → salva su DB (inclusi `ats_score` su `applications`, e `ats_score`, `ats_checks`, `seniority_match`, `honest_score` su `tailored_cvs`), redirect a dettaglio

---

## Flussi

### Flow A — Prima candidatura (happy path)
1. Utente tappa "+" → wizard
2. Incolla URL annuncio → Verso legge + ricerca azienda
3. Score: 74%. Gap: "Analisi dei dati", "Gestione budget"
4. Sceglie template "Classico"
5. Legge CV adattato + lettera → scarica PDF
6. Salva → candidatura in colonna "Inviata"

### Varianti
- **URL non leggibile:** fallback a textarea testo libero
- **Company research scarsa:** card con copy "Non ho trovato molte info", score company_context = 50
- **Utente free al limite:** modal con counter "3/3 adattamenti usati" + upgrade CTA
- **Generazione lettera fallisce:** mostra CV comunque + "La lettera non è stata generata. Riprova."

---

## Stati

| Componente | Stato | Descrizione |
|------------|-------|-------------|
| URL input | idle | Campo vuoto con placeholder |
| URL input | analyzing | Skeleton "Verso sta leggendo l'annuncio..." |
| URL input | success | Preview card con dati estratti |
| URL input | error | Messaggio + fallback textarea |
| Analisi AI | loading | 4 skeleton card sequenziali |
| Analisi AI | complete | Score + skills + suggerimenti visibili |
| Analisi AI | timeout | Bottone retry + messaggio |
| Template | browsing | Griglia template, nessuno selezionato |
| Template | selected | Template con accent border |
| CV/Lettera | generating | Skeleton preview |
| CV/Lettera | ready | Diff view completa, azioni attive |
| Download | idle | Bottoni attivi |
| Download | generating | Loading su bottone |
| Download | complete | File scaricato |

---

## Edge case

| Scenario | Comportamento |
|----------|---------------|
| URL non leggibile (paywall, JS-rendered) | "Non riesco ad aprire questo link. Copia e incolla il testo dell'annuncio qui sotto." → fallback textarea |
| Company research scarsa | Card: "Non ho trovato molte informazioni su questa azienda." Score company_context = 50 (neutro) |
| AI timeout (>15s) | "L'elaborazione sta richiedendo più del solito. Riprova." + bottone retry |
| Limite free raggiunto | Modal con counter, non blocco hard — upgrade CTA prominente |
| Cover letter generation fallisce | Mostra CV comunque + "La lettera non è stata generata. Riprova o scrivila manualmente." |

---

## Criteri di accettazione

- [ ] URL scraping funziona server-side via edge function
- [ ] Fallback textarea disponibile se URL non leggibile
- [ ] Company web research restituisce insight strutturati con fonti
- [ ] Score composito calcolato con breakdown a 3 componenti
- [ ] Skill match mostra gap in plain language
- [ ] Template selezionabile, default "Classico"
- [ ] Diff view mostra modifiche CV con spiegazioni
- [ ] Cover letter generata e editabile inline
- [ ] Export PDF funzionante per CV e lettera
- [ ] Pannello Honest Score visibile nello step 4 (tab CV) con contatori e confidence
- [ ] Score badge nello step 4 mostra Match Score + ATS Score affiancati
- [ ] Candidatura salvata in DB con tutti i dati collegati (inclusi ats_score, ats_checks, seniority_match, honest_score)
- [ ] Utenti free bloccati al 4° tailoring con modal upgrade

---

## Stories

| ID | Story | Priorità |
|----|-------|----------|
| 02.1 | Step 1 — UI input URL + textarea fallback | Must |
| 02.2 | Edge function — URL scraping + estrazione job description | Must |
| 02.3 | Step 2 — UI skeleton card sequenziali durante analisi | Must |
| 02.4 | Edge function — Company web research (Brave/Serper + AI) | Should |
| 02.5 | Edge function — Analisi profilo + scoring composito | Must |
| 02.6 | Step 2 — UI risultati analisi (score, skills, suggerimenti) | Must |
| 02.7 | Step 3 — Griglia template con selezione | Must |
| 02.8 | Step 4 — Diff view CV (originale vs adattato) con doppio score (Match + ATS) | Must |
| 02.9 | Step 4 — Pannello Honest Score (contatori + confidence badge) | Must |
| 02.10 | Step 4 — Cover letter generata + editor inline | Must |
| 02.11 | Step 4 — Export PDF/DOCX/ZIP | Must |
| 02.12 | Step 4 — Salvataggio candidatura su DB (inclusi ats_score, ats_checks, seniority_match, honest_score) | Must |
| 02.13 | Gate freemium — Controllo limite tailoring | Must |
