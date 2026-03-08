# Check — Auth + App Shell + Brand: Acceptance Criteria

Checklist completa per verificare autenticazione, app shell, design system, CORS e consensi.
Ogni criterio va testato manualmente e marcato come Pass / Fail.

---

## A. Registrazione Email

- [ ] **A1** — Il form mostra i campi Nome completo, Email, Password quando si clicca "Non hai un account?"
- [ ] **A2** — Il submit e' disabilitato se uno dei campi e' vuoto
- [ ] **A3** — Email con formato non valido mostra errore inline (es. `test@`, `test.com`)
- [ ] **A4** — Password troppo corta mostra errore (minimo Supabase: 6 caratteri)
- [ ] **A5** — Dopo il signup, appare un messaggio che indica di controllare l'email per conferma
- [ ] **A6** — L'email di conferma arriva effettivamente (controllare anche spam)
- [ ] **A7** — Click sul link di conferma: l'utente puo' fare login
- [ ] **A8** — Tentativo di login prima della conferma email mostra errore chiaro (non generico)
- [ ] **A9** — Registrarsi con email gia' esistente mostra errore senza rivelare se l'email esiste
- [ ] **A10** — Due checkbox obbligatorie (T&C + Privacy Policy) sono presenti nel form di registrazione
- [ ] **A11** — Le checkbox NON sono pre-spuntate (requisito GDPR)
- [ ] **A12** — Il pulsante "Crea account" e' disabilitato finche' entrambe le checkbox non sono spuntate
- [ ] **A13** — Dopo signup + conferma, esiste una riga nella tabella `profiles` con `id` e `full_name` corretti (verificare in Supabase Dashboard > Table Editor)
- [ ] **A14** — Dopo la registrazione, i consensi vengono salvati in `consent_logs` (tipo `terms` e `privacy`)
- [ ] **A15** — Il pulsante mostra stato di loading durante la chiamata (nessun doppio click possibile)

---

## B. Login Email

- [ ] **B1** — Email + password corrette: redirect a `/app/home`
- [ ] **B2** — Email corretta + password sbagliata: errore in italiano
- [ ] **B3** — Email non registrata: errore (stessa UX di password sbagliata, per sicurezza)
- [ ] **B4** — Il pulsante "Accedi" mostra loading durante la chiamata
- [ ] **B5** — Dopo login, la sessione persiste al refresh della pagina (F5)
- [ ] **B6** — Dopo login, la sessione persiste alla chiusura e riapertura del tab
- [ ] **B7** — Utente gia' autenticato che visita `/login`: redirect automatico a `/app/home`
- [ ] **B8** — Campi email e password supportano paste e autofill del browser

---

## C. Logout

- [ ] **C1** — Esiste un'azione di logout accessibile dall'interfaccia (sidebar o menu)
- [ ] **C2** — Click logout: sessione distrutta, redirect a `/login`
- [ ] **C3** — Dopo logout, il back button del browser NON riporta all'app (route protetta)
- [ ] **C4** — Dopo logout, visitare `/app/home` direttamente: redirect a `/login`
- [ ] **C5** — Dopo logout, un nuovo login funziona normalmente

---

## D. Password Reset

- [ ] **D1** — Link "Password dimenticata?" visibile nella pagina login
- [ ] **D2** — Click: appare un campo per inserire l'email
- [ ] **D3** — Inserire email registrata: messaggio di conferma ("Email inviata")
- [ ] **D4** — Inserire email non registrata: stesso messaggio di conferma (non rivelare se l'email esiste)
- [ ] **D5** — L'email di reset arriva effettivamente
- [ ] **D6** — Click sul link nell'email: apre `/reset-password`
- [ ] **D7** — L'utente puo' inserire e confermare la nuova password
- [ ] **D8** — Dopo il reset: redirect a `/app/home` (utente autenticato)
- [ ] **D9** — La vecchia password non funziona piu'
- [ ] **D10** — La nuova password funziona (logout + login con nuova password)
- [ ] **D11** — Il link di reset scade dopo il tempo previsto (default Supabase: 1 ora)
- [ ] **D12** — Usare lo stesso link di reset due volte: la seconda volta fallisce

---

## E. Google OAuth

- [ ] **E1** — Pulsante "Continua con Google" visibile nella pagina login
- [ ] **E2** — Click: apre il flusso di consenso Google (popup o redirect)
- [ ] **E3** — Dopo autorizzazione: redirect a `/app/home`
- [ ] **E4** — L'utente viene creato in Supabase Auth con provider Google (verificare in Supabase Dashboard > Authentication)
- [ ] **E5** — Il trigger crea la riga in `profiles` con `full_name` preso da Google (verificare in Table Editor)
- [ ] **E6** — Un secondo login con lo stesso account Google funziona (non crea duplicati)
- [ ] **E7** — Google OAuth e' bloccato se le checkbox T&C + Privacy non sono spuntate
- [ ] **E8** — Se l'utente ha gia' un account email con la stessa email Google, il comportamento e' gestito (merge o errore chiaro)
- [ ] **E9** — Se l'utente annulla il flusso Google (chiude il popup), torna alla pagina login senza errori

---

## F. Protezione Route

- [ ] **F1** — Utente non autenticato su qualsiasi URL `/app/*`: redirect a `/login`
- [ ] **F2** — Utente non autenticato su `/onboarding`: redirect a `/login`
- [ ] **F3** — Durante il caricamento dell'auth state, appare un loading (nessun flash della pagina login)
- [ ] **F4** — Sessione scaduta o invalidata: al prossimo refresh, redirect a `/login`
- [ ] **F5** — Dopo login, l'utente viene rediretto alla pagina che stava cercando di visitare (deep link), non sempre a `/app/home`

---

## G. Edge Case e Sicurezza

- [ ] **G1** — Doppio click rapido sul pulsante login/signup non causa errori o chiamate duplicate
- [ ] **G2** — Login da due tab contemporaneamente funziona senza conflitti
- [ ] **G3** — L'app gestisce la perdita di connessione durante login/signup con errore comprensibile
- [ ] **G4** — I campi password sono di tipo `password` (mascherati)
- [ ] **G5** — Nessun dato sensibile (password, token) nei log della console del browser
- [ ] **G6** — La pagina login e' responsive (funziona su viewport mobile)
- [ ] **G7** — Il form supporta l'invio con Enter (non serve cliccare il pulsante)

---

## H. App Shell

- [ ] **H1** — Desktop (>=1024px): sidebar sinistra con logo "VERSO", link navigazione (Home, Candidature, Nuova, Impostazioni), nome utente in fondo
- [ ] **H2** — Mobile (<1024px): bottom tab bar con 3 tab (Home, + FAB accent, Candidature)
- [ ] **H3** — Tab attiva su mobile: dot accent sotto l'icona
- [ ] **H4** — Sidebar collassata funziona nella fascia 1024-1279px
- [ ] **H5** — Logo "VERSO" in Syne 800, lettera "O" in accent (`#A8FF78`)
- [ ] **H6** — Navigazione sidebar: Home -> House, Candidature -> icona lista, Nuova -> Plus (accent), Impostazioni -> GearSix

---

## I. Design System e Brand

- [ ] **I1** — Dark mode only: background `#0C0D10`, `<html class="dark">` permanente
- [ ] **I2** — Font Syne (700, 800) per headline, DM Sans (400, 500) per body, JetBrains Mono (400, 500) per numeri/chip
- [ ] **I3** — Accent `#A8FF78` usato per CTA, score, elementi interattivi
- [ ] **I4** — Icone Phosphor (@phosphor-icons/react) con pesi duotone, regular, fill
- [ ] **I5** — Animazioni Framer Motion per transizioni

---

## J. Route e 404

- [ ] **J1** — Route `/termini`, `/privacy`, `/cookie-policy` sono pubbliche (accessibili senza login)
- [ ] **J2** — Route `/app/home`, `/app/candidature`, `/app/impostazioni`, `/app/cv-edit`, `/app/candidatura/:id` sono protette
- [ ] **J3** — Pagina 404 in italiano per URL non riconosciuti
- [ ] **J4** — Redirect sanitizer: solo path `/app/*` ammessi come redirect post-login

---

## K. CORS e Sicurezza

- [ ] **K1** — Edge functions usano `getCorsHeaders()` da `_shared/cors.ts` (non `Access-Control-Allow-Origin: *`)
- [ ] **K2** — Whitelist CORS include: `verso-cv.lovable.app`, `localhost`
- [ ] **K3** — RLS attivo su tutte le tabelle: ogni utente vede solo i propri dati
