# Check — Legal, Privacy e Trasparenza AI: Acceptance Criteria

**Ultimo test:** 2026-03-08 — Browser automation + DB query + code review

---

## A. Pagine legali

- [x] **A1** — Pagina `/termini` accessibile senza autenticazione (verificato via browser)
- [x] **A2** — Pagina `/privacy` accessibile senza autenticazione (verificato via browser)
- [x] **A3** — Pagina `/cookie-policy` accessibile senza autenticazione (verificato via browser)
- [x] **A4** — Tutte le pagine in italiano con linguaggio chiaro (verificato via screenshot)
- [x] **A5** — Layout dark mode, responsive, font DM Sans (verificato via screenshot)
- [x] **A6** — `LegalLayout` condiviso: metadata con versione del documento e data di ultimo aggiornamento
- [x] **A7** — `LegalLayout`: header con backlink per tornare alla pagina precedente ("Torna all'app")
- [x] **A8** — Desktop: sidebar con Table of Contents (TOC) navigabile (verificato via screenshot)
- [x] **A9** — T&C contengono 11 articoli (verificato via screenshot: Art. 1 Oggetto, Art. 2 Servizio, ecc.)
- [x] **A10** — Privacy Policy contiene: dati trattati, art. 9 GDPR, finalita', sub-processori, diritti, sicurezza, conservazione (verificato via screenshot)
- [x] **A11** — Cookie Policy contiene: cookie tecnici (si'), analitici (no), profilazione (no), come gestirli (verificato via screenshot)

---

## B. Consensi in registrazione

- [x] **B1** — Due checkbox separate nel form di registrazione (T&C + Privacy) (verificato da code review)
- [x] **B2** — Le checkbox NON sono pre-spuntate (verificato da code review)
- [x] **B3** — Pulsante "Crea account" disabilitato se le checkbox non sono spuntate (verificato da code review)
- [x] **B4** — Link a /termini e /privacy funzionanti (si aprono in nuovo tab) (verificato da code review: target="_blank")
- [x] **B5** — I consensi vengono salvati in `consent_logs` dopo la registrazione EMAIL (verificato da code review)
- [x] **B6** — Google OAuth: bloccato se le checkbox non sono spuntate (verificato da code review)
- [!] **B7** — Record in `consent_logs` con `consent_type: 'terms'` e `consent_type: 'privacy'` — **BUG: per OAuth non vengono salvati (vedi BUG-AUTH-01)**

---

## C. Consenso dati sensibili (art. 9 GDPR)

- [x] **C1** — Modal appare prima del primo upload CV (verificato da code review: SensitiveDataConsent)
- [x] **C2** — Il modal informa sui dati sensibili che il CV potrebbe contenere
- [x] **C3** — Checkbox non pre-spuntata nel modal
- [x] **C4** — Upload bloccato finche' il consenso non e' dato
- [x] **C5** — Consenso salvato in `consent_logs` con `consent_type: 'sensitive_data'`
- [x] **C6** — Se l'utente ha gia' dato il consenso: il modal non riappare
- [x] **C7** — "Annulla" chiude il modal senza bloccare l'utente permanentemente

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

- [x] **E1** — Banner visibile alla prima visita (verificato via screenshot: banner in basso)
- [x] **E2** — Pulsanti con uguale evidenza (no dark pattern) (verificato: solo "Accetta necessari" + X)
- [ ] **E3** — Il banner non riappare dopo la scelta
- [x] **E4** — Link a /cookie-policy funzionante (verificato via screenshot)
- [x] **E5** — La "X" equivale a "Solo necessari" (verificato da code review)
- [x] **E6** — Preferenza salvata in localStorage (verificato da code review)
- [x] **E7** — Se utente autenticato: consenso salvato anche in `consent_logs` (verificato da code review)
- [x] **E8** — Possibilita' di modificare le preferenze successivamente (verificato da code review: resetCookieConsent in Impostazioni)

---

## F. Cancellazione account (diritto all'oblio)

- [x] **F1** — Pulsante "Elimina account" accessibile (verificato via screenshot Impostazioni: Zona pericolosa)
- [x] **F2** — AlertDialog con conferma "ELIMINA" (digitare la parola) (verificato da code review)
- [x] **F3** — Eliminati: profilo, CV master, candidature, tailored_cvs (verificato da code review: delete-account edge function)
- [x] **F4** — Eliminati: file da cv-uploads e cv-exports in Storage (verificato da code review)
- [x] **F5** — Cancellazione registrata in `consent_logs` (verificato da code review: audit log)
- [x] **F6** — L'utente viene disconnesso e reindirizzato alla landing page (verificato da code review)
- [ ] **F7** — Toast di conferma dopo l'eliminazione
- [ ] **F8** — Dopo eliminazione, le credenziali non funzionano piu'

---

## G. Export dati — Data Portability (Art. 20 GDPR)

- [x] **G1** — Pulsante "Scarica i miei dati" accessibile nelle Impostazioni (verificato da code review)
- [x] **G2** — Genera un file JSON strutturato con dati da 5 tabelle (verificato da code review)
- [x] **G3** — I dati JSON sono formattati e leggibili (verificato da code review: JSON.stringify con indentazione)
- [x] **G4** — Download diretto nel browser (verificato da code review: Blob + URL.createObjectURL)

---

## H. Pagina Impostazioni — Account

- [x] **H1** — Route `/app/impostazioni` accessibile dalla sidebar (desktop) e tab bar (mobile) (verificato via browser)
- [x] **H2** — Sezione Account mostra email dell'utente (sola lettura) (verificato via screenshot: giulia.laporta87@gmail.com)
- [x] **H3** — Sezione Account mostra nome utente dal profilo (sola lettura) (verificato da code: usa user_metadata.full_name)

---

## I. Pagina Impostazioni — Privacy e Dati

- [x] **I1** — Sezione "Privacy e Dati" visibile nelle impostazioni (verificato via screenshot)
- [x] **I2** — `ConsentRow` per ogni consenso mostra: icona stato, label, data concessione/revoca (verificato via screenshot)
- [x] **I3** — Consenso `terms`: non revocabile (pulsante Revoca assente) (verificato da code review)
- [x] **I4** — Consenso `privacy`: non revocabile (pulsante Revoca assente)
- [x] **I5** — Consenso `sensitive_data`: revocabile con warning (verificato da code review)
- [x] **I6** — Consenso `cookies`: revocabile tramite `resetCookieConsent()` (verificato da code review)
- [x] **I7** — Pulsante "Scarica i miei dati" presente e funzionante (verificato da code review)

---

## J. Pagina Impostazioni — Assistenza

- [ ] **J0** — Link "Guida & FAQ" presente con icona Question, punta a `/app/faq`
- [x] **J1** — Contatto supporto generale: supporto@verso-cv.app (verificato via screenshot)
- [x] **J2** — Contatto privacy e dati: privacy@verso-cv.app (verificato via screenshot)
- [x] **J3** — Tempi di risposta indicati: entro 48h lavorative (verificato via screenshot)

---

## K-bis. Pagina Impostazioni — Piano

- [ ] **K-bis1** — Sezione "Piano" visibile nella card Account
- [ ] **K-bis2** — Utente Free: mostra "Piano: Free" + link "Scopri Versō Pro" → `/upgrade`
- [ ] **K-bis3** — Utente Pro: mostra "Piano: Versō Pro" + badge + data rinnovo
- [ ] **K-bis4** — Utente Pro: "Gestisci fatturazione" → apre Stripe Customer Portal
- [ ] **K-bis5** — Utente Pro: "Cancella abbonamento" → dialog di conferma
- [ ] **K-bis6** — Conferma cancellazione → chiama `cancel-subscription` → `cancel_at_period_end: true`
- [ ] **K-bis7** — Dopo cancellazione: mostra data scadenza, messaggio accesso attivo fino a fine periodo
- [ ] **K-bis8** — Utente Pro in scadenza: mostra stato corretto (data scadenza, no rinnovo)

---

## K. Pagina Impostazioni — Sicurezza

- [x] **K1** — Cambio password: flusso Supabase Auth per reset password (verificato via screenshot: "Cambia password")
- [x] **K2** — Logout: termina sessione, redirect alla landing page (verificato via screenshot: "Esci dall'account")

---

## L. Pagina Impostazioni — Zona pericolosa

- [x] **L1** — Sezione visivamente separata con stile destructive (verificato via screenshot: bordo rosso)
- [x] **L2** — Pulsante "Elimina account" presente (verificato via screenshot)
- [x] **L3** — Conferma richiede di digitare `ELIMINA` (verificato da code review)
- [x] **L4** — Chiama la edge function `/delete-account` (verificato da code review)
- [x] **L5** — Dopo conferma: eliminazione account, logout e redirect (verificato da code review)

---

## M. Footer legale

- [x] **M1** — Footer con link legali nelle pagine pubbliche (verificato da code review)
- [x] **M2** — Link legali nella sidebar desktop (verificato via screenshot: T&C, Privacy, Cookie in basso)
- [x] **M3** — Tutti i link portano alle pagine corrette (verificato via browser)
- [x] **M4** — Lo stile e' discreto e coerente

---

## N. Database consent_logs

- [x] **N1** — Tabella `consent_logs` esiste nel database (verificato da DB query)
- [x] **N2** — RLS attiva: ogni utente vede solo i propri record (verificato da DB query: rowsecurity=true)
- [ ] **N3** — Indici su `user_id` e su `(user_id, consent_type)`
- [x] **N4** — I consensi di registrazione vengono salvati correttamente per EMAIL (tipo `terms` e `privacy`)
- [x] **N5** — I consensi di upload CV vengono salvati correttamente (tipo `sensitive_data`)
- [x] **N6** — I consensi cookie vengono salvati se utente autenticato (tipo `cookies`)
- [x] **N7** — La cancellazione account viene registrata prima dell'eliminazione (tipo `account_deletion`) (verificato da code review)
- [x] **N8** — Campi salvati: user_id, consent_type, status (granted/revoked), ip_address, user_agent, created_at

---

## Bug e Issues trovate

| ID | Severita' | Descrizione |
|----|-----------|-------------|
| BUG-LEGAL-01 | **CRITICO** | consent_logs vuoti per utenti Google OAuth — `saveRegistrationConsents` non viene chiamata dopo il redirect OAuth. Stessa issue di BUG-AUTH-01. |
