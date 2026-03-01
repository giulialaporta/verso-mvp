# Epic 05 — Export PDF + Template System + Dashboard Home

> Prerequisito: epic 01-04 completati. La edge function `ai-tailor` restituisce `ats_score`, `ats_checks`, `seniority_match` e `honest_score` oltre ai campi originali.

---

## Cosa costruire

1. Sistema template CV con 4 layout (2 free, 2 Pro)
2. Template picker con anteprima PDF live
3. Pannello ATS check visibile prima dell'export
4. Generazione e download PDF + DOCX
5. Dashboard home con lista candidature e doppio score

---

## 1. Template System

### Architettura

Ogni template è un componente `@react-pdf/renderer` che riceve lo stesso JSON (`tailored_cv.content`) e lo renderizza in modo diverso. I dati non cambiano — cambia solo la presentazione.

```
tailored_cv.content (JSON) → TemplateComponent(props) → PDF
```

### Font da registrare

Registrare con `Font.register()` di `@react-pdf/renderer`:
- **DM Sans** (400, 500, 700) — usato da Classico e Moderno
- **Inter** (400, 500, 600) — usato da Minimal
- **Libre Baskerville** (400, 700) — usato da Executive
- **JetBrains Mono** (400, 500) — usato da Moderno per skill/label

Tutti disponibili come Google Fonts (licenza OFL). Caricare i file `.ttf` nel progetto.

### I 4 template

Tutti **ATS-safe by design**: single-column, testo selezionabile, heading standard, nessuna tabella nel body, nessuna immagine per testo.

**Template 1: Classico (Free)**
- Header scuro (`#141518`) con nome completo (DM Sans 600 22px, bianco), email | telefono | località sotto (DM Sans 400 11px, grigio chiaro)
- Body sfondo bianco con testo nero
- Sezioni: Profilo → Esperienza → Formazione → Competenze → Certificazioni → Progetti
- Titoli sezione: DM Sans 600 12px uppercase, `letter-spacing: 0.08em`, con linea sottile sotto
- Font body: DM Sans 400 11px
- Competenze come testo inline separato da " · "
- Formato A4, margini 24mm

**Template 2: Minimal (Free)**
- Tutto sfondo bianco, nessun header colorato
- Nome in Inter 600 24px, dati di contatto in Inter 400 10px, separati da " | "
- Linea sottile (0.5px, grigio chiaro) tra le sezioni
- Titoli sezione: Inter 600 11px uppercase
- Font body: Inter 400 10.5px
- Massima pulizia, massima leggibilità
- Formato A4, margini 22mm

**Template 3: Executive (Pro)**
- Nome in Libre Baskerville 700 26px (serif), dati contatto in Inter 400 10px
- Titoli sezione in Libre Baskerville 700 12px
- Spaziatura verticale ampia (16px tra sezioni vs 10px degli altri)
- Body: Inter 400 11px
- Linea decorativa sottile sotto il nome (1px, nero)
- Tono formale e autorevole
- Formato A4, margini 26mm

**Template 4: Moderno (Pro)**
- Header con banda sottile accent (3px di altezza, colore `#A8FF78`) in cima alla pagina
- Nome in DM Sans 700 22px, dati contatto in DM Sans 400 10px
- Sezione Competenze con label in JetBrains Mono 400 10px (effetto "tag")
- Titoli sezione: DM Sans 600 11px, con piccolo dot accent (●) prima del titolo
- Body: DM Sans 400 11px
- Formato A4, margini 24mm

### Best practice ATS rispettate in tutti i template

- Layout single-column (no colonne affiancate)
- Sezioni con heading standard: "Profilo", "Esperienza", "Formazione", "Competenze"
- Competenze come testo (non chip grafici nel PDF)
- Font size 10-12pt
- Margini ≥ 20mm
- Testo selezionabile, nessuna immagine per il testo
- Struttura lineare top-to-bottom

---

## 2. Template Picker + ATS Panel (Drawer nello Step 3)

> **Vincolo:** l'epic 03 è già costruita con 3 step. Il template picker NON aggiunge uno step nuovo. Si attiva come drawer/overlay quando l'utente clicca "Scarica PDF" nello step 3.

### Flusso

1. L'utente è nello step 3 del wizard (diff view, già costruito in epic 03)
2. Clicca **"Scarica PDF"** nella bottom bar
3. Si apre un **drawer a schermo intero** (mobile) o **panel laterale destro 480px** (desktop) con:
   - Pannello ATS check (in alto)
   - Template picker (in basso)
   - Preview PDF live
   - Pulsante download

### Pannello ATS Check

Posizionato in cima al drawer, prima del template picker.

**Titolo:** "Controllo ATS" (DM Sans 500 16px)

**ATS Score:**
- Numero grande in JetBrains Mono 700 28px
- Colore in base al valore:
  - 0-50: `#FF6B6B`
  - 51-75: `#FFD166`
  - 76-100: `#A8FF78`
- Label sotto: "Probabilità di superare i filtri automatici" (DM Sans 400 12px, muted)

**Lista check:**
- 7 righe, una per check restituito da `ai-tailor`
- Ogni riga: icona stato + label
  - Pass: `CheckCircle` verde `#A8FF78`
  - Warning: `Warning` giallo `#FFD166`
  - Fail: `XCircle` rosso `#FF6B6B`
- Se c'è `detail`, mostrarlo sotto la label in DM Sans 400 11px muted

**Seniority Match (se `match` è false):**
- Callout giallo sotto i check:
  - Icona `Info`
  - Testo dal campo `seniority_match.note` (es. "Il ruolo richiede 8+ anni di esperienza, il candidato ne ha 5.")

**Se tutti i check sono pass e ATS score ≥ 75:**
- Badge verde "ATS-Ready ✓" visibile accanto al pulsante download

### Pannello Honest Score

Posizionato tra il pannello ATS e il template picker. Accordion collassato di default.

**Titolo:** "Verifica di onestà" (DM Sans 500 16px) con icona `ShieldCheck`

**Contenuto:**
- Copy introduttiva: *"Ogni modifica è visibile. Nulla viene inventato."* (DM Sans 400 12px, muted)
- Contatori in riga, ognuno con icona + numero:
  - `CheckCircle` verde: "0 esperienze aggiunte"
  - `CheckCircle` verde: "0 competenze inventate"
  - `CheckCircle` verde: "0 date modificate"
  - `ArrowsClockwise` muted: "[N] bullet riposizionati"
  - `PencilSimple` muted: "[N] bullet riscritti"
  - `Trash` muted: "[N] sezioni rimosse" (solo se > 0)
- **Confidence badge:**
  - Se confidence ≥ 90: chip verde "Verificato ✓" (sfondo `rgba(168,255,120,0.12)`, testo `#A8FF78`)
  - Se confidence < 90: chip giallo "Da rivedere" (sfondo `rgba(255,209,102,0.12)`, testo `#FFD166`) + lista sezioni flaggate sotto

### Template Picker

Posizionato sotto il pannello ATS.

**Titolo:** "Scegli il template" (DM Sans 500 16px)

**Griglia:** 2 colonne, 4 card.

**Ogni card:**
- Thumbnail statica del template (immagine 160×220px, sfondo chiaro, bordo `--color-border`)
- Nome template sotto (DM Sans 500 13px)
- Badge "Free" (chip grigio) o "Pro" (chip accent)
- Card selezionata: bordo `#A8FF78` 2px
- Card default selezionata: "Classico"
- Click su card → la preview PDF si aggiorna

**Template Pro con utente free:**
- Overlay semi-trasparente con icona `Lock`
- Click → tooltip: "Disponibile con il piano Pro"
- Non selezionabile

### Preview PDF

**Desktop (≥1024px):**
- Il drawer è un panel laterale (480px). A sinistra resta la diff view di step 3. Il PDF preview è nel panel, tra ATS check e template picker.
- Preview generata con `@react-pdf/renderer` — mostra la prima pagina del PDF nel template selezionato
- Dimensione preview: fit-width nel panel

**Mobile (<1024px):**
- Drawer a schermo intero
- ATS check in alto (collassabile con toggle)
- Template picker come carousel orizzontale con snap (thumbnail 120×160px)
- Preview sotto il carousel, scrollabile
- Bottom bar fissa con pulsanti download

### Pulsanti download (bottom del drawer)

- **"Scarica PDF"** (primario, accent) → genera PDF con template selezionato, trigger download
- **"Scarica DOCX"** (secondario, outline) → genera DOCX semplice (senza styling avanzato, solo struttura pulita)

---

## 3. Generazione PDF

Quando l'utente clicca "Scarica PDF" nel drawer:

1. Prendi il JSON da `tailored_cv.content`
2. Passa al componente del template selezionato
3. Genera il PDF con `@react-pdf/renderer` nel browser
4. Trigger download diretto con nome file: `CV-[Nome]-[Azienda].pdf` (es. `CV-Marco-Rossi-Acme-Corp.pdf`)
5. Upload del PDF su Supabase Storage (bucket `cv-exports`, path `{user_id}/{application_id}.pdf`)
6. Aggiorna `tailored_cvs.pdf_url` con l'URL
7. Aggiorna `tailored_cvs.template_id` e `applications.template_id` con l'ID del template scelto

### Generazione DOCX

Quando l'utente clicca "Scarica DOCX":

1. Genera un file DOCX con `docx` (npm: `docx`) usando il JSON del CV adattato
2. Struttura semplice: heading per sezioni, paragrafi per contenuto, lista puntata per bullet
3. Font: Calibri 11pt (standard per ATS)
4. Nessuno styling avanzato — il DOCX è pensato per massima compatibilità ATS
5. Nome file: `CV-[Nome]-[Azienda].docx`

> Il DOCX non segue il template visivo — è un export "ATS-safe" di backup. Solo il PDF riflette il template scelto.

---

## 4. Salvataggio candidatura (aggiornamento)

Quando l'utente clicca "Salva candidatura" nello step 3 (comportamento già definito in epic 03), salvare anche i nuovi campi:

- `applications.ats_score` ← `ats_score` dalla risposta di `ai-tailor`
- `applications.template_id` ← ID del template scelto (default `'classico'` se l'utente non ha aperto il drawer)
- `tailored_cvs.ats_score` ← `ats_score`
- `tailored_cvs.ats_checks` ← `ats_checks` (JSON array)
- `tailored_cvs.seniority_match` ← `seniority_match` (JSON object)
- `tailored_cvs.honest_score` ← `honest_score` (JSON object)
- `tailored_cvs.template_id` ← ID del template scelto

> Se l'utente salva senza aver mai aperto il drawer, i campi ATS vengono comunque salvati (provengono dalla risposta AI). Il `template_id` resta `'classico'` di default.

---

## 5. Dashboard Home

Route `/app/home` — aggiorna la pagina placeholder con contenuto reale.

### Se l'utente non ha CV (`master_cvs` vuoto)

- "Ciao [Nome]" (Syne 700 24px)
- "Inizia caricando il tuo CV per creare la tua prima candidatura." (DM Sans 400 15px muted)
- CTA: "Carica il tuo CV →" (primario, porta a `/onboarding`)

### Se l'utente ha CV ma nessuna candidatura

- "Ciao [Nome], sei pronto." (Syne 700 24px)
- "Il tuo CV è caricato. Crea la tua prima candidatura." (DM Sans 400 15px muted)
- CTA: "Nuova candidatura →" (primario, porta a `/app/nuova`)

### Se l'utente ha candidature

- "Ciao [Nome]" (Syne 700 24px)
- Sotto: "Hai [N] candidature" (DM Sans 400 15px muted)
- Pulsante "+ Nuova candidatura" (primario, in alto a destra)

### Card candidatura

Card per ogni candidatura, ordinate per data (più recenti in alto).

Ogni card (sfondo `--color-surface`, bordo `--color-border`, hover border accent):

**Contenuto principale:**
- Titolo ruolo (DM Sans 500 16px, bianco)
- Nome azienda (DM Sans 400 13px, `--color-text-secondary`)
- Data (JetBrains Mono 400 12px, muted — es. "3 giorni fa")

**Doppio score badge (a destra, affiancati):**

Badge Match Score:
- Cerchietto 40px con bordo colorato:
  - 0-40: `#FF6B6B`
  - 41-70: `#FFD166`
  - 71-100: `#A8FF78`
- Numero score in JetBrains Mono 500 14px al centro
- Label "Match" sotto in DM Sans 400 9px muted

Badge ATS Score:
- Cerchietto 40px con bordo colorato:
  - 0-50: `#FF6B6B`
  - 51-75: `#FFD166`
  - 76-100: `#A8FF78`
- Numero score in JetBrains Mono 500 14px al centro
- Label "ATS" sotto in DM Sans 400 9px muted

**Honest Score indicator (sotto i badge score):**
- Se confidence ≥ 90: piccola icona `ShieldCheck` verde accanto ai badge
- Se confidence < 90: piccola icona `ShieldWarning` gialla — tooltip: "Alcune sezioni potrebbero richiedere revisione"

**Seniority warning (se `seniority_match.match` è false):**
- Piccola icona `Warning` gialla accanto al nome del ruolo
- Tooltip on hover: testo da `seniority_match.note`

**Interazione:**
- Hover: `translateY(-2px)`, ombra espansa
- Click su card: per ora nessuna azione (placeholder — il dettaglio candidatura non è nell'MVP)

### Empty state per la lista

- Icona `FolderOpen` (Phosphor, 48px, muted)
- "Nessuna candidatura ancora" (DM Sans 400 15px muted)

---

## Criteri di accettazione

### Template System
- [ ] 4 template React con `@react-pdf/renderer` (Classico, Minimal, Executive, Moderno)
- [ ] Tutti i template ATS-safe (single-column, testo selezionabile, heading standard)
- [ ] Font custom registrati (DM Sans, Inter, Libre Baskerville, JetBrains Mono)
- [ ] Template Pro (Executive, Moderno) bloccati per utenti free

### Drawer Export
- [ ] Drawer si apre al click su "Scarica PDF" nello step 3 del wizard
- [ ] Desktop: panel laterale 480px. Mobile: drawer full-screen
- [ ] Pannello ATS check con score + 7 check colorati (verde/giallo/rosso)
- [ ] Seniority mismatch warning visibile se applicabile
- [ ] Pannello Honest Score con contatori, confidence badge, flags se < 90
- [ ] Template picker griglia 2 colonne con selezione visiva
- [ ] Preview PDF live che si aggiorna al cambio template
- [ ] Badge "ATS-Ready ✓" visibile se ATS score ≥ 75

### Export
- [ ] PDF generato nel browser con `@react-pdf/renderer` e template selezionato
- [ ] Download diretto con nome file `CV-[Nome]-[Azienda].pdf`
- [ ] PDF uploadato su Supabase Storage + URL salvato in `tailored_cvs.pdf_url`
- [ ] DOCX generato con libreria `docx`, struttura pulita, Calibri 11pt
- [ ] `template_id` salvato in `applications` e `tailored_cvs`

### Dashboard
- [ ] Dashboard mostra stato corretto (no CV / no candidature / lista candidature)
- [ ] Card candidatura con ruolo, azienda, data relativa
- [ ] Doppio badge: Match Score + ATS Score con colori corretti
- [ ] Honest Score indicator (ShieldCheck verde o ShieldWarning giallo) sulle card
- [ ] Seniority warning icon + tooltip se `seniority_match.match` è false
- [ ] CTA corretta in base allo stato utente
- [ ] Hover effect sulle card
- [ ] Empty state con icona e messaggio
