

# 🚀 Piano di Implementazione — Verso MVP (Epic 01–03)

---

## Epic 01 — Auth + Brand System + App Shell

### 1.1 Design System Globale
- **Dark mode permanente** — sfondo `#0C0D10`, nessun light mode
- Import Google Fonts: **Syne** (700, 800), **DM Sans** (400, 500), **JetBrains Mono** (400, 500)
- Tutte le CSS variables dal brand system applicate in `index.css` (colori, spacing, radius, gradienti)
- Override completo del tema Tailwind: tutti i token Verso mappati come classi (`accent`, `surface`, `surface-2`, `border-subtle`, ecc.)
- Nessun colore shadcn default visibile
- Installazione **Phosphor Icons** e **Framer Motion**

### 1.2 Supabase + Database
- Connessione a **Lovable Cloud** (Supabase integrato)
- Creazione 4 tabelle: `profiles`, `master_cvs`, `applications`, `tailored_cvs`
- **RLS** su tutte le tabelle (ogni utente vede solo i propri dati)
- **Trigger** auto-creazione profilo su signup (`auth.users` → `profiles`)

### 1.3 Autenticazione
- Pagina `/login` con card centrata su sfondo scuro
- Logo "VERSO" (Syne 800, "O" verde accent)
- Form email + password con toggle signup/signin (campo "Nome completo" per signup)
- Pulsante **"Continua con Google"** (OAuth)
- Redirect non-autenticato → `/login`
- Redirect post-login → `/app/home`
- Redirect utente già loggato che visita `/login` → `/app/home`

### 1.4 App Shell
- **Desktop (≥1024px):** Sidebar sinistra con logo, link navigazione (Home, Candidature, Nuova +), nome utente + avatar in fondo. 240px espansa / 64px collassata (solo icone)
- **Mobile (<1024px):** Bottom tab bar con effetto frosted glass, 3 tab (Home, FAB accent "+", Candidature). Dot verde accent sotto tab attiva
- Icone Phosphor per tutta la navigazione

### 1.5 Pagine Placeholder
- `/app/home` → "Ciao [Nome]" con messaggio contestuale e CTA
- `/app/nuova` → placeholder "In costruzione"

---

## Epic 02 — Onboarding (Upload CV)

### 2.1 Pagina `/onboarding`
- Card centrata (max 560px), titolo "Carica il tuo CV" in Syne
- **Area drag & drop** con bordo tratteggiato, icona FileArrowUp
- Accetta solo PDF, max 10 MB
- Dopo selezione: mostra nome file + dimensione + icona FileText
- Redirect automatico da dashboard se utente non ha record in `master_cvs`

### 2.2 Parsing CV (Edge Function)
- Edge function `parse-cv` che:
  - Riceve il PDF, estrae il testo
  - Invia a Claude API per strutturare in JSON (personal, summary, experience, education, skills, certifications, projects)
- **Loading:** skeleton card con "Verso sta leggendo il tuo CV..." + progress bar indeterminata

### 2.3 Anteprima & Salvataggio
- Card con dati estratti organizzati per sezione
- **Tag cloud** delle skill principali (chip verde accent)
- Nota di onestà: "Verso conosce solo quello che hai scritto nel tuo CV"
- Pulsante "Tutto corretto, continua →" → salva in `master_cvs` → redirect a `/app/home`
- **Error states** completi (file non PDF, troppo grande, parsing fallito, timeout)

### 2.4 Dashboard Aggiornata
- Se ha CV: "Sei pronto per la tua prima candidatura" + CTA "Nuova candidatura →"
- Se non ha CV: "Inizia caricando il tuo CV" + CTA → `/onboarding`

---

## Epic 03 — Wizard Nuova Candidatura (3 step)

### Step 1: L'annuncio
- Card centrata (max 640px), due tab: **URL** (default) e **Testo**
- **Tab URL:** campo input + pulsante "Analizza" → edge function `scrape-job` (fetch URL server-side, estrazione via Claude di company_name, role_title, role_description)
- **Tab Testo:** textarea grande come fallback manuale (switch automatico se URL fallisce)
- **Preview card** post-estrazione: nome azienda e titolo ruolo editabili inline, 3-5 bullet requisiti chiave, pulsante "Conferma e analizza →"

### Step 2: Analisi AI
- Avvio automatico dopo conferma step 1
- Chiama edge function `ai-tailor` con master CV + job description
- **Loading:** 3 skeleton card sequenziali con messaggi progressivi (confronto → match → adattamento)
- **Score meter:** barra orizzontale con gradiente rosso→giallo→verde, animazione Framer Motion da 0 al valore (800ms)
- **Skill match:** due colonne — "Hai già" (chip verdi) e "Ti mancano" (chip rossi con badge importanza)
- **Suggerimenti:** lista modifiche proposte con testo originale barrato → testo suggerito evidenziato
- Pulsante "Vedi il CV adattato →"

### Step 3: CV Adattato (Diff View)
- **Desktop:** 2 colonne affiancate (Originale vs Adattato), sezioni modificate con `border-left` verde accent
- **Mobile:** tab switcher (Originale | Adattato) con stessa evidenziazione
- Header con titolo "[Ruolo] — [Azienda]" + badge score
- **Bottom bar fissa:** "Scarica PDF" (primario) + "Salva candidatura" (secondario)
- Salvataggio crea record in `applications` + `tailored_cvs` → redirect a `/app/home`

### Step Indicator
- Barra orizzontale con 3 dot (completato verde, attuale pulsante, futuro grigio)
- Navigazione back con freccia ArrowLeft

---

## Note Tecniche
- Backend tramite **Lovable Cloud** (Supabase integrato) — nessun account esterno necessario
- **3 Edge Functions** da creare: `parse-cv`, `scrape-job`, `ai-tailor`
- Richiederà un **API key Claude/Anthropic** configurata come secret
- Epic 04 (AI Engine) e Epic 05 (PDF Export + Dashboard) saranno pianificati dopo aver caricato i relativi file

