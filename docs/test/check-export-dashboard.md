# Check — Export PDF + Dashboard: Acceptance Criteria

Checklist per verificare il sistema di export PDF e la dashboard home.

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

## D. Qualita' ATS (entrambi i template)

- [ ] **D1** — Layout single-column (no colonne multiple)
- [ ] **D2** — Heading standard riconoscibili
- [ ] **D3** — Testo selezionabile (non immagine)
- [ ] **D4** — Font 10-12pt leggibile
- [ ] **D5** — Margini >= 20mm
- [ ] **D6** — Nessuna tabella o immagine al posto del testo

---

## E. Dashboard — Stato 1: Nessun CV

- [ ] **E1** — Saluto "Ciao [Nome]" con il nome dell'utente
- [ ] **E2** — Messaggio di onboarding visibile
- [ ] **E3** — CTA "Carica il tuo CV": redirect a `/onboarding`
- [ ] **E4** — Nessuna sezione statistiche o candidature visibile

---

## F. Dashboard — Stato 2: CV caricato, nessuna candidatura

- [ ] **F1** — Saluto "Ciao [Nome]"
- [ ] **F2** — CV card con anteprima dati (esperienze, formazione)
- [ ] **F3** — Possibilita' di eliminare il CV
- [ ] **F4** — Possibilita' di caricare un nuovo CV (sostituisce il precedente)
- [ ] **F5** — CTA "Nuova candidatura": redirect a `/app/nuova`

---

## G. Dashboard — Stato 3: CV + candidature

- [ ] **G1** — CV card con dati principali e azioni (elimina, carica nuovo)
- [ ] **G2** — Stats visibili: numero candidature attive, score medio, stato CV
- [ ] **G3** — Candidature recenti: mostra le ultime 3
- [ ] **G4** — Ogni card candidatura mostra: ruolo, azienda, match score, ATS score, data
- [ ] **G5** — Link alla pagina completa candidature

---

## H. Dashboard — Edge case

- [ ] **H1** — Eliminare il CV: la dashboard torna allo stato 1
- [ ] **H2** — Caricare un nuovo CV: redirect a onboarding, poi la dashboard si aggiorna
- [ ] **H3** — La dashboard e' responsive (funziona su mobile)
- [ ] **H4** — Refresh della pagina: i dati si ricaricano correttamente
- [ ] **H5** — Se le query al DB falliscono: comportamento gestito (no pagina bianca)
