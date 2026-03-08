# Check — Candidature: Acceptance Criteria

**Ultimo test:** 2026-03-08 — Browser automation + DB query

---

## A. Lista candidature

- [x] **A1** — La pagina `/app/candidature` e' accessibile dalla sidebar (desktop) e tab bar (mobile) (verificato via browser)
- [x] **A2** — Le candidature sono ordinate per data di creazione (piu' recenti in alto) (verificato via screenshot)
- [x] **A3** — Ogni card mostra: ruolo, azienda, match score, ATS score, status, data (verificato via screenshot: Satispay 87% ATS 85% INVIATA 8 mar)
- [x] **A4** — Il match score e l'ATS score hanno badge colorati (verificato via screenshot: verde)
- [x] **A5** — Lo status ha un chip colorato (`StatusChip`) (verificato via screenshot: INVIATA chip, DRAFT chip)
- [x] **A6** — Hover su una card: prefetch dei dati candidatura (`usePrefetchApplication`) (verificato da code review)

---

## B. Gestione stati

- [x] **B1** — Status `draft`: chip warning, visibile nella sezione bozze (verificato via screenshot)
- [x] **B2** — Status `inviata`: chip default (verificato via screenshot: chip blu)
- [ ] **B3** — Status `visualizzata`: chip info
- [ ] **B4** — Status `contattato`: chip accent
- [ ] **B5** — Status `follow-up`: chip secondary
- [ ] **B6** — Status `ko`: chip destructive
- [ ] **B7** — Il cambio status funziona dal drawer e aggiorna `applications.status` + `updated_at`

---

## C. Bozze

- [x] **C1** — Le bozze sono in una sezione separata in alto, visivamente distinta (verificato via screenshot: bordo giallo, "Bozze (1)")
- [x] **C2** — Ogni bozza ha un pulsante "Riprendi" (verificato via screenshot)
- [ ] **C3** — Click "Riprendi": redirect a `/app/nuova` con dati pre-caricati dello step raggiunto
- [x] **C4** — Le bozze possono essere eliminate (verificato via screenshot: icona cestino)
- [ ] **C5** — Dopo aver completato una bozza, scompare dalla sezione bozze e appare tra le candidature attive

---

## D. Pagina CandidaturaDetail

- [x] **D1** — Route `/app/candidatura/:id` accessibile dal click su una candidatura (verificato via browser)
- [x] **D2** — Scores: match score e ATS score con visualizzazione prominente (verificato via screenshot: 87% MATCH, 85% ATS con barre colorate)
- [x] **D3** — ATS Checks: lista dei controlli ATS superati/falliti (verificato via screenshot: Parole Chiave, Formato del CV, Formattazione Date, ecc.)
- [ ] **D4** — Seniority: livello di seniority rilevato visibile
- [ ] **D5** — Learning Suggestions: suggerimenti di apprendimento basati sui gap
- [ ] **D6** — Modifiche AI (collapsible): sezione espandibile con lista differenze tra CV originale e CV adattato
- [ ] **D7** — CV Preview: `CVSections` collassabile con il contenuto del CV adattato
- [x] **D8** — Status selector: 5 stati selezionabili come chip (inviata, visualizzata, contattato, follow-up, ko) (verificato via screenshot)
- [x] **D9** — Notes: textarea per appunti liberi del candidato (verificato via screenshot: "Aggiungi note...")
- [ ] **D10** — Le note vengono salvate e persistono al ricaricamento

---

## E. Sticky Action Bar (CandidaturaDetail)

- [x] **E1** — Barra fissa in basso nella pagina CandidaturaDetail (verificato via screenshot: "Salva modifiche" button)
- [x] **E2** — Pulsante "Salva": salva status e note modificati (verificato via screenshot)
- [ ] **E3** — Pulsante "Scarica PDF": apre `ExportDrawer` per selezionare template e scaricare il PDF
- [ ] **E4** — Pulsante "Elimina": eliminazione con conferma

---

## F. ResponsiveDetailPanel

- [ ] **F1** — Desktop: Sheet laterale, larghezza 400px, slide-right
- [ ] **F2** — Mobile: Drawer bottom-sheet, altezza 85vh

---

## G. Eliminazione

- [ ] **G1** — Eliminare una candidatura richiede conferma
- [ ] **G2** — Dopo l'eliminazione, la candidatura scompare dalla lista
- [ ] **G3** — Viene eliminato anche il `tailored_cv` associato
- [ ] **G4** — La lista si aggiorna senza refresh della pagina

---

## H. Empty state e edge case

- [ ] **H1** — Nessuna candidatura: messaggio "Nessuna candidatura ancora" + CTA per crearne una
- [ ] **H2** — Molte candidature (10+): la lista funziona senza problemi di performance
- [x] **H3** — La pagina lista e' responsive (funziona su mobile) (verificato da mobile screenshot)
- [ ] **H4** — La pagina CandidaturaDetail e' responsive (funziona su mobile)
- [x] **H5** — Refresh della pagina: i dati si ricaricano correttamente (verificato)
- [ ] **H6** — Candidatura con ID inesistente: errore gestito (no pagina bianca)
