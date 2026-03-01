# Epic 01 — Onboarding Wizard

## Obiettivo

Guidare il nuovo utente attraverso la configurazione iniziale: upload del CV, connessione account opzionale e conferma del profilo. Il tono è accogliente, zero jargon — deve sembrare una conversazione con un collega utile, non un modulo da compilare.

---

## Comportamento

**Trigger:** primo login dopo la creazione dell'account.
**UI:** wizard fullscreen a 3 step con progress indicator lineare.

### Step 1: Carica il tuo CV

Tab switcher con 3 modalità:

**Carica file (default):**
- Accetta PDF, DOCX
- File inviato a Supabase Edge Function che estrae il testo e lo struttura nel JSON schema CV
- Progress: upload bar → skeleton "Verso sta leggendo il tuo CV..."
- Successo: anteprima dati estratti (nome, ruolo, competenze chiave)

**Importa da LinkedIn:**
- OAuth flow → fetch profilo via LinkedIn API → mappatura a schema CV
- Se OAuth negato: toast "Puoi collegare LinkedIn in qualsiasi momento dalle impostazioni."

**Scrivi da zero:**
- Salta all'editor Tiptap vuoto (l'utente compila dopo)

Al completamento: salvataggio in tabella `master_cvs`.

### Step 2: Connetti i tuoi account (opzionale)

- Card OAuth per Gmail (scope: `gmail.readonly`), Outlook (scope: `mail.read`), LinkedIn
- Copy: "Connetti la tua email per tenere traccia delle risposte automaticamente. Puoi farlo anche dopo."
- Pulsante "Salta" sempre visibile — le integrazioni si possono fare in Settings

### Step 3: Sei pronto

- Summary card: skill rilevate dal CV, anni di esperienza, categoria ruolo rilevata
- Honesty note: "Verso conosce solo quello che hai scritto nel tuo CV. Non aggiunge nulla che non ci sia."
- CTA: "Aggiungi la tua prima candidatura →"

---

## Flussi

1. **Happy path:** signup → upload PDF → parsing ok → skip integrazioni → profilo pronto → CTA
2. **LinkedIn import:** signup → OAuth LinkedIn → fetch profilo → mappatura → step 2 → profilo pronto
3. **Editor manuale:** signup → skip upload → editor vuoto → step 2 → profilo pronto (skill cloud vuoto)
4. **Con integrazioni:** signup → upload PDF → connetti Gmail → connetti LinkedIn → profilo pronto

---

## Stati

| Componente | Stato | Descrizione |
|------------|-------|-------------|
| Upload CV | idle | Campo upload visibile, nessun file selezionato |
| Upload CV | uploading | Barra progresso upload |
| Upload CV | parsing | Skeleton "Verso sta leggendo il tuo CV..." |
| Upload CV | success | Anteprima dati estratti |
| Upload CV | error | Messaggio errore + fallback |
| OAuth | idle | Pulsante "Collega" attivo |
| OAuth | connecting | Loading su pulsante |
| OAuth | connected | Check verde + email account |
| OAuth | error | Toast con messaggio |
| Profilo | loading | Skeleton summary card |
| Profilo | ready | Card completa con skills e CTA |

---

## Edge case

| Scenario | Comportamento |
|----------|---------------|
| PDF illeggibile | "Non riesco a leggere questo file. Prova a caricarlo in formato Word, o usa l'editor manuale." |
| LinkedIn OAuth negato | Toast: "Puoi collegare LinkedIn in qualsiasi momento dalle impostazioni." Skip silenzioso. |
| File troppo grande | "Il file è troppo grande. Il limite è 10 MB." |
| Nessun CV caricato | L'utente può procedere con l'editor manuale, ma il profilo avrà skill cloud vuoto |

---

## Criteri di accettazione

- [ ] CV parsato e salvato in `master_cvs` con content JSON strutturato
- [ ] Connessioni OAuth salvate in `profiles` (linkedin_connected, gmail_connected, outlook_connected)
- [ ] Skill estratte e mostrate nella summary card
- [ ] L'utente può saltare ogni step opzionale
- [ ] Honesty note visibile nello step 3
- [ ] Wizard non si ripresenta dopo il primo completamento
- [ ] Mobile-first: funziona su 375px+

---

## Stories

| ID | Story | Priorità |
|----|-------|----------|
| 01.1 | UI wizard 3 step con progress indicator e navigazione | Must |
| 01.2 | Step 1 — Upload file (UI + invio a edge function) | Must |
| 01.3 | Edge function — Parsing CV (PDF/DOCX → JSON schema) | Must |
| 01.4 | Step 1 — Import LinkedIn (OAuth + mappatura profilo) | Should |
| 01.5 | Step 1 — Editor manuale (Tiptap vuoto) | Must |
| 01.6 | Step 2 — Card OAuth Gmail/Outlook/LinkedIn | Should |
| 01.7 | Step 3 — Summary card + honesty note + CTA | Must |
| 01.8 | Error states e fallback per upload/OAuth | Must |
