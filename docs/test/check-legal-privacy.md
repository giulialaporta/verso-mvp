# Check — Legal, Privacy e Trasparenza AI: Acceptance Criteria

Checklist per verificare l'implementazione degli aspetti legali, privacy GDPR e trasparenza AI.

---

## A. Pagine legali

- [ ] **A1** — Pagina `/termini` accessibile senza autenticazione
- [ ] **A2** — Pagina `/privacy` accessibile senza autenticazione
- [ ] **A3** — Pagina `/cookie-policy` accessibile senza autenticazione
- [ ] **A4** — Tutte le pagine in italiano con linguaggio chiaro
- [ ] **A5** — Layout dark mode, responsive, font DM Sans
- [ ] **A6** — Footer con versione e data ultimo aggiornamento
- [ ] **A7** — Header con link "Torna al login" / "Torna all'app"
- [ ] **A8** — T&C contengono: oggetto, descrizione servizio, limiti AI, registrazione, obblighi utente, contenuti utente, IP Verso, disponibilita', limitazione responsabilita', legge applicabile
- [ ] **A9** — Privacy Policy contiene: titolare, dati trattati, finalita', basi giuridiche, sub-processori, diritti utente, sicurezza, conservazione
- [ ] **A10** — Cookie Policy contiene: categorie cookie, come gestirli

---

## B. Consensi in registrazione

- [ ] **B1** — Due checkbox separate nel form di registrazione (T&C + Privacy)
- [ ] **B2** — Le checkbox NON sono pre-spuntate
- [ ] **B3** — Pulsante "Crea account" disabilitato se le checkbox non sono spuntate
- [ ] **B4** — Link a /termini e /privacy funzionanti (si aprono in nuovo tab)
- [ ] **B5** — I consensi vengono salvati in `consent_logs` dopo la registrazione
- [ ] **B6** — Google OAuth: bloccato se le checkbox non sono spuntate
- [ ] **B7** — Record in `consent_logs` con `consent_type: 'terms'` e `consent_type: 'privacy'`

---

## C. Consenso dati sensibili (art. 9 GDPR)

- [ ] **C1** — Modal appare prima del primo upload CV
- [ ] **C2** — Il modal informa sui dati sensibili che il CV potrebbe contenere
- [ ] **C3** — Checkbox non pre-spuntata nel modal
- [ ] **C4** — Upload bloccato finche' il consenso non e' dato
- [ ] **C5** — Consenso salvato in `consent_logs` con `consent_type: 'sensitive_data'`
- [ ] **C6** — Se l'utente ha gia' dato il consenso: il modal non riappare
- [ ] **C7** — "Annulla" chiude il modal senza bloccare l'utente permanentemente

---

## D. Trasparenza AI

- [ ] **D1** — Banner informativo "Verso usa l'intelligenza artificiale" nell'onboarding
- [ ] **D2** — Label "Generato con AI" nello step 2 del wizard (pre-screening)
- [ ] **D3** — Label "CV adattato con AI" nello step 3 del wizard (tailoring)
- [ ] **D4** — Label "Punteggi calcolati con AI" nello step 4 del wizard (score)
- [ ] **D5** — Disclaimer pre-download nel ExportDrawer
- [ ] **D6** — Tutti i testi in italiano
- [ ] **D7** — Le label sono informative, non bloccano il flusso

---

## E. Cookie banner

- [ ] **E1** — Banner visibile alla prima visita
- [ ] **E2** — Pulsanti con uguale evidenza (no dark pattern)
- [ ] **E3** — Il banner non riappare dopo la scelta
- [ ] **E4** — Link a /cookie-policy funzionante
- [ ] **E5** — La "X" equivale a "Solo necessari"
- [ ] **E6** — Preferenza salvata in localStorage
- [ ] **E7** — Se utente autenticato: consenso salvato anche in `consent_logs`
- [ ] **E8** — Possibilita' di modificare le preferenze successivamente

---

## F. Cancellazione account (diritto all'oblio)

- [ ] **F1** — Pulsante "Elimina account" accessibile
- [ ] **F2** — AlertDialog con conferma "ELIMINA" (digitare la parola)
- [ ] **F3** — Eliminati: profilo, CV master, candidature, tailored_cvs
- [ ] **F4** — Eliminati: file da cv-uploads e cv-exports in Storage
- [ ] **F5** — Cancellazione registrata in `consent_logs`
- [ ] **F6** — L'utente viene disconnesso e reindirizzato a /login
- [ ] **F7** — Toast di conferma dopo l'eliminazione
- [ ] **F8** — Dopo eliminazione, le credenziali non funzionano piu'

---

## G. Export dati (portabilita' GDPR)

- [ ] **G1** — Pulsante "Esporta i miei dati" accessibile
- [ ] **G2** — Genera un file ZIP
- [ ] **G3** — Il ZIP contiene: profilo.json, cv-master.json, candidature.json, cv-adattati/, consensi.json
- [ ] **G4** — I file JSON sono formattati e leggibili
- [ ] **G5** — README.txt spiega il contenuto
- [ ] **G6** — Download automatico dopo la generazione

---

## H. Sezione Privacy nelle Impostazioni

- [ ] **H1** — Sezione "Privacy e Dati" visibile nelle impostazioni
- [ ] **H2** — Lista consensi prestati con data e stato
- [ ] **H3** — Link ai documenti legali (T&C, Privacy, Cookie Policy)
- [ ] **H4** — Pulsante "Esporta i miei dati" presente e funzionante
- [ ] **H5** — Pulsante "Gestisci cookie" riapre il banner cookie
- [ ] **H6** — Pulsante "Elimina account" presente e funzionante
- [ ] **H7** — "Zona pericolosa" visivamente distinta (bordo rosso)

---

## I. Footer legale

- [ ] **I1** — Footer con link legali nelle pagine pubbliche
- [ ] **I2** — Link legali nella sidebar desktop
- [ ] **I3** — Tutti i link portano alle pagine corrette
- [ ] **I4** — Lo stile e' discreto e coerente

---

## J. Database consent_logs

- [ ] **J1** — Tabella `consent_logs` esiste nel database
- [ ] **J2** — RLS attiva: ogni utente vede solo i propri record
- [ ] **J3** — I consensi di registrazione vengono salvati correttamente
- [ ] **J4** — I consensi di upload CV vengono salvati correttamente
- [ ] **J5** — I consensi cookie vengono salvati (se utente autenticato)
- [ ] **J6** — La cancellazione account viene registrata prima dell'eliminazione
