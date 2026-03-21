# Epic 05 — Export PDF + Dashboard Home (Implementato)

---

## Cosa è stato costruito

1. 2 output fissi per ogni candidatura: CV_VISUAL (PDF) + CV_ATS (DOCX)
2. Revisione formale automatica del CV prima dell'export
3. Dashboard home con 3 stati, statistiche, CV card collapsible e gestione CV
4. Pagina CVEdit per modificare il CV master senza ri-upload

> **Cambio rispetto al piano precedente:** sostituiti i 4 template selezionabili (Classico, Minimal, Executive, Moderno) con 2 output fissi sempre disponibili. DOCX non più Pro-only. Sezione teaser "Altri template recruiter" con 3 card bloccate anticipa feature Pro futura.

---

## 1. I due output CV

### CV_VISUAL — PDF brand Verso

Template HTML/CSS `visual` renderizzato via `render-cv` edge function, stampato via hidden iframe.

**Layout:** 2 colonne — sidebar scura (28%) + body bianco (72%)

**Colori:**
- Sidebar: `#1C1F26` background, `#F2F3F7` testo, `#6EBF47` accent
- Body: `#FFFFFF` background, `#1F2937` testo
- KPI badge: background `#F0FAE0`, bordo `#9ED940`, testo `#14532D`
- Meta: `#6B7280`

**Sidebar:** foto circolare 72px (fallback: iniziali su sfondo accent), contatti, competenze, lingue, certificazioni

**Body:** nome, headline, KPI badges estratti automaticamente dai bullet (max 6, regex su numeri+unità), summary, esperienze, formazione, progetti

**Bullet:** marker `·` verde accent, struttura: **Etichetta bold** + testo

**Font:** DM Sans (Google Fonts). Fallback: sans-serif.

**Generazione:** `render-cv` edge function con `template_id: "visual"`, `format: "html"` per preview, stampa via hidden iframe (`printIframeRef`)

### CV_ATS — DOCX ottimizzato ATS

Generato client-side da `docx-generator.ts` con libreria `docx` (npm).

**Regole applicate:**
- Singola colonna, nessuna sidebar o tabella
- Contatti su riga unica con tab stop (non tabella)
- Font Calibri, titoli sezione standard
- Nessun em dash / en dash → trattino
- Colori: NERO `#111827` + VERDE `#166534` soltanto

**Nome file:** `CV-{Nome}-{Azienda}-ATS.docx`

---

## 2. StepExport — Flusso e UI

**Al mount dello step — sequenza bloccante:**
1. `cv-formal-review` → aspetta completamento (o errore con fallback a `tailoredCv`)
2. Solo dopo: `render-cv(format:"html")` con il CV revisionato (`reviewedCv`)
3. Pulsanti PDF e DOCX disabilitati finché `pipelineStatus !== "ready"`

**Banner di stato (pipelineStatus):**
- `reviewing` → spinner "Revisione formale in corso..."
- `rendering` → spinner "Generazione anteprima..."
- `ready` (0 fix) → banner verde "Pronto ✓"
- `ready` (N fix) → collapsible con lista correzioni (section, field, problema, correzione)
- `error` (review fallita) → banner warning + fallback a CV grezzo + pipeline continua

**Layout a 2 card:**
- **CV Recruiter** — iframe preview A4 scalato con ResizeObserver + pulsante "Stampa / Salva PDF"
- **CV ATS** — ATSPreview testuale (font mono, sezioni stilizzate, colori NERO/VERDE) + pulsante "Scarica DOCX"

**Sezione teaser "Altri template recruiter":**
- 3 card opacizzate: Executive, Minimal, Moderno
- Label "Prossimamente con Verso Pro" — non cliccabili
- Visibili per tutti (Free e Pro)

**Score badges in fondo:** Match%, ATS%, Confidence%

**Gate Free/Pro:** nessuno sull'export — entrambi i formati disponibili per tutti. Il gate è solo sul numero di candidature (`free_apps_used`).

**Nome file PDF:** `CV-{Nome}-{Azienda}.pdf` (via dialog di stampa/salva)
**Nome file DOCX:** `CV-{Nome}-{Azienda}-ATS.docx`

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
| `CVPreview` | iframe preview A4 del CV_VISUAL con scaling via ResizeObserver (interno a StepExport) |
| `ATSPreview` | Anteprima testuale del CV_ATS in font mono (interno a StepExport) |
| `docx-generator.ts` | Generatore DOCX ATS client-side con libreria `docx` (disponibile per tutti) |
| `template-utils.ts` | Utility condivise: clean, ensureArray, MAX_SIDEBAR_SKILLS |
| `render-cv` (Edge Function) | Compila template HTML + genera PDF/HTML — include template `visual` |
| `MatchScore` | Score con anello animato + badge |
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
