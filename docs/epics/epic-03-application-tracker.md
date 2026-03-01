# Epic 03 — Application Tracker (Kanban)

## Obiettivo

Dare all'utente una vista d'insieme di tutte le candidature, organizzate per stato. Desktop: kanban board drag & drop. Mobile: lista con filtri a tab e gesture swipe.

---

## Comportamento

**Route:** `/app/candidature`

### Vista Desktop — Kanban Board

5 colonne con header fissi, scroll orizzontale se necessario:

| Colonna | Label |
|---------|-------|
| 1 | Inviata |
| 2 | Vista |
| 3 | Ti hanno scritto |
| 4 | Segui |
| 5 | Non selezionato |

- Drag & drop card tra colonne (dnd-kit)
- Drop zone evidenziata con accent border durante il drag
- 60fps durante le interazioni drag

### Vista Mobile — Lista con filtri

- Colonna singola con tab filter orizzontali in cima (pill tabs, scroll orizzontale)
- Swipe right → avanza stato
- Swipe left → "Non selezionato"
- Tap → apre dettaglio candidatura (bottom sheet)

### Application Card

- Logo azienda (40px, rounded)
- Titolo ruolo (DM Sans 500, 15px)
- Nome azienda (muted, 13px)
- Giorni da candidatura (es. "3 giorni fa") in JetBrains Mono
- Doppio score badge affiancato:
  - **Match Score**: cerchietto piccolo, colore proporzionale (0-40 `#FF6B6B`, 41-70 `#FFD166`, 71-100 `#A8FF78`)
  - **ATS Score**: cerchietto piccolo, colore proporzionale (0-50 `#FF6B6B`, 51-75 `#FFD166`, 76-100 `#A8FF78`)
  - Label sotto ogni badge: "Match" / "ATS" (DM Sans 400 9px muted)
- Seniority warning: se `seniority_match.match` è false, icona `Warning` gialla accanto al ruolo con tooltip nota
- Honest Score indicator: icona `ShieldCheck` verde (confidence ≥ 90) o `ShieldWarning` gialla (confidence < 90) accanto ai badge
- Status chip (colori da brand system)

### Filtri e ordinamento (top bar)

- Ricerca per azienda o ruolo
- Filtro per status (multi-select)
- Ordinamento: Data candidatura | Punteggio | Azienda

### Empty state per colonna

Messaggio breve nel tono del brand. Es: "Nessuna candidatura in Segui. Buon segno, o c'è qualcuno a cui vale la pena scrivere?"

---

## Flussi

1. **Consultazione:** utente apre `/app/candidature` → vede tutte le card distribuite per stato
2. **Cambio stato (desktop):** drag card da "Inviata" a "Vista" → status aggiornato in DB + evento in `application_events`
3. **Cambio stato (mobile):** swipe right su card → avanza di uno stato
4. **Ricerca:** utente digita "Acme" nella barra → card filtrate in tempo reale
5. **Dettaglio:** tap/click su card → navigazione a `/app/candidature/:id`

---

## Stati

| Componente | Stato | Descrizione |
|------------|-------|-------------|
| Board | loading | Skeleton card in ogni colonna |
| Board | populated | Card distribuite per stato |
| Board | empty | Nessuna candidatura → CTA "Aggiungi la tua prima candidatura" |
| Colonna | empty | Messaggio empty state specifico |
| Card | idle | Visualizzazione standard |
| Card | dragging | Elevazione + opacity ridotta nella posizione originale |
| Card | dropped | Animazione settle + aggiornamento stato |
| Filtri | active | Card filtrate, contatore risultati |

---

## Criteri di accettazione

- [ ] Kanban 5 colonne funzionante su desktop con drag & drop
- [ ] Lista con tab filter e swipe su mobile
- [ ] Cambio stato registrato in `applications` + `application_events`
- [ ] Ricerca e filtri funzionanti
- [ ] Card mostra: logo, ruolo, azienda, giorni, Match Score + ATS Score (doppio badge), seniority warning, honest score indicator, status
- [ ] Empty state per ogni colonna e per board vuoto
- [ ] Performance drag & drop a 60fps
- [ ] Utenti free: max 10 candidature (oltre → modal upgrade)

---

## Stories

| ID | Story | Priorità |
|----|-------|----------|
| 03.1 | Layout kanban 5 colonne con header fissi (desktop) | Must |
| 03.2 | Application card component con tutti i dati | Must |
| 03.3 | Drag & drop tra colonne con dnd-kit | Must |
| 03.4 | Vista lista mobile con tab filter | Must |
| 03.5 | Gesture swipe per cambio stato (mobile) | Should |
| 03.6 | Barra ricerca + filtri + ordinamento | Must |
| 03.7 | Empty states per colonne e board | Must |
| 03.8 | Registrazione eventi in application_events su cambio stato | Must |
