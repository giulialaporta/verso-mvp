# Check — Onboarding: Acceptance Criteria

Checklist per verificare il flusso di onboarding a 3 step: Upload CV, Parsing AI, Preview + Edit.

---

## A. Trigger e accesso

- [ ] **A1** — Dopo il primo login, se l'utente non ha un CV in `master_cvs`, viene reindirizzato a `/onboarding`
- [ ] **A2** — Se l'utente ha gia' un CV, la dashboard si carica normalmente (no redirect a onboarding)
- [ ] **A3** — Utente non autenticato su `/onboarding`: redirect a `/login`

---

## B. Step 1 — Upload

- [ ] **B1** — L'area di upload accetta drag & drop di un file PDF
- [ ] **B2** — L'area di upload accetta click per selezionare un file PDF
- [ ] **B3** — Solo file `.pdf` sono accettati (altri formati rifiutati con errore)
- [ ] **B4** — File > 10 MB: errore con indicazione del limite
- [ ] **B5** — Dopo la selezione, mostra nome file + dimensione + icona
- [ ] **B6** — E' possibile rimuovere il file selezionato e sceglierne un altro
- [ ] **B7** — Il pulsante CTA e' disabilitato finche' non c'e' un file selezionato
- [ ] **B8** — Il PDF viene caricato nel bucket `cv-uploads` di Supabase Storage

---

## C. Step 2 — Parsing AI

- [ ] **C1** — Durante il parsing, viene mostrato uno skeleton/loader con messaggio
- [ ] **C2** — Il parsing completa entro un tempo ragionevole (< 30 secondi)
- [ ] **C3** — I dati personali vengono estratti correttamente (nome, email, telefono, localita')
- [ ] **C4** — Le esperienze vengono estratte con ruolo, azienda, date, bullet points
- [ ] **C5** — La formazione viene estratta con titolo, istituto, campo di studio
- [ ] **C6** — Le skill vengono estratte e categorizzate (tecniche, soft, tools, lingue)
- [ ] **C7** — Le lingue hanno il livello CEFR quando specificato nel CV
- [ ] **C8** — Se il CV ha una foto, viene estratta e mostrata
- [ ] **C9** — Se il CV non ha un summary, ne viene generato uno automaticamente
- [ ] **C10** — La lingua del CV viene preservata (se il CV e' in inglese, i dati restano in inglese)
- [ ] **C11** — Se il parsing fallisce: messaggio di errore + pulsante "Riprova"
- [ ] **C12** — Se la Edge Function va in timeout: messaggio specifico + "Riprova"

---

## D. Step 3 — Preview + Edit inline

- [ ] **D1** — Tutti i dati estratti sono visibili organizzati per sezioni collassabili
- [ ] **D2** — I campi testo (nome, ruolo, azienda, ecc.) sono modificabili inline con click
- [ ] **D3** — Le skill sono gestibili con chip: aggiunta e rimozione funzionano
- [ ] **D4** — Click su un elemento (esperienza, formazione) apre il drawer di editing dettagliato
- [ ] **D5** — Il drawer funziona come slide-up su mobile e slide-right su desktop
- [ ] **D6** — Le modifiche fatte inline sono preservate quando si procede
- [ ] **D7** — I suggerimenti AI (`CVSuggestions`) vengono mostrati
- [ ] **D8** — L'"honesty note" (Verso usa solo cio' che c'e' nel CV) e' visibile

---

## E. Salvataggio e completamento

- [ ] **E1** — Click "Continua": i dati vengono salvati in `master_cvs` con `parsed_data` JSON
- [ ] **E2** — `file_name`, `file_url`, `raw_text`, `source`, `photo_url` vengono salvati correttamente
- [ ] **E3** — Dopo il salvataggio: redirect a `/app/home`
- [ ] **E4** — La dashboard mostra i dati del CV appena caricato
- [ ] **E5** — Un secondo upload sostituisce il CV precedente (un solo CV per utente)

---

## F. Edge case

- [ ] **F1** — CV con molte pagine (5+): il parsing funziona comunque
- [ ] **F2** — CV con formattazione complessa (tabelle, colonne multiple): i dati vengono estratti ragionevolmente
- [ ] **F3** — CV quasi vuoto (solo nome e email): il parsing non crasha, mostra i dati disponibili
- [ ] **F4** — Refresh della pagina durante il parsing: comportamento gestito (no crash)
- [ ] **F5** — La pagina di onboarding e' responsive (funziona su mobile)
- [ ] **F6** — Navigazione indietro tra gli step funziona senza perdere i dati
