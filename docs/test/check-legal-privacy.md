# Check — Legal, Privacy e Trasparenza AI: Acceptance Criteria

Checklist per verificare l'implementazione degli aspetti legali, privacy GDPR e trasparenza AI.

---

## A. Pagine legali

- [ ] **A1** — Pagina `/termini` accessibile senza autenticazione
- [ ] **A2** — Pagina `/privacy` accessibile senza autenticazione
- [ ] **A3** — Pagina `/cookie-policy` accessibile senza autenticazione
- [ ] **A4** — Tutte le pagine in italiano con linguaggio chiaro
- [ ] **A5** — Layout dark mode, responsive, font DM Sans
- [ ] **A6** — `LegalLayout` condiviso: metadata con versione del documento e data di ultimo aggiornamento
- [ ] **A7** — `LegalLayout`: header con backlink per tornare alla pagina precedente
- [ ] **A8** — Desktop: sidebar con Table of Contents (TOC) navigabile
- [ ] **A9** — T&C contengono 11 articoli: oggetto, descrizione servizio, limiti AI, account/registrazione, obblighi utente, contenuti utente, proprieta' intellettuale, disponibilita', limitazione responsabilita', legge applicabile, diritto di recesso
- [ ] **A10** — Privacy Policy contiene: dati trattati (identificativi, CV, navigazione), art. 9 GDPR, finalita'/basi giuridiche (consenso, esecuzione contratto, legittimo interesse), sub-processori (Supabase, Google Gemini, Google OAuth), diritti interessato, misure sicurezza, conservazione (30 giorni dopo cancellazione)
- [ ] **A11** — Cookie Policy contiene: cookie tecnici (si'), analitici (no), profilazione (no), come gestirli

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
- [ ] **F6** — L'utente viene disconnesso e reindirizzato alla landing page
- [ ] **F7** — Toast di conferma dopo l'eliminazione
- [ ] **F8** — Dopo eliminazione, le credenziali non funzionano piu'

---

## G. Export dati — Data Portability (Art. 20 GDPR)

- [ ] **G1** — Pulsante "Scarica i miei dati" accessibile nelle Impostazioni
- [ ] **G2** — Genera un file JSON strutturato con dati da 5 tabelle: profiles, master_cvs, applications, tailored_cvs, consent_logs
- [ ] **G3** — I dati JSON sono formattati e leggibili
- [ ] **G4** — Download diretto nel browser

---

## H. Pagina Impostazioni — Account

- [ ] **H1** — Route `/app/impostazioni` accessibile dalla sidebar (desktop) e tab bar (mobile)
- [ ] **H2** — Sezione Account mostra email dell'utente (sola lettura)
- [ ] **H3** — Sezione Account mostra nome utente dal profilo (sola lettura)

---

## I. Pagina Impostazioni — Privacy e Dati

- [ ] **I1** — Sezione "Privacy e Dati" visibile nelle impostazioni
- [ ] **I2** — `ConsentRow` per ogni consenso mostra: icona stato, label, data concessione/revoca
- [ ] **I3** — Consenso `terms`: non revocabile (pulsante Revoca assente)
- [ ] **I4** — Consenso `privacy`: non revocabile (pulsante Revoca assente)
- [ ] **I5** — Consenso `sensitive_data`: revocabile con warning ("Non potrai caricare nuovi CV...")
- [ ] **I6** — Consenso `cookies`: revocabile tramite `resetCookieConsent()`, ripristina il banner cookie
- [ ] **I7** — Pulsante "Scarica i miei dati" presente e funzionante

---

## J. Pagina Impostazioni — Assistenza

- [ ] **J1** — Contatto supporto generale: supporto@verso-cv.app
- [ ] **J2** — Contatto privacy e dati: privacy@verso-cv.app
- [ ] **J3** — Tempi di risposta indicati: entro 48h lavorative

---

## K. Pagina Impostazioni — Sicurezza

- [ ] **K1** — Cambio password: flusso Supabase Auth per reset password
- [ ] **K2** — Logout: termina sessione, redirect alla landing page

---

## L. Pagina Impostazioni — Zona pericolosa

- [ ] **L1** — Sezione visivamente separata con stile destructive
- [ ] **L2** — Pulsante "Elimina account" presente
- [ ] **L3** — Conferma richiede di digitare `ELIMINA`
- [ ] **L4** — Chiama la edge function `/delete-account`
- [ ] **L5** — Dopo conferma: eliminazione account, logout e redirect

---

## M. Footer legale

- [ ] **M1** — Footer con link legali nelle pagine pubbliche
- [ ] **M2** — Link legali nella sidebar desktop
- [ ] **M3** — Tutti i link portano alle pagine corrette
- [ ] **M4** — Lo stile e' discreto e coerente

---

## N. Database consent_logs

- [ ] **N1** — Tabella `consent_logs` esiste nel database
- [ ] **N2** — RLS attiva: ogni utente vede solo i propri record
- [ ] **N3** — Indici su `user_id` e su `(user_id, consent_type)`
- [ ] **N4** — I consensi di registrazione vengono salvati correttamente (tipo `terms` e `privacy`)
- [ ] **N5** — I consensi di upload CV vengono salvati correttamente (tipo `sensitive_data`)
- [ ] **N6** — I consensi cookie vengono salvati se utente autenticato (tipo `cookies`)
- [ ] **N7** — La cancellazione account viene registrata prima dell'eliminazione (tipo `account_deletion`)
- [ ] **N8** — Campi salvati: user_id, consent_type, status (granted/revoked), ip_address, user_agent, created_at
