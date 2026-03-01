# Story 04.6 — Collegamento frontend: wizard step 2 → `ai-tailor`

> Prompt per Lovable — Epic 04, Story 6 di 7
> Prerequisito: stories 04.4 e 04.5 completate (la function `ai-tailor` esiste). Epic 03 già costruita (wizard a 3 step).

---

## Cosa fare

Collegare il frontend del wizard (epic 03) alle edge function reali. Lo step 2 del wizard attualmente potrebbe usare dati mock o non essere collegato. Questa story collega le chiamate reali e gestisce gli stati di loading/errore/successo.

---

## Step 1 del wizard → `scrape-job`

Quando l'utente è nel tab "URL" e clicca "Analizza":

1. Chiama `POST /functions/v1/scrape-job` con `{ "url": "..." }`
2. **Loading:** mostra skeleton "Verso sta leggendo l'annuncio..."
3. **Success:** popola la preview card con `company_name`, `role_title`, e i requisiti principali (primi 3-5 bullet dalla `role_description`)
4. **Errore `url_unreachable`:** mostra messaggio "Non riesco ad aprire questo link. Incolla il testo dell'annuncio direttamente." e switcha automaticamente al tab "Testo"
5. I campi nella preview card restano editabili dall'utente

Quando l'utente è nel tab "Testo" e clicca "Continua":
- Non serve chiamare `scrape-job` — il testo è già disponibile
- Invia comunque il testo a `scrape-job` con un campo `{ "raw_text": "..." }` per estrarre company_name e role_title, OPPURE gestisci l'estrazione lato client mostrando i campi editabili vuoti

---

## Step 2 del wizard → `ai-tailor`

Quando l'utente conferma lo step 1 e passa allo step 2:

1. Recupera il `master_cv` dell'utente da `master_cvs` (il record più recente per `user_id`)
2. Chiama `POST /functions/v1/ai-tailor` con:
   ```json
   {
     "master_cv": { ...contenuto da master_cvs.content... },
     "job_description": "...testo estratto nello step 1...",
     "company_name": "...da preview card...",
     "role_title": "...da preview card...",
     "task": "analyze_and_tailor"
   }
   ```
3. **Loading:** mostra le 3 skeleton card sequenziali (già costruite in epic 03):
   - "Verso confronta il tuo profilo..." (appare subito)
   - "Verso calcola il match..." (appare dopo 1s)
   - "Verso adatta il tuo CV..." (appare dopo 2s)

4. **Success:** popola la UI dello step 2 con i dati dalla risposta:
   - **Score meter** → usa `match_score` (la barra gradiente animata già costruita)
   - **Chip skill verdi** → da `skills_present`
   - **Chip skill rossi** → da `skills_missing` (con badge importanza: essenziale/importante/utile)
   - **Suggerimenti** → da `diff` (mostra `original` barrato → `suggested` con border-left accent, e `reason` come tooltip)

5. **Errore `ai_timeout`:** mostra "L'elaborazione sta richiedendo più del solito." con bottone "Riprova" che rilancia la stessa chiamata
6. **Errore `ai_unavailable` o `ai_parse_failed`:** mostra "Qualcosa è andato storto. Riprova." con bottone "Riprova"

---

## Step 3 del wizard — dati da salvare in memoria

Quando l'utente clicca "Vedi il CV adattato →" e passa allo step 3, i dati della risposta `ai-tailor` devono restare in memoria (state/context) per:

- **Diff view**: usa `tailored_cv` (colonna destra/tab "Adattato") e il `master_cv` originale (colonna sinistra/tab "Originale"). Le sezioni modificate si individuano dal `diff` array.
- **Score badge** in alto a destra: usa `match_score`

I campi `ats_score`, `ats_checks`, `seniority_match`, `honest_score` vengono **mantenuti in memoria** ma NON mostrati nello step 3 — verranno usati dall'epic 05 (drawer export).

---

## Salvataggio (bottone "Salva candidatura")

Quando l'utente clicca "Salva candidatura" nello step 3:

1. **Crea record `applications`:**
   ```
   company_name ← dalla preview card (step 1)
   role_title ← dalla preview card (step 1)
   role_description ← testo annuncio (step 1)
   role_url ← URL se inserita (step 1, tab URL)
   match_score ← dalla risposta ai-tailor
   ats_score ← dalla risposta ai-tailor
   ```

2. **Crea record `tailored_cvs`:**
   ```
   application_id ← ID dell'application appena creata
   content ← tailored_cv dalla risposta ai-tailor
   diff ← diff dalla risposta ai-tailor
   ats_score ← dalla risposta ai-tailor
   ats_checks ← dalla risposta ai-tailor
   seniority_match ← dalla risposta ai-tailor
   honest_score ← dalla risposta ai-tailor
   ```

3. **Redirect** a `/app/home`

---

## Criteri di accettazione

- [ ] Tab URL: clic "Analizza" chiama `scrape-job` e popola la preview card
- [ ] Tab URL: errore `url_unreachable` → switch a tab Testo con messaggio
- [ ] Step 2: chiama `ai-tailor` con CV master + job description
- [ ] Step 2: skeleton sequenziali durante loading
- [ ] Step 2: score meter popolato con `match_score`
- [ ] Step 2: chip skill verdi (`skills_present`) e rossi (`skills_missing`) con badge importanza
- [ ] Step 2: suggerimenti visibili con originale → adattato + reason
- [ ] Step 2: errore timeout/unavailable → messaggio + bottone Riprova
- [ ] Step 3: diff view usa `tailored_cv` e `master_cv` reali
- [ ] Step 3: "Salva candidatura" crea record in `applications` + `tailored_cvs` con TUTTI i campi (inclusi ats_score, ats_checks, seniority_match, honest_score)
- [ ] Redirect a `/app/home` dopo salvataggio
