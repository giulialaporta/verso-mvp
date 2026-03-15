# Check — Nuova Candidatura: Acceptance Criteria

Checklist per verificare il wizard a 6 step: Job Input, Pre-screening, Tailoring, Revisione, Export, Completa.

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
- [ ] **C6** — L'utente puo' rispondere alle domande tramite chip contestuali (3-4 opzioni per domanda)
- [ ] **C7** — Le risposte vengono salvate in `applications.user_answers`
- [ ] **C8** — La feasibility (low/medium/high) e' visibile
- [ ] **C9** — L'output e' tutto in italiano
- [ ] **C10** — L'utente puo' procedere anche senza rispondere alle domande
- [ ] **C11** — Se l'utente ha `salary_expectations` nel profilo: la card Analisi Retributiva viene mostrata
- [ ] **C12** — Se l'annuncio menziona un range RAL: la card Analisi Retributiva viene mostrata
- [ ] **C13** — La card mostra: aspettativa candidato, range posizione, delta percentuale, nota
- [ ] **C14** — Il badge fonte e' corretto ("Da te", "Dall'annuncio", "Stimata")
- [ ] **C15** — Se non ci sono dati retributivi (ne' profilo ne' annuncio): la card NON appare

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
- [ ] **D10** — Language selector: l'utente puo' cambiare la lingua del CV (IT/EN) sovrascrivendo quella rilevata
- [ ] **D11** — La lingua selezionata viene usata dal tailoring e dall'export PDF
- [ ] **D12** — Skill overrides: click su una skill mancante la sposta in "Hai gia'" (bordo tratteggiato verde)
- [ ] **D13** — Le skill overriddate vengono escluse da `skills_missing` nel tailoring
- [ ] **D14** — Click su una skill overriddata la rimuove (torna in "Ti mancano")
- [ ] **D15** — Hint visibile: "Clicca su una skill per dire che ce l'hai"
- [ ] **D16** — Le regole cv-review (lingua uniforme, bullet con verbi d'azione, dedup skill) sono integrate nel tailoring (no chiamata separata)
- [ ] **D17** — Il pre-screening e l'analisi (`ai-tailor` mode analyze) partono in parallelo
- [ ] **D18** — Se l'utente non risponde alle domande, il risultato analyze cachato viene usato senza nuova chiamata

---

## D-bis. Step 3 — SkillManager (riordinamento e visibilita')

- [ ] **D-bis.1** — SkillManager visibile nello step di revisione con lista skill
- [ ] **D-bis.2** — Frecce su/giu' per riordinare le skill funzionano
- [ ] **D-bis.3** — Icona occhio per nascondere/mostrare una skill
- [ ] **D-bis.4** — Le skill nascoste appaiono con stile barrato e opacita' ridotta
- [ ] **D-bis.5** — Le skill nascoste NON appaiono nel PDF/DOCX esportato
- [ ] **D-bis.6** — Hint testuale: "Le skill nascoste non appariranno nel PDF"
- [ ] **D-bis.7** — Conversione corretta da skills categorizzate a ManagedSkill[] e ritorno

---

## E. Step 4 — Revisione

- [ ] **E1** — Match Score (0-100) visibile con barra compatta (componente MatchScore)
- [ ] **E2** — ATS Score (0-100) visibile con barra compatta
- [ ] **E3** — Blocco "Cosa ho cambiato" con contatori (bullet riscritti, esperienze riordinate/rimosse, summary riscritto, skill rimosse)
- [ ] **E4** — Confidence calcolato dal frontend (non dall'AI)
- [ ] **E5** — Label "Verificato" sempre visibile
- [ ] **E6** — Diff collassata di default, espandibile con toggle "Mostra modifiche"
- [ ] **E7** — Ogni diff mostra: originale, suggerito, reason
- [ ] **E8** — Structural changes (esperienze rimosse) visibili nella diff

---

## F. Step 5 — Export PDF + DOCX

- [ ] **F1** — Step a pagina intera (non modale)
- [ ] **F2** — 4 template disponibili: Classico, Minimal (free), Executive, Moderno (Pro-only)
- [ ] **F3** — L'utente puo' selezionare il template (bordo accent sulla card selezionata)
- [ ] **F3b** — Template Executive e Moderno mostrano icona lucchetto per utenti Free
- [ ] **F4** — Preview PDF live che si aggiorna al cambio template
- [ ] **F5** — Click "Scarica PDF": il PDF viene scaricato nel browser
- [ ] **F5b** — Click "Scarica DOCX" (Pro-only): il DOCX viene scaricato
- [ ] **F5c** — Utente Free che clicca "Scarica DOCX": redirect a `/upgrade`
- [ ] **F6** — Il nome file segue il formato `CV-{Nome}-{Azienda}.pdf` / `.docx`
- [ ] **F7** — Il PDF/DOCX viene caricato automaticamente su Supabase Storage
- [ ] **F8** — Badge ATS Score e Confidence visibili in basso
- [ ] **F9** — Viene creato un record in `applications` con tutti i campi compilati
- [ ] **F10** — Viene creato un record in `tailored_cvs` con dati, score, pdf_url, template_id

---

## F-bis. Revisione formale automatica

- [ ] **F-bis.1** — `cv-formal-review` viene chiamata automaticamente al mount dello step export
- [ ] **F-bis.2** — Status "Revisione in corso..." visibile durante la chiamata
- [ ] **F-bis.3** — A completamento: "N correzioni applicate" con lista espandibile
- [ ] **F-bis.4** — Se nessuna correzione: feedback positivo (es. "Nessuna correzione necessaria")
- [ ] **F-bis.5** — Se errore: nessun blocco, viene usato il CV originale
- [ ] **F-bis.6** — Il CV revisionato viene usato per PDF e DOCX

---

## F2. Step 6 — Completa (Prossimi passi)

- [ ] **F2.1** — Step visibile dopo l'export
- [ ] **F2.2** — Mostra ruolo, azienda, match score
- [ ] **F2.3** — Card "Ho inviato la candidatura": update status a `inviata`, redirect a `/app/candidature`
- [ ] **F2.4** — Card "La inviero' dopo": status resta `draft`, redirect a `/app/home`
- [ ] **F2.5** — Card "Nuova candidatura": redirect a `/app/nuova` (wizard pulito)

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
- [ ] **I6** — Step indicator mostra 6 step: Annuncio, Verifica, Analisi, CV Adattato, Download, Fatto
- [ ] **I7** — Step indicator mobile: compatto con dots e label step corrente
- [ ] **I5** — Se l'AI fallisce in uno step: errore chiaro + possibilita' di riprovare
