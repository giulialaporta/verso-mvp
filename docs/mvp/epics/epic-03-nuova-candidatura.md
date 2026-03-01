# Epic 03 — Wizard Nuova Candidatura

---

## Cosa costruire

Pagina `/app/nuova` — wizard a 3 step dove l'utente inserisce un annuncio, Verso lo analizza, e mostra il CV adattato con score.

---

## Step 1: L'annuncio

**Layout:** card centrata, max-width 640px.

**Titolo:** "Incolla l'annuncio di lavoro" (Syne 700 24px)

**Due tab:**

**Tab "URL" (default):**
- Campo input con placeholder "Incolla il link all'offerta di lavoro"
- Pulsante "Analizza" (primario, accent)
- Al click: chiama edge function `POST /functions/v1/scrape-job` che:
  - Fetch server-side del contenuto URL (evita CORS)
  - Strip HTML, estrae testo
  - Invia a Claude API per estrarre: `company_name`, `role_title`, `role_description` (testo pulito dei requisiti)
  - Restituisce JSON strutturato
- Loading: skeleton card "Verso sta leggendo l'annuncio..."
- Errore: "Non riesco ad aprire questo link. Prova a incollare il testo direttamente." → switch automatico a tab "Testo"

**Tab "Testo":**
- Textarea grande (min-height 200px) con placeholder "Copia e incolla il testo dell'annuncio qui"
- Pulsante "Continua" (primario)
- Al click: invia testo a Claude per estrarre `company_name`, `role_title`, `role_description`

**Dopo estrazione — Preview card:**
- Nome azienda (editabile inline)
- Titolo ruolo (editabile inline)
- Anteprima requisiti chiave (3-5 bullet, read-only)
- Pulsante "Conferma e analizza →" (primario)

---

## Step 2: Analisi AI

**Avviato automaticamente** dopo conferma step 1.

Chiama edge function `POST /functions/v1/ai-tailor` (vedi epic-04 per dettagli) con:
- `master_cv`: dal record in `master_cvs` dell'utente
- `job_description`: testo estratto allo step 1
- `task`: `"analyze_and_tailor"`

**UI durante analisi — 3 skeleton card sequenziali:**
1. "Verso confronta il tuo profilo..." (appare subito)
2. "Verso calcola il match..." (appare dopo 1s)
3. "Verso adatta il tuo CV..." (appare dopo 2s)

Ogni skeleton: sfondo `--color-surface`, bordo `--color-border`, testo DM Sans 400 14px `--color-text-secondary`, shimmer animation.

**UI dopo analisi:**

**Score meter:**
- Barra orizzontale con gradient `--gradient-score` (rosso → giallo → verde)
- Animazione: da 0 al valore in 800ms con `ease-out` (Framer Motion)
- Numero score grande in JetBrains Mono 700 32px
- Label sotto: "Compatibilità con il ruolo" (DM Sans 400 13px muted)

**Skill match:**
- Due colonne (desktop) / stack (mobile):
  - **"Hai già"** — chip verdi (sfondo `rgba(168,255,120,0.12)`, testo `#A8FF78`)
  - **"Ti mancano"** — chip rossi (sfondo `rgba(255,107,107,0.12)`, testo `#FF6B6B`) con badge importanza
- Max 8 skill per colonna

**Suggerimenti:**
- Lista 3-5 modifiche proposte al CV
- Ogni suggerimento: testo originale (barrato, muted) → testo suggerito (accent border-left)
- Icona `ArrowRight` tra originale e suggerito

**Pulsante:** "Vedi il CV adattato →" (primario)

---

## Step 3: CV adattato

**Diff view:**

**Desktop (≥1024px):** 2 colonne affiancate
- Sinistra: "Originale" — CV master read-only, sfondo `--color-surface`
- Destra: "Adattato" — CV tailored, sfondo `--color-surface`
- Sezioni modificate: `border-left: 3px solid #A8FF78`

**Mobile (<1024px):** tab switcher
- Tab "Originale" | "Adattato"
- Stessa evidenziazione border-left sulle sezioni modificate

**Header della pagina:**
- Titolo: "[Ruolo] — [Azienda]" (Syne 700 20px)
- Score badge in alto a destra (JetBrains Mono, cerchietto con score)

**Azioni (bottom bar fissa):**
- "Scarica PDF" (primario, accent) → vedi epic-05
- "Salva candidatura" (secondario) → salva in `applications` + `tailored_cvs` → redirect a `/app/home`

**Al salvataggio:**
- Crea record in `applications` (company_name, role_title, role_description, role_url, match_score, ats_score)
- Crea record in `tailored_cvs` (application_id, content, diff, ats_score, ats_checks, seniority_match, honest_score)
- I campi `ats_score`, `ats_checks`, `seniority_match`, `honest_score` provengono dalla risposta di `ai-tailor` (epic 04) e vanno salvati anche se il frontend dello step 2/3 non li mostra tutti — verranno letti da epic 05 (drawer export + dashboard)
- Redirect a `/app/home`

---

## Step indicator

Barra orizzontale in alto con 3 step:
- Step completato: dot `#A8FF78` + label DM Sans 400 13px
- Step attuale: dot `#A8FF78` pulsante + label bianco
- Step futuro: dot `#2A2D35` + label muted

Navigazione back con freccia `ArrowLeft` in alto a sinistra.

---

## Criteri di accettazione

- [ ] Step 1: input URL funzionante con edge function scraping
- [ ] Step 1: textarea fallback per testo manuale
- [ ] Step 1: preview card con dati editabili
- [ ] Step 1: switch automatico a tab Testo se URL fallisce
- [ ] Step 2: skeleton sequenziali durante analisi
- [ ] Step 2: score meter con animazione gradiente
- [ ] Step 2: chip skill verdi/rossi
- [ ] Step 2: lista suggerimenti con originale vs proposto
- [ ] Step 3: diff view 2 colonne (desktop) / tab (mobile)
- [ ] Step 3: sezioni modificate evidenziate con border-left accent
- [ ] Step 3: salvataggio in applications (incluso ats_score) + tailored_cvs (inclusi ats_score, ats_checks, seniority_match, honest_score)
- [ ] Step indicator con navigazione back
- [ ] Timeout gestito con messaggio + retry
