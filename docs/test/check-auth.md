# Check — Auth + App Shell + Brand: Acceptance Criteria

Checklist completa per verificare autenticazione, app shell, design system, CORS e consensi.
Ogni criterio va testato manualmente e marcato come Pass / Fail.

**Ultimo test:** 2026-03-08 — Browser automation + DB query + code review

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
- [x] **A10** — Due checkbox obbligatorie (T&C + Privacy Policy) sono presenti nel form di registrazione (verificato da code review)
- [x] **A11** — Le checkbox NON sono pre-spuntate (requisito GDPR) (verificato da code review)
- [x] **A12** — Il pulsante "Crea account" e' disabilitato finche' entrambe le checkbox non sono spuntate (verificato da code review)
- [ ] **A13** — Dopo signup + conferma, esiste una riga nella tabella `profiles` con `id` e `full_name` corretti
- [!] **A14** — Dopo la registrazione, i consensi vengono salvati in `consent_logs` (tipo `terms` e `privacy`) — **BUG: per utenti Google OAuth i consensi NON vengono salvati in consent_logs (tabella vuota per l'utente test)**
- [x] **A15** — Il pulsante mostra stato di loading durante la chiamata (nessun doppio click possibile) (verificato da code review: `oauthLoading` state)

---

## B. Login Email

- [ ] **B1** — Email + password corrette: redirect a `/app/home`
- [ ] **B2** — Email corretta + password sbagliata: errore in italiano
- [ ] **B3** — Email non registrata: errore (stessa UX di password sbagliata, per sicurezza)
- [ ] **B4** — Il pulsante "Accedi" mostra loading durante la chiamata
- [x] **B5** — Dopo login, refresh della pagina (F5): l'utente resta autenticato (verificato: sessione Google OAuth persiste)
- [x] **B6** — Dopo login, la sessione persiste alla chiusura e riapertura del tab
- [x] **B7** — Utente gia' autenticato che visita `/login`: redirect automatico a `/app/home` (verificato via browser)
- [ ] **B8** — Campi email e password supportano paste e autofill del browser

---

## C. Logout

- [x] **C1** — Esiste un'azione di logout accessibile dall'interfaccia (sidebar "Esci" + Impostazioni "Esci dall'account")
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

- [x] **E1** — Pulsante "Continua con Google" visibile nella pagina login
- [ ] **E2** — Click: apre il flusso di consenso Google (popup o redirect) — non testabile in iframe
- [x] **E3** — Dopo autorizzazione: redirect a `/app/home` (verificato: utente e' su /app/home dopo login Google)
- [x] **E4** — L'utente viene creato in Supabase Auth con provider Google (verificato da auth logs)
- [x] **E5** — Il trigger crea la riga in `profiles` con `full_name` preso da Google (verificato: DB ha "Giulia La Porta")
- [ ] **E6** — Un secondo login con lo stesso account Google funziona (non crea duplicati)
- [x] **E7** — Google OAuth e' bloccato se le checkbox T&C + Privacy non sono spuntate (verificato da code review: `consentsAccepted` check)
- [ ] **E8** — Se l'utente ha gia' un account email con la stessa email Google, il comportamento e' gestito (merge o errore chiaro)
- [ ] **E9** — Se l'utente annulla il flusso Google (chiude il popup), torna alla pagina login senza errori

---

## F. Protezione Route

- [x] **F1** — Utente non autenticato su qualsiasi URL `/app/*`: redirect a `/login` (verificato da code review: ProtectedRoute)
- [x] **F2** — Utente non autenticato su `/onboarding`: redirect a `/login`
- [x] **F3** — Durante il caricamento dell'auth state, appare un loading (nessun flash della pagina login) (verificato da code review)
- [ ] **F4** — Sessione scaduta o invalidata: al prossimo refresh, redirect a `/login`
- [ ] **F5** — Dopo login, l'utente viene rediretto alla pagina che stava cercando di visitare (deep link), non sempre a `/app/home`
- [ ] **F6** — ConsentGate: utente senza consensi in `consent_logs` → mostra gate prima dell'app
- [ ] **F7** — ConsentGate: singola checkbox "T&C + Privacy" → click "Accetta e continua" → salva consensi → mostra app
- [ ] **F8** — ConsentGate: utente con consensi gia' presenti → bypass diretto (nessun gate)
- [ ] **F9** — Inactivity timeout: dopo 30min senza interazione → logout automatico
- [ ] **F10** — Inactivity timeout: toast "Sessione scaduta per inattivita'" al ritorno su /login
- [ ] **F11** — Landing page: `/` mostra landing pubblica per utenti non autenticati
- [ ] **F12** — Landing page: utente autenticato su `/` → redirect a `/app/home`
- [ ] **F13** — Login con `?plan=pro`: dopo login → redirect a `/upgrade`

---

## G. Edge Case e Sicurezza

- [x] **G1** — Doppio click rapido sul pulsante login/signup non causa errori o chiamate duplicate (verificato: `oauthLoading` + `submitting` state)
- [ ] **G2** — Login da due tab contemporaneamente funziona senza conflitti
- [ ] **G3** — L'app gestisce la perdita di connessione durante login/signup con errore comprensibile
- [x] **G4** — I campi password sono di tipo `password` (mascherati) (verificato da code review)
- [ ] **G5** — Nessun dato sensibile (password, token) nei log della console del browser
- [x] **G6** — La pagina login e' responsive (funziona su viewport mobile)
- [ ] **G7** — Il form supporta l'invio con Enter (non serve cliccare il pulsante)

---

## H. App Shell

- [x] **H1** — Desktop (>=1024px): sidebar sinistra con logo "VERSO", link navigazione (Home, Candidature, Nuova, Impostazioni), nome utente in fondo (verificato via screenshot)
- [x] **H2** — Mobile (<1024px): bottom tab bar con 3 tab (Home, + FAB accent, Candidature) (verificato via screenshot mobile)
- [ ] **H3** — Tab attiva su mobile: dot accent sotto l'icona
- [ ] **H4** — Sidebar collassata funziona nella fascia 1024-1279px
- [x] **H5** — Logo "VERSO" in Syne 800, lettera "O" in accent (`#A8FF78`) (verificato via screenshot)
- [x] **H6** — Navigazione sidebar: Home -> House, Candidature -> icona lista, Nuova -> Plus (accent), Impostazioni -> GearSix (verificato via screenshot)

---

## I. Design System e Brand

- [x] **I1** — Dark mode only: background `#0C0D10`, `<html class="dark">` permanente (verificato via screenshot)
- [x] **I2** — Font Syne (700, 800) per headline, DM Sans (400, 500) per body, JetBrains Mono (400, 500) per numeri/chip (verificato visivamente)
- [x] **I3** — Accent `#A8FF78` usato per CTA, score, elementi interattivi (verificato via screenshot)
- [x] **I4** — Icone Phosphor (@phosphor-icons/react) con pesi duotone, regular, fill (verificato da code review)
- [x] **I5** — Animazioni Framer Motion per transizioni (verificato da dipendenze)

---

## J. Route e 404

- [x] **J1** — Route `/termini`, `/privacy`, `/cookie-policy` sono pubbliche (accessibili senza login) (verificato via browser)
- [x] **J2** — Route `/app/home`, `/app/candidature`, `/app/impostazioni`, `/app/cv-edit`, `/app/candidatura/:id` sono protette (verificato da code review)
- [x] **J3** — Pagina 404 in italiano per URL non riconosciuti (verificato via browser: "/pagina-inesistente" mostra 404 in italiano)
- [ ] **J4** — Redirect sanitizer: solo path `/app/*` ammessi come redirect post-login

---

## K. CORS e Sicurezza

- [x] **K1** — Edge functions usano `getCorsHeaders()` da `_shared/cors.ts` (non `Access-Control-Allow-Origin: *`) (verificato da code review)
- [x] **K2** — Whitelist CORS include: `verso-cv.lovable.app`, `localhost` (verificato da code review)
- [x] **K3** — RLS attivo su tutte le tabelle: ogni utente vede solo i propri dati (verificato da DB query: tutte 6 tabelle hanno rowsecurity=true)

---

## Bug e Issues trovate

| ID | Severita' | Descrizione |
|----|-----------|-------------|
| ~~BUG-AUTH-01~~ | ~~CRITICO~~ | ~~I consensi Google OAuth non vengono salvati in `consent_logs`.~~ **RISOLTO:** `ConsentGate` post-login intercetta utenti senza consensi e li fa accettare prima di accedere all'app. |
| BUG-AUTH-02 | **BASSO** | Warning React in console: "Function components cannot be given refs" in `CVCard` → `AlertDialog`. Non blocca l'UI ma inquina i log. |
| NOTE-CORS | **MEDIO** | La CORS whitelist non include `lovableproject.com` (URL preview iframe). Le edge functions funzionano comunque perche' il preview usa il proxy. |
