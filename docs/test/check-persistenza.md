# Check — Persistenza Dati: Acceptance Criteria

Checklist per verificare che sessione e dati applicativi persistano correttamente dopo refresh, chiusura tab, logout e navigazione.

---

## A. Persistenza sessione

- [ ] **A1** — Dopo login, refresh della pagina (F5): l'utente resta autenticato
- [ ] **A2** — Dopo login, chiudere e riaprire il tab: l'utente resta autenticato
- [ ] **A3** — Utente autenticato che visita `/login`: redirect automatico a `/app/home`
- [ ] **A4** — Durante il caricamento dell'auth state: loading visibile, nessun flash della pagina login
- [ ] **A5** — Sessione scaduta o invalidata (cancellare token da DevTools > Application > Local Storage): al refresh, redirect a `/login`
- [ ] **A6** — Dopo logout, il back button del browser NON riporta all'app (route protetta)
- [ ] **A7** — Dopo logout, visitare `/app/home` direttamente: redirect a `/login`
- [ ] **A8** — Dopo logout + nuovo login: l'utente vede i propri dati (non quelli di un altro utente)

---

## B. Persistenza CV Master

- [ ] **B1** — Caricare un CV via onboarding, poi refresh della dashboard: i dati del CV sono ancora visibili nella CV card
- [ ] **B2** — I dati in `master_cvs.parsed_data` corrispondono a quanto mostrato nella dashboard (verificare in Supabase Dashboard > Table Editor)
- [ ] **B3** — `file_name`, `file_url`, `raw_text` sono salvati correttamente nel record `master_cvs`
- [ ] **B4** — Se il CV ha una foto: `photo_url` e' salvato e la foto e' visibile dopo refresh
- [ ] **B5** — Modificare il CV nello step 3 dell'onboarding, poi completare: le modifiche sono nel `parsed_data` salvato (non i dati originali del parsing)
- [ ] **B6** — Eliminare il CV dalla dashboard, poi refresh: la dashboard torna allo stato "Nessun CV"
- [ ] **B7** — Dopo eliminazione CV: il record in `master_cvs` non esiste piu' (verificare in Supabase)
- [ ] **B8** — Caricare un nuovo CV dopo averne eliminato uno: il nuovo CV sostituisce il precedente, un solo record in `master_cvs`

---

## C. Persistenza bozze candidatura

- [ ] **C1** — Iniziare una nuova candidatura (step 1: job input), poi uscire dal wizard: la bozza viene salvata in `applications` con status `draft`
- [ ] **C2** — Andare su `/app/candidature`: la bozza appare nella sezione bozze
- [ ] **C3** — Refresh della pagina candidature: la bozza e' ancora li'
- [ ] **C4** — Click "Riprendi" sulla bozza: il wizard si apre con i dati dell'annuncio pre-caricati
- [ ] **C5** — La bozza riparte dallo step corretto (non ricomincia da zero)
- [ ] **C6** — Completare una bozza fino all'export: lo status cambia da `draft` a `draft` completato (verificare il record in Supabase)
- [ ] **C7** — Eliminare una bozza, poi refresh: la bozza non appare piu'

---

## D. Persistenza candidatura completa

- [ ] **D1** — Completare il wizard fino all'export PDF: viene creato un record in `applications` con `company_name`, `role_title`, `match_score`, `ats_score`
- [ ] **D2** — Viene creato un record in `tailored_cvs` con `tailored_data`, `suggestions`, `ats_score`, `ats_checks`, `honest_score`, `pdf_url`, `template_id`
- [ ] **D3** — Refresh della pagina candidature: la candidatura appare nella lista con tutti i dati corretti
- [ ] **D4** — Match score e ATS score mostrati nella card corrispondono ai valori nel database
- [ ] **D5** — La data di creazione e' corretta

---

## E. Persistenza status e note

- [ ] **E1** — Cambiare lo status di una candidatura (es. da "draft" a "inviata"), poi refresh: lo status e' ancora "inviata"
- [ ] **E2** — Il campo `applications.status` nel database corrisponde a quanto mostrato nell'UI
- [ ] **E3** — Il campo `applications.updated_at` viene aggiornato al cambio status
- [ ] **E4** — Aggiungere una nota a una candidatura, poi refresh: la nota e' ancora visibile
- [ ] **E5** — Il campo `applications.notes` nel database contiene il testo della nota
- [ ] **E6** — Modificare una nota esistente, poi refresh: la modifica e' persistita
- [ ] **E7** — Cambiare status e aggiungere nota nella stessa sessione, poi refresh: entrambi persistono

---

## F. Persistenza eliminazione

- [ ] **F1** — Eliminare una candidatura, poi refresh: la candidatura non appare piu' nella lista
- [ ] **F2** — Il record `applications` e' stato eliminato dal database (verificare in Supabase)
- [ ] **F3** — Il record `tailored_cvs` associato e' stato eliminato dal database
- [ ] **F4** — Il PDF in Storage (`cv-exports/`) e' stato eliminato (o resta orfano — documentare il comportamento)
- [ ] **F5** — Le statistiche della dashboard si aggiornano dopo l'eliminazione (conteggio candidature, score medio)

---

## G. Persistenza salary expectations

- [ ] **G1** — Compilare la RAL nell'onboarding, poi refresh della dashboard: il valore e' visibile
- [ ] **G2** — Il campo `profiles.salary_expectations` contiene i dati corretti (verificare in Supabase)
- [ ] **G3** — Avviare una nuova candidatura: le salary expectations vengono passate al pre-screening
- [ ] **G4** — La salary analysis card mostra i dati coerenti con quanto salvato nel profilo
- [ ] **G5** — Modificare le salary expectations, poi avviare una nuova candidatura: i nuovi valori vengono usati

---

## H. Consistenza cross-pagina

- [ ] **H1** — Creare una candidatura nel wizard, poi andare alla dashboard: le stats si aggiornano (conteggio, score medio)
- [ ] **H2** — Creare una candidatura nel wizard, poi andare alla pagina candidature: la candidatura appare nella lista
- [ ] **H3** — Eliminare il CV dalla dashboard: le candidature esistenti restano (non vengono cancellate a cascata)
- [ ] **H4** — Navigare rapidamente tra dashboard e candidature: nessun dato fantasma o duplicato
