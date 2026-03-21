# Check — Export PDF + Dashboard: Acceptance Criteria

**Ultimo test:** —

---

## A. StepExport — UI e flusso

- [ ] **A1** — Nessun template picker: lo step mostra direttamente 2 card (CV Recruiter + CV ATS)
- [ ] **A2** — Banner di revisione visibile al mount: "Revisione formale in corso…"
- [ ] **A3** — Banner aggiornato al completamento: "N correzioni applicate" o "Nessuna correzione necessaria"
- [ ] **A4** — Collapsible correzioni: espandibile con lista section/field/problema/correzione
- [ ] **A5** — Sezione teaser "Altri template recruiter" con 3 card opacizzate (Executive, Minimal, Moderno)
- [ ] **A6** — Badge score in fondo: Match%, ATS%, Confidence%
- [ ] **A7** — Layout responsive: 2 card affiancate su desktop, impilate su mobile

---

## B. CV_VISUAL — PDF

- [ ] **B1** — Preview iframe del CV_VISUAL visibile nella card "CV Recruiter"
- [ ] **B2** — Preview proporzionata A4, scalata per fit nel container (ResizeObserver)
- [ ] **B3** — Sidebar scura (`#1C1F26`) con contatti, competenze, lingue, certificazioni
- [ ] **B4** — Body bianco con titoli sezione in verde `#6EBF47`
- [ ] **B5** — KPI badges visibili sopra il summary (se presenti numeri nei bullet)
- [ ] **B6** — Foto circolare nella sidebar (se presente); fallback: iniziali su sfondo accent
- [ ] **B7** — Click "Stampa / Salva PDF": apre dialog di stampa del browser
- [ ] **B8** — PDF salvabile come file da dialog di stampa

---

## C. CV_ATS — DOCX

- [ ] **C1** — ATSPreview testuale visibile nella card "CV ATS" (font mono, struttura a sezioni)
- [ ] **C2** — Click "Scarica DOCX": file `.docx` scaricato
- [ ] **C3** — Nome file: `CV-{Nome}-{Azienda}-ATS.docx`
- [ ] **C4** — DOCX apribile in Word, Google Docs, LibreOffice
- [ ] **C5** — Singola colonna, nessuna tabella, nessun text box
- [ ] **C6** — Contatti nella prima riga del corpo (non header/footer)
- [ ] **C7** — Font Calibri
- [ ] **C8** — Titoli sezione standard (Profilo professionale, Esperienze, Formazione, Competenze, Certificazioni, Lingue)
- [ ] **C9** — Nessun em dash o en dash nel testo
- [ ] **C10** — Copia plain text: ordine corretto, nulla mancante
- [ ] **C11** — DOCX disponibile per utenti Free e Pro (nessun gate)

---

## D. Revisione formale — sequenza bloccante

- [ ] **D1** — Al mount: banner "Revisione formale in corso…" visibile, pulsanti download disabilitati
- [ ] **D2** — Dopo la review: banner "Generazione anteprima…" visibile, pulsanti ancora disabilitati
- [ ] **D3** — Pulsanti PDF e DOCX si abilitano solo quando la preview è pronta (`pipelineStatus = ready`)
- [ ] **D4** — Il CV revisionato (non il grezzo) viene usato per PDF e DOCX
- [ ] **D5** — Se la review fallisce: banner warning + pulsanti si abilitano comunque (fallback al CV grezzo)

---

## E. Dashboard — Stato 1: Nessun CV (virgin state)

- [ ] **E1** — Saluto "Ciao [Nome]" con il nome dell'utente
- [ ] **E2** — Flusso onboarding a 3 step visualizzato con card locked
- [ ] **E3** — I 3 step indicano la sequenza: carica CV -> compila dati -> crea candidatura
- [ ] **E4** — Click sullo step 1: redirect a `/onboarding`
- [ ] **E5** — Nessuna sezione statistiche o candidature visibile

---

## F. Dashboard — Stato 2: CV caricato, nessuna candidatura

- [ ] **F1** — Saluto "Ciao [Nome]"
- [ ] **F2** — CV Card collapsible con toggle espandi/comprimi
- [ ] **F3** — CV Card mostra `CVSections` editabile inline (esperienze, formazione, competenze)
- [ ] **F4** — `SalaryDisplay` integrato: mostra RAL attuale e RAL desiderata con toggle per edit inline
- [ ] **F5** — Azione "Modifica CV": redirect a `/app/cv-edit`
- [ ] **F6** — Azione "Soft delete": imposta `is_active = false`, il CV non e' piu' visibile ma resta in DB
- [ ] **F7** — Azione "Riattivazione": possibilita' di riattivare un CV precedente (`is_active = true`)
- [ ] **F8** — Azione "Hard delete": elimina file da Supabase Storage + record dal DB (con conferma)
- [ ] **F9** — CTA "Nuova candidatura": redirect a `/app/nuova`

---

## G. Dashboard — Stato 3: CV + candidature (Home redesign)

- [ ] **G1** — HeroSection: avatar cliccabile (upload foto), nome, headline AI, badge piano, stats inline
- [ ] **G2** — Headline compattata via AI (`compact-headline` edge function) con cache localStorage
- [ ] **G3** — Candidature recenti: ultime 3 con card specifiche per status (`pronta` = bordo accent)
- [ ] **G4** — Ogni card mostra: iniziale azienda, ruolo, azienda, data, MatchScoreCompact, StatusChip
- [x] **G5** — Hover su una card candidatura: prefetch dei dati (`usePrefetchApplication`) (verificato da code review)
- [x] **G6** — Link alla pagina completa candidature ("Vedi tutte") (verificato via screenshot)
- [ ] **G6b** — CTA "Nuova candidatura" con gradient accent prominente

---

## G-bis. Dashboard — PlanCard e Pro gate

- [ ] **G7** — PlanCard visibile: mostra stato piano (Free/Pro/Pro in scadenza)
- [ ] **G8** — Utente Free: PlanCard mostra "Piano Free" con info limite
- [ ] **G9** — Utente Pro: PlanCard mostra "Versō Pro" con badge e data rinnovo
- [ ] **G10** — Pro gate su "Nuova candidatura": se Free + `free_apps_used >= 1` → redirect a `/upgrade`
- [ ] **G11** — Post-upgrade: param `upgrade=success` → polling + toast "Benvenuto in Versō Pro!"

---

## H. Pagina CVEdit

- [ ] **H1** — Route `/app/cv-edit` accessibile dalla dashboard
- [ ] **H2** — Permette di modificare il CV caricato senza dover fare un nuovo upload
- [ ] **H3** — Editing inline delle sezioni del CV (esperienze, formazione, competenze, ecc.)
- [ ] **H4** — Salvataggio modifiche su DB
- [ ] **H5** — Redirect alla home dopo il salvataggio

---

## I. Dashboard — Edge case

- [ ] **I1** — Soft delete del CV: la dashboard torna allo stato 1
- [ ] **I2** — Hard delete del CV: file rimosso da Storage e record cancellato dal DB
- [ ] **I3** — Riattivare un CV dopo soft delete: la dashboard torna allo stato 2 o 3
- [ ] **I4** — Caricare un nuovo CV: redirect a onboarding, poi la dashboard si aggiorna
- [x] **I5** — La dashboard e' responsive (funziona su mobile) (verificato via screenshot mobile 375px)
- [x] **I6** — Refresh della pagina: i dati si ricaricano correttamente (verificato: sessione persiste)
- [ ] **I7** — Se le query al DB falliscono: comportamento gestito (no pagina bianca)
