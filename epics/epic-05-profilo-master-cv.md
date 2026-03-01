# Epic 05 — Profilo e Master CV

## Obiettivo

Dare all'utente un'area per gestire il proprio CV master (editor rich text), visualizzare le competenze rilevate, gestire gli account collegati e consultare tutte le versioni di CV e lettere generate.

---

## Comportamento

**Route:** `/app/profilo`

### Il mio CV (editor Tiptap)

- Sezioni strutturate: Dati personali, Presentazione, Esperienze, Formazione, Competenze, Certificazioni, Progetti
- Aggiunta/rimozione/riordinamento sezioni (drag handle)
- Ogni esperienza: azienda, ruolo, date, bullet point editabili singolarmente
- Auto-save ogni 30 secondi + su blur
- Pulsante "Aggiorna profilo" → ri-esegue estrazione skill, aggiorna profilo

### Le mie competenze (skill cloud)

- Tag cloud interattivo con tutte le competenze rilevate dal CV
- Codice colore: tecniche (blu), trasversali (grigio), lingue (giallo)
- Label sempre in plain language — nessun codice o jargon
- Click su skill → mostra quali candidature la richiedono
- "Aggiungi competenza" → campo testo con autocomplete

### Account collegati

- Card OAuth per Gmail, Outlook, LinkedIn
- Ogni card: logo servizio, status connessione, email account connesso, pulsante "Disconnetti"
- Pulsante "Collega" → avvia OAuth flow

### Le mie lettere e CV

- Lista di tutti i CV adattati e cover letter generati
- Ogni riga: azienda + ruolo, data, doppio punteggio (Match Score + ATS Score con colori), icona Honest Score (ShieldCheck verde o ShieldWarning giallo), bottoni download
- Opzione "Usa come CV base" → sovrascrive master CV con versione adattata

---

## Flussi

1. **Modifica CV:** utente apre profilo → edita sezione Esperienze → aggiunge bullet point → auto-save
2. **Aggiorna profilo:** utente clicca "Aggiorna profilo" → skill re-estratte → cloud aggiornato
3. **Usa versione adattata:** utente trova CV adattato per Acme Corp → "Usa come CV base" → master CV aggiornato
4. **Collega account:** utente clicca "Collega" su Gmail → OAuth → connesso → email visibili nei dettagli candidatura

---

## Stati

| Componente | Stato | Descrizione |
|------------|-------|-------------|
| Editor CV | editing | Testo editabile, cursore attivo |
| Editor CV | saving | Indicatore "Salvataggio..." |
| Editor CV | saved | Indicatore "Salvato" (scompare dopo 2s) |
| Skill cloud | loaded | Tag visibili, cliccabili |
| Skill cloud | updating | Skeleton durante re-estrazione |
| OAuth card | disconnected | Pulsante "Collega" attivo |
| OAuth card | connected | Check verde + email + "Disconnetti" |
| Versioni CV | loaded | Lista righe con download |
| Versioni CV | empty | "Non hai ancora generato nessun CV adattato" |

---

## Criteri di accettazione

- [ ] Editor Tiptap con tutte le sezioni strutturate
- [ ] Drag & drop per riordinare sezioni
- [ ] Auto-save ogni 30s + su blur
- [ ] Skill cloud aggiornato automaticamente dopo modifica CV
- [ ] Click su skill mostra candidature correlate
- [ ] Card OAuth funzionanti per Gmail, Outlook, LinkedIn
- [ ] Lista versioni CV con download PDF/DOCX
- [ ] "Usa come CV base" aggiorna master_cvs

---

## Stories

| ID | Story | Priorità |
|----|-------|----------|
| 05.1 | Editor Tiptap strutturato con sezioni CV | Must |
| 05.2 | Auto-save editor (30s + blur) | Must |
| 05.3 | Drag & drop riordinamento sezioni | Should |
| 05.4 | Skill cloud interattivo con codice colore | Must |
| 05.5 | "Aggiungi competenza" con autocomplete | Should |
| 05.6 | Click skill → candidature correlate | Should |
| 05.7 | Panel account collegati (OAuth) | Should |
| 05.8 | Lista versioni CV + lettere con download | Must |
| 05.9 | "Usa come CV base" | Should |
