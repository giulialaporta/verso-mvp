# Check — Nuova Candidatura: Acceptance Criteria

Checklist per verificare il wizard a 5 step: Job Input, Pre-screening, Tailoring, Score, Export.

---

## A. Step 1 — Job Input (URL)

- [ ] **A1** — Il campo URL accetta un link e avvia lo scraping
- [ ] **A2** — Durante lo scraping: skeleton/loader visibile
- [ ] **A3** — I dati estratti (azienda, ruolo, requisiti, skill) vengono mostrati in una preview card
- [ ] **A4** — I dati nella preview card sono editabili inline
- [ ] **A5** — Se l'URL non e' raggiungibile: errore + suggerimento di incollare il testo
- [ ] **A6** — Un secondo scraping dello stesso URL usa la cache (risposta piu' veloce)

---

## B. Step 1 — Job Input (Testo)

- [ ] **B1** — La textarea accetta testo incollato dell'annuncio
- [ ] **B2** — Il testo viene inviato all'AI per estrazione dati strutturati
- [ ] **B3** — I dati estratti vengono mostrati nella stessa preview card
- [ ] **B4** — Un annuncio molto lungo (3000+ parole) viene gestito senza errore

---

## C. Step 2 — Pre-screening AI

- [ ] **C1** — Il pre-screening parte automaticamente dopo il job input
- [ ] **C2** — Loading visibile durante l'analisi
- [ ] **C3** — Se ci sono dealbreaker: vengono mostrati con indicazione di severita' (critical/significant)
- [ ] **C4** — Se ci sono gap colmabili: vengono presentate domande di follow-up
- [ ] **C5** — Le domande sono al massimo 5
- [ ] **C6** — L'utente puo' rispondere alle domande
- [ ] **C7** — Le risposte vengono salvate in `applications.user_answers`
- [ ] **C8** — La feasibility (low/medium/high) e' visibile
- [ ] **C9** — L'output e' tutto in italiano
- [ ] **C10** — L'utente puo' procedere anche senza rispondere alle domande

---

## D. Step 3 — CV Tailoring

- [ ] **D1** — Il tailoring parte con CV master + job posting + analisi pre-screening + risposte utente
- [ ] **D2** — Loading visibile durante il tailoring
- [ ] **D3** — Il CV adattato non inventa esperienze o skill non presenti nel CV originale
- [ ] **D4** — Le date, nomi aziende e titoli di ruolo NON vengono modificati
- [ ] **D5** — Almeno 2 esperienze restano nel CV (mai rimosse tutte)
- [ ] **D6** — Non vengono rimosse piu' del 50% delle esperienze
- [ ] **D7** — Il summary viene riscritto per allinearsi al ruolo
- [ ] **D8** — Le skill vengono riordinate per rilevanza rispetto all'annuncio
- [ ] **D9** — Se l'annuncio e' in inglese, il CV adattato e' in inglese

---

## E. Step 4 — Analisi e Score

- [ ] **E1** — Match Score (0-100) visibile con barra gradiente animata
- [ ] **E2** — ATS Score (0-100) visibile
- [ ] **E3** — I 7 check ATS sono mostrati con stato pass/warning/fail:
  - [ ] Keywords
  - [ ] Format
  - [ ] Dates
  - [ ] Measurable
  - [ ] Cliches
  - [ ] Sections
  - [ ] Action verbs
- [ ] **E4** — Honest Score visibile con confidence e contatori
- [ ] **E5** — Se confidence < 90: vengono segnalate le sezioni da rivedere

---

## F. Step 5 — Export PDF

- [ ] **F1** — Due template disponibili: Classico e Minimal
- [ ] **F2** — L'utente puo' selezionare il template
- [ ] **F3** — Preview ATS score e Honest Score visibili
- [ ] **F4** — Click "Scarica PDF": il PDF viene scaricato nel browser
- [ ] **F5** — Il nome file segue il formato `CV-{Nome}-{Azienda}.pdf`
- [ ] **F6** — Il PDF viene caricato automaticamente su Supabase Storage
- [ ] **F7** — Viene creato un record in `applications` con tutti i campi compilati
- [ ] **F8** — Viene creato un record in `tailored_cvs` con dati, score, pdf_url, template_id

---

## G. Template PDF — Qualita'

- [ ] **G1** — Template Classico: header scuro, body bianco, sezioni leggibili
- [ ] **G2** — Template Minimal: tutto bianco, layout pulito
- [ ] **G3** — Il testo nel PDF e' selezionabile (non immagine)
- [ ] **G4** — Layout single-column (ATS-friendly)
- [ ] **G5** — Font leggibile (10-12pt)
- [ ] **G6** — Margini adeguati (>= 20mm)
- [ ] **G7** — Nessuna tabella o immagine per il testo

---

## H. Bozze

- [ ] **H1** — La candidatura viene salvata come `draft` durante il wizard
- [ ] **H2** — Uscire dal wizard prima del completamento: la bozza e' salvata
- [ ] **H3** — Le bozze sono visibili nella pagina Candidature
- [ ] **H4** — Click "Riprendi" su una bozza: torna al wizard con i dati pre-caricati
- [ ] **H5** — La bozza puo' essere eliminata

---

## I. Edge case

- [ ] **I1** — Annuncio con pochissimi dettagli: il sistema gestisce senza crash
- [ ] **I2** — Annuncio in lingua diversa da italiano/inglese: comportamento gestito
- [ ] **I3** — La pagina e' responsive (funziona su mobile)
- [ ] **I4** — Navigazione indietro tra gli step funziona
- [ ] **I5** — Se l'AI fallisce in uno step: errore chiaro + possibilita' di riprovare
