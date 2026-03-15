# Check — Export PDF + Dashboard: Acceptance Criteria

**Ultimo test:** 2026-03-08 — Browser automation + DB query

---

## A. Export PDF — Generazione

- [ ] **A1** — Click "Scarica PDF": il file viene generato e scaricato nel browser
- [ ] **A2** — Il nome file segue il formato `CV-{Nome}-{Azienda}.pdf`
- [ ] **A3** — Il PDF viene caricato automaticamente su Supabase Storage in `cv-exports/{userId}/{applicationId}/`
- [ ] **A4** — L'URL del PDF viene salvato in `tailored_cvs.pdf_url`
- [ ] **A5** — Il template scelto viene salvato in `tailored_cvs.template_id`

---

## B. Template Classico

- [ ] **B1** — Header scuro (`#141518`) con nome completo bianco
- [ ] **B2** — Email, telefono, localita' sotto il nome in grigio chiaro
- [ ] **B3** — Body sfondo bianco con testo nero
- [ ] **B4** — Sezioni nell'ordine: Profilo, Esperienza, Formazione, Competenze, Certificazioni, Progetti
- [ ] **B5** — Titoli sezione uppercase con linea sotto
- [ ] **B6** — Competenze come testo inline separato da " . "
- [ ] **B7** — Formato A4, margini 24mm

---

## C. Template Minimal

- [ ] **C1** — Tutto sfondo bianco, nessun header colorato
- [ ] **C2** — Nome in grande, dati contatto separati da " | "
- [ ] **C3** — Linea sottile tra le sezioni
- [ ] **C4** — Massima pulizia e leggibilita'
- [ ] **C5** — Formato A4, margini 22mm

---

## C-bis. Template Executive (Pro-only)

- [ ] **C-bis.1** — Layout a 2 colonne con sidebar scura
- [ ] **C-bis.2** — Lucchetto visibile per utenti Free
- [ ] **C-bis.3** — Utente Free che seleziona Executive: redirect a `/upgrade`
- [ ] **C-bis.4** — Formato A4

---

## C-ter. Template Moderno (Pro-only)

- [ ] **C-ter.1** — Design contemporaneo con accent
- [ ] **C-ter.2** — Lucchetto visibile per utenti Free
- [ ] **C-ter.3** — Utente Free che seleziona Moderno: redirect a `/upgrade`
- [ ] **C-ter.4** — Formato A4

---

## C-quater. Export DOCX (Pro-only)

- [ ] **C-quater.1** — Pulsante "Scarica DOCX" visibile nello step export
- [ ] **C-quater.2** — DOCX generato correttamente con tutte le sezioni del CV
- [ ] **C-quater.3** — Stile DOCX adattato al template selezionato (4 stili)
- [ ] **C-quater.4** — DOCX apribile in Word, Google Docs, LibreOffice
- [ ] **C-quater.5** — Utente Free: icona Lock + Crown sul pulsante DOCX
- [ ] **C-quater.6** — File salvato su Supabase Storage

---

## D. Qualita' ATS (tutti i template)

- [ ] **D1** — Layout single-column (no colonne multiple)
- [ ] **D2** — Heading standard riconoscibili
- [ ] **D3** — Testo selezionabile (non immagine)
- [ ] **D4** — Font 10-12pt leggibile
- [ ] **D5** — Margini >= 20mm
- [ ] **D6** — Nessuna tabella o immagine al posto del testo

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
