# Epic 04 — Dettaglio Candidatura

## Obiettivo

Mostrare la vista completa di una singola candidatura: CV adattato, lettera, info azienda, gap analysis, email collegate e note personali. È il punto centrale per gestire ogni candidatura.

---

## Comportamento

**Route:** `/app/candidature/:id`
**Mobile:** bottom sheet (95% altezza, draggable handle)
**Desktop:** full page

### Header

- Logo azienda + nome + titolo ruolo
- Status chip (tappabile → dropdown cambio stato con 5 opzioni plain language)
- Due score affiancati:
  - **Match Score** (già presente): quanto il profilo corrisponde al ruolo. Colori: 0-30 rosso, 31-60 arancione, 61-80 verde chiaro, 81-100 verde
  - **ATS Score** (nuovo): quanto il CV è ottimizzato per passare i filtri ATS. Colori: 0-50 rosso `#FF6B6B`, 51-75 arancione `#FFD166`, 76-100 verde `#A8FF78`
  - Tooltip su ciascuno con breakdown dettagliato
- Seniority Match chip: se `seniority_match.match` = false, mostrare chip warning con nota (es. "Il ruolo è senior, il tuo profilo è mid — candidatura ambiziosa ma possibile")
- Azioni rapide: Scarica CV | Scarica lettera | Apri annuncio | Archivia
  - Se ATS score ≥ 75: badge "ATS-Ready ✓" accanto al pulsante Scarica CV

### Timeline stato

- Stepper orizzontale con 5 stage
- Stage completate: accent color
- Stage attuale: pulsante
- Timestamp sotto ogni stage completata

### Sezioni — Tab (desktop) / Accordion (mobile)

**Candidatura:**
- Anteprima CV adattato (read-only, scrollabile)
- Anteprima cover letter (read-only, scrollabile)
- Download: PDF CV, PDF Lettera, ZIP tutto, DOCX (Pro)
- Link condivisibile (Pro)
- **Pannello ATS Check** (accordion, aperto di default):
  - ATS Score grande in evidenza con copy: *"Questo CV ha il X% di probabilità di superare i filtri automatici."*
  - Lista dei 7 check con icona verde/giallo/rosso:
    - "Parole chiave presenti" | "Formato leggibile" | "Date coerenti" | "Risultati misurabili" | "Niente cliché" | "Sezioni standard" | "Verbi d'azione"
  - Ogni check con detail opzionale (es. "7 su 9 keyword trovate")
  - Nessun jargon tecnico: l'utente capisce senza sapere cos'è un ATS
- **Pannello Honest Score** (accordion, collassato di default):
  - Titolo: "Verifica di onestà"
  - Contatori con icone: "0 esperienze aggiunte · 0 competenze inventate · 0 date modificate · 3 bullet riposizionati · 2 bullet riscritti"
  - Confidence badge: verde se ≥ 90, giallo se < 90 con sezioni flaggate evidenziate
  - Copy introduttiva: *"Ogni modifica è visibile. Nulla viene inventato."*

**L'azienda:**
- Company insight card: logo, settore, cultura, notizie recenti
- Requisiti principali dell'annuncio (tag cloud, plain language)
- Accordion "Fonti": URLs usati per la ricerca (collassato di default)
- Disclaimer: "Informazioni da fonti pubbliche, potrebbero non essere aggiornate."

**Cosa ti manca:**
- Lista gap completa in plain language con indicatore importanza ("Molto importante", "Utile")
- Per ogni gap: nome skill, livello importanza, corsi suggeriti
  - Card corso: piattaforma (Coursera/Udemy/LinkedIn Learning), titolo, durata, "Vai al corso →"
- "Come alzare il tuo punteggio": mostra score proiettato se ogni gap viene chiuso
- Toggle "Ho imparato questa cosa" → score ricalcola (simulazione client-side)

**Email:**
- Se email connessa: vista thread read-only filtrata per dominio azienda
- "Scrivi un messaggio di follow-up" → modal con bozza AI (utente rivede + conferma prima dell'invio)
- Se non connessa: "Connetti la tua email per vedere le risposte automaticamente"

**Note:**
- Textarea libera per note personali
- Auto-save su blur

### Cambio stato

- Tap su status chip → popover con 5 opzioni (plain language)
- Su cambio: evento in `application_events`, update `updated_at`, animazione crossfade chip

---

## Flussi

### Flow B — Aggiornamento status via email
1. Recruiter risponde all'email di candidatura
2. Gmail webhook rileva email da dominio azienda
3. Stato si aggiorna automaticamente a "Vista"
4. Push notification: "Novità da Acme Corp — Product Manager"
5. Utente apre dettaglio → vede chip aggiornato + timeline

### Flow C — Follow-up
1. Candidatura in "Inviata" da 7+ giorni
2. Dashboard mostra reminder
3. Utente tappa "Scrivi un messaggio" → bozza AI nel modal
4. Utente rivede, modifica, conferma invio

### Flow D — Gap closing
1. Utente apre "Cosa ti manca"
2. Vede: "Analisi dei dati — Molto importante"
3. Tap "Vai al corso" → link esterno
4. Torna nell'app → marca "Ho imparato questa cosa"
5. Score ricalcola verso l'alto

---

## Stati

| Componente | Stato | Descrizione |
|------------|-------|-------------|
| Pagina | loading | Skeleton layout completo |
| Pagina | loaded | Tutti i dati visibili |
| Status chip | idle | Chip con colore stato attuale |
| Status chip | changing | Popover aperto con opzioni |
| Email tab | connected | Thread visibili |
| Email tab | disconnected | CTA connessione |
| Follow-up modal | drafting | Bozza AI visibile, editabile |
| Follow-up modal | sending | Loading su bottone invio |
| Follow-up modal | sent | Conferma + chiusura modal |
| Gap skill | unresolved | Chip rosso con importanza |
| Gap skill | resolved | Chip verde + score aggiornato |
| Note | saved | Indicatore "Salvato" |
| ATS Score badge | pass | Verde, score ≥ 76 |
| ATS Score badge | warning | Arancione, score 51-75 |
| ATS Score badge | fail | Rosso, score ≤ 50 |
| ATS Check item | pass | Icona verde |
| ATS Check item | warning | Icona gialla con detail |
| ATS Check item | fail | Icona rossa con detail |
| Honest Score | confident | Confidence ≥ 90, badge verde |
| Honest Score | review_needed | Confidence < 90, badge giallo, sezioni flaggate |
| Seniority chip | match | Nascosto (nessun avviso necessario) |
| Seniority chip | mismatch | Chip warning con nota esplicativa |

---

## Edge case

| Scenario | Comportamento |
|----------|---------------|
| Email sync: dominio azienda non matchato | Non aggiornare status automaticamente. Mostrare email in sezione "Email non associate" |
| Link condivisibile (no login) | Pagina preview pubblica: nome utente e contatti oscurati per privacy, contenuto CV visibile |
| Follow-up email OAuth scope mancante | Richiedere permesso send al momento dell'invio |

---

## Criteri di accettazione

- [ ] Header con logo, ruolo, azienda, Match Score + ATS Score affiancati, status chip funzionante
- [ ] Seniority Match chip visibile quando c'è mismatch, con nota esplicativa
- [ ] Badge "ATS-Ready ✓" accanto a Scarica CV quando ATS score ≥ 75
- [ ] Timeline stato con 5 stage, timestamp per completate
- [ ] Tab/accordion con tutte le 5 sezioni
- [ ] CV e lettera preview read-only con download
- [ ] Pannello ATS Check con 7 controlli, icone colorate, linguaggio semplice (no jargon)
- [ ] Pannello Honest Score con contatori per categoria e confidence badge
- [ ] Honest Score: se confidence < 90, sezioni flaggate evidenziate
- [ ] Company insight card con fonti e disclaimer
- [ ] Gap list con importanza, corsi, score proiettato
- [ ] Toggle "Ho imparato" funzionante con ricalcolo score
- [ ] Email thread filtrate per dominio (se connesso)
- [ ] Follow-up con bozza AI editabile e conferma esplicita
- [ ] Note auto-save su blur
- [ ] Cambio stato con evento registrato

---

## Stories

| ID | Story | Priorità |
|----|-------|----------|
| 04.1 | Header candidatura (logo, ruolo, Match Score + ATS Score affiancati, status chip) | Must |
| 04.2 | Seniority Match chip con nota esplicativa (visibile solo su mismatch) | Must |
| 04.3 | Badge "ATS-Ready ✓" accanto a Scarica CV (se ATS score ≥ 75) | Must |
| 04.4 | Timeline stato orizzontale | Must |
| 04.5 | Tab Candidatura — preview CV + lettera + download | Must |
| 04.6 | Pannello ATS Check — 7 controlli con icone colorate e linguaggio semplice | Must |
| 04.7 | Pannello Honest Score — contatori, confidence badge, flags se < 90 | Must |
| 04.8 | Tab L'azienda — insight card + fonti + disclaimer | Must |
| 04.9 | Tab Cosa ti manca — gap list + corsi + score proiettato | Should |
| 04.10 | Toggle "Ho imparato" con ricalcolo score | Should |
| 04.11 | Tab Email — thread view filtrata per dominio | Should |
| 04.12 | Modal follow-up con bozza AI + conferma invio | Should |
| 04.13 | Tab Note — textarea auto-save | Must |
| 04.14 | Cambio stato da chip con registrazione evento | Must |
| 04.15 | Bottom sheet mobile (95% altezza, draggable) | Must |
