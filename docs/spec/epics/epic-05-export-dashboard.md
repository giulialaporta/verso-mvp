# Epic 05 — Export PDF + Dashboard Home (Implementato)

---

## Cosa è stato costruito

1. Sistema template PDF con 4 layout (2 free + 2 Pro-only)
2. Generazione PDF e DOCX nel browser con download + upload automatico
3. Revisione formale automatica del CV prima dell'export
4. Dashboard home con 3 stati, statistiche, CV card collapsible e gestione CV
5. Pagina CVEdit per modificare il CV master senza ri-upload

> **Differenza dal piano MVP:** il piano prevedeva 4 template (2 free + 2 pro), export DOCX, e drawer ATS separato. Implementati 4 template (2 free + 2 Pro), export PDF + DOCX (Pro-only), revisione formale automatica, e pannelli ATS/Honest Score integrati nel wizard.

---

## 1. Template PDF

Ogni template è un componente `@react-pdf/renderer` che riceve il JSON del CV adattato (`tailored_data`) e lo renderizza.

### Template 1: Classico

- Header scuro (`#141518`) con nome completo (DM Sans 600 22px, bianco)
- Email | telefono | località sotto (DM Sans 400 11px, grigio chiaro)
- Body sfondo bianco con testo nero
- Sezioni: Profilo → Esperienza → Formazione → Competenze → Certificazioni → Progetti
- Titoli sezione: DM Sans 600 12px uppercase, con linea sotto
- Competenze come testo inline separato da " · "
- Formato A4, margini 24mm

### Template 2: Minimal

- Tutto sfondo bianco, nessun header colorato
- Nome in Inter 600 24px, dati contatto in Inter 400 10px separati da " | "
- Linea sottile (0.5px, grigio chiaro) tra le sezioni
- Titoli sezione: Inter 600 11px uppercase
- Massima pulizia e leggibilità
- Formato A4, margini 22mm

### Template 3: Executive (Pro-only)

- Layout a 2 colonne con sidebar scura
- Design professionale per ruoli senior/executive
- Font serif o sans-serif elegante
- Sidebar con skill, lingue, certificazioni
- Main body con esperienza e formazione
- Lucchetto per utenti Free

### Template 4: Moderno (Pro-only)

- Design contemporaneo con colori accent
- Layout pulito con elementi grafici moderni
- Icone e badge per skill
- Lucchetto per utenti Free

### Best practice ATS (tutti i template)

- Layout single-column
- Heading standard
- Testo selezionabile
- Font 10-12pt
- Margini ≥ 20mm
- Nessuna immagine per testo, nessuna tabella

---

## 2. Generazione e Download PDF + DOCX

**Revisione formale automatica:**
- Al mount dello step export, viene chiamata `cv-formal-review` in background
- Controlla coerenza date, maiuscole, lingua, bullet, punteggiatura
- Il CV revisionato viene usato per tutti gli export
- Se fallisce, viene usato il CV originale (nessun blocco)
- Status visibile all'utente con lista correzioni espandibile

**Flusso PDF:**
1. Utente seleziona template (4 disponibili: 2 free + 2 Pro) nello step 5 del wizard
2. Preview dei pannelli ATS Score e Honest Score
3. Click "Scarica PDF"
4. Generazione nel browser con `@react-pdf/renderer`
5. Download diretto
6. Upload automatico su Supabase Storage: `cv-exports/{userId}/{applicationId}/{filename}`
7. URL pubblico salvato in `tailored_cvs.pdf_url`
8. Template scelto salvato in `tailored_cvs.template_id`

**Flusso DOCX (Pro-only):**
1. Click "Scarica DOCX" (icona FileDoc)
2. Se utente Free → redirect a `/upgrade` (icona Lock + Crown)
3. Generazione nel browser con libreria `docx` (`docx-generator.ts`)
4. Stile DOCX adattato al template selezionato (4 stili: classico, minimal, executive, moderno)
5. Download diretto
6. Upload automatico su Supabase Storage

**Sistema densita' adattiva (template-utils.ts):**
- 5 livelli: NORMAL → COMPACT → DENSE → ULTRA → EXTREME
- `computeDensity()` calcola il tier in base alla lunghezza del CV
- Ogni livello riduce font size, margini, line-height, max bullet, max esperienze
- `truncateSummary()`, `limitExperiences()`, `truncateBullets()` per tier estremi

**Nome file:** `CV-{Nome}-{Azienda}.pdf` / `CV-{Nome}-{Azienda}.docx`

---

## 3. Dashboard Home

Route `/app/home` — pagina principale dopo il login.

### Stato 1: Nessun CV (virgin state)

- Saluto "Ciao [Nome]"
- Flusso onboarding a 3 step visualizzato con card locked (non solo CTA)
- I 3 step sono bloccati e indicano la sequenza: carica CV → compila dati → crea candidatura
- Click sullo step 1 → redirect a `/onboarding`
- Vista di benvenuto che guida l'utente passo dopo passo

### Stato 2: CV caricato, nessuna candidatura

- Saluto "Ciao [Nome]"
- CV Card collapsible (vedi sotto)
- CTA "Nuova candidatura" → redirect a `/app/nuova`

### Stato 3: CV + candidature presenti (Home redesign)

**HeroSection:**
- Avatar grande (64-80px) con click per upload nuova foto profilo (`useAvatarUpload`)
- Nome (solo primo nome) in `text-2xl/3xl font-bold`
- **Headline AI-compattata** — job title abbreviato via `compact-headline` edge function (cachato in localStorage)
- Badge piano: "Pro" (accent) o "Free" (muted) con "In scadenza" se `cancel_at_period_end`
- Stats inline: candidature attive/totali + match score medio
- CTA "Nuova candidatura" con gradient accent (`Plus` icon)

**Candidature recenti:**
- Mostra le ultime 3 candidature con card specifiche per status (`pronta` ha bordo accent)
- Card con: iniziale azienda, ruolo, azienda, data, MatchScoreCompact, StatusChip
- Hover su una card → prefetch dei dati candidatura (`usePrefetchApplication`)
- Link "Vedi tutte" a pagina candidature

**CV Card (collapsible):**
- Collassabile con toggle
- Azioni: Modifica CV, Carica nuovo, Scarica PDF, Soft/Hard delete, Riattivazione

**Post-upgrade polling:**
- Se query param `upgrade=success` → polling `check-subscription` fino a `is_pro = true` → toast di benvenuto

**Nota:** `SalaryDisplay` e' stato spostato dalla Home a Impostazioni (card "Aspettative RAL").

---

## 4. Pagina CVEdit

Route `/app/cv-edit` — pagina dedicata alla modifica del CV master.

- Permette di modificare il CV caricato senza dover fare un nuovo upload
- Editing inline delle sezioni del CV (esperienze, formazione, competenze, ecc.)
- Salvataggio modifiche su DB
- Redirect alla home dopo il salvataggio

---

## Componenti chiave

| Componente | Scopo |
|------------|-------|
| `ClassicoTemplate` | Template PDF tradizionale (free) |
| `MinimalTemplate` | Template PDF moderno/pulito (free) |
| `ExecutiveTemplate` | Template PDF executive con sidebar (Pro-only) |
| `ModernoTemplate` | Template PDF contemporaneo con accent (Pro-only) |
| `docx-generator.ts` | Generatore DOCX con 4 stili template (Pro-only) |
| `template-utils.ts` | Utility condivise: clean, ensureArray, densita' adattiva (5 tier) |
| `MatchScore` | Score con anello animato + badge (rinominato da VersoScore) |
| `ExportDrawer` | Pannello export con template picker + score |
| `HeroSection` | Hero con avatar, nome, headline AI, badge piano, stats, CTA (interno a Home.tsx) |
| `RecentApplications` | Lista ultime 3 candidature con hover prefetch (interno a Home.tsx) |
| `CVCard` | Card collapsible con azioni CV (interno a Home.tsx) |
| `useCompactHeadline` | Hook: chiama `compact-headline` con cache localStorage (interno a Home.tsx) |
| `useAvatarUpload` | Hook: upload avatar con resize 200px su bucket `avatars` |

---

## Cosa NON è stato implementato (rispetto al piano MVP)

| Feature | Stato |
|---------|-------|
| Template Executive (Pro) | Implementato (Pro-only con lucchetto) |
| Template Moderno (Pro) | Implementato (Pro-only con lucchetto) |
| Sistema Free/Pro template | Implementato (2 free + 2 Pro) |
| Export DOCX | Implementato (Pro-only, libreria `docx`, 4 stili) |
| Preview PDF live nel drawer | Parziale |
| Badge "ATS-Ready ✓" | Non implementato come badge |
| Seniority warning sulle card | Non implementato come tooltip |
| Honest Score accordion nel drawer | Integrato nel wizard |
