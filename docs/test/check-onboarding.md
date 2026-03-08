# Check — Onboarding: Acceptance Criteria

Checklist per verificare il flusso di onboarding a 4 step: Upload CV, Parsing AI, Preview + Edit, Aspettative RAL.

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

## E. Consenso GDPR art. 9 (Step 3 → Continua)

- [ ] **E1** — Al primo upload CV, click "Continua" sullo step 3: appare il modal `SensitiveDataConsent`
- [ ] **E2** — Il modal informa l'utente sui dati sensibili (categorie particolari art. 9 GDPR)
- [ ] **E3** — L'upload e' bloccato finche' il consenso non viene dato
- [ ] **E4** — Consenso salvato in `consent_logs` con tipo `sensitive_data`
- [ ] **E5** — Se l'utente ha gia' dato il consenso in precedenza: il modal non riappare
- [ ] **E6** — "Annulla" chiude il modal senza bloccare l'utente permanentemente

---

## F. Salvataggio e completamento (Step 3)

- [ ] **F1** — Click "Continua" (dopo consenso): i dati vengono salvati in `master_cvs` con `parsed_data` JSON
- [ ] **F2** — `file_name`, `file_url`, `raw_text`, `source`, `photo_url` vengono salvati correttamente
- [ ] **F3** — Le modifiche inline fatte dall'utente nello step 3 sono incluse nel `parsed_data` salvato
- [ ] **F4** — Un solo CV attivo per utente: il nuovo upload sostituisce il precedente

---

## G. Step 4 — Aspettative RAL

- [ ] **G1** — Lo step 4 e' visibile dopo il salvataggio del CV (step 3)
- [ ] **G2** — Campo "RAL attuale": input numerico, opzionale
- [ ] **G3** — Campo "RAL desiderata": input numerico, opzionale
- [ ] **G4** — Entrambi i campi possono essere lasciati vuoti (l'utente puo' saltare)
- [ ] **G5** — Valori formattati con locale IT (separatore migliaia: punto)
- [ ] **G6** — Se compilati: salvati in `profiles.salary_expectations`
- [ ] **G7** — Se non compilati: `salary_expectations` resta `null`
- [ ] **G8** — Click "Continua": redirect a `/app/home`
- [ ] **G9** — La dashboard mostra i dati del CV appena caricato

---

## H. Gestione CV Master

- [ ] **H1** — Un solo CV attivo per utente
- [ ] **H2** — Soft delete: disattivazione tramite `is_active=false`, il CV non e' piu' visibile
- [ ] **H3** — Riattivazione: possibilita' di riattivare un CV precedentemente disattivato (`is_active=true`)
- [ ] **H4** — Hard delete: rimozione file dallo storage + cancellazione record dal DB
- [ ] **H5** — Hard delete richiede conferma prima di procedere
- [ ] **H6** — Pagina `/app/cv-edit`: consente di modificare il CV parsato senza ri-upload del PDF

---

## I. Edge case

- [ ] **I1** — CV con molte pagine (5+): il parsing funziona comunque
- [ ] **I2** — CV con formattazione complessa (tabelle, colonne multiple): i dati vengono estratti ragionevolmente
- [ ] **I3** — CV quasi vuoto (solo nome e email): il parsing non crasha, mostra i dati disponibili
- [ ] **I4** — Refresh della pagina durante il parsing: comportamento gestito (no crash)
- [ ] **I5** — La pagina di onboarding e' responsive (funziona su mobile)
- [ ] **I6** — Navigazione indietro tra gli step (4 step totali) funziona senza perdere i dati
- [ ] **I7** — Step indicator mostra 4 step: Upload, Parsing, Preview + Edit, RAL
