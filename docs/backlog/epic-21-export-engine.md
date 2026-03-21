# Epic 21 — Nuovo motore di export CV (CV_VISUAL + CV_ATS)

## Obiettivo

Sostituire l'attuale pipeline di export (4 template react-pdf + docx programmatico) con 2 output fissi, sempre disponibili:

- **CV_VISUAL** — PDF elegante, brand-aligned Verso, per i recruiter umani
- **CV_ATS** — DOCX ottimizzato per superare i filtri automatici (ATS)

Niente picker di template. Ogni candidatura produce sempre entrambi i file.

Il modello Free/Pro non cambia lato download (entrambi accessibili). L'UI mostra un teaser "Altri template recruiter" bloccato, che anticipa future varianti visual per utenti Pro.

---

## Perche' cambiare

| Problema attuale | Causa | Soluzione |
|---|---|---|
| Contenuto che trabocca o viene troncato ("…") | react-pdf non ha paginazione reale | Browser rendering + algoritmo fit-to-2-pages su altezza reale |
| DOCX non assomiglia al PDF | Due pipeline separate | Template DOCX progettato come output dedicato (non clone del PDF) |
| Nessun preview prima del download | react-pdf genera blob → download cieco | HTML compilato in un iframe = preview istantanea |
| 4 template da mantenere in codice | Template hardcoded in JSX | 2 file HTML template + 1 file .docx: modificabili senza toccare il codice |
| Complessita' Free/Pro per template | Gate su template specifici | Gate solo su numero candidature; template unici per tutti |

---

## I due output

### CV_VISUAL — PDF brand Verso

Pensato per un recruiter umano che lo apre, lo legge, lo stampa.

**Layout:** 2 colonne — sidebar scura + body bianco.

**Colori (print-safe, non dark mode):**
```
SIDEBAR_BG    #1C1F26  — sidebar scura
SIDEBAR_TEXT  #F2F3F7  — testo sidebar
BODY_BG       #FFFFFF  — body bianco
NOME          #111827  — nome grande
ACCENT        #6EBF47  — verde Verso muted (leggibile su bianco e su sidebar)
TESTO         #1F2937  — corpo testo
META          #6B7280  — date, note, secondari
KPI_BG        #F0FAE0  — badge KPI (sfondo verde chiaro)
KPI_BORDER    #9ED940  — badge KPI (bordo verde lime)
KPI_TEXT      #14532D  — badge KPI (testo verde scuro)
```

**Struttura:**
```
┌──────────────────────────────────────────┐
│ SIDEBAR (28%)        │ BODY (72%)         │
│ #1C1F26              │ bianco             │
│                      │                   │
│ Foto (cerchio 72px)  │ Nome (Syne 22px)  │
│ Contatti             │ Headline          │
│ ─────────────────    │ ─────────────── ← │ KPI badges (max 3, inline)
│ Competenze           │ PROFILO           │
│ Lingue               │ ESPERIENZE        │
│ Certificazioni       │ FORMAZIONE        │
│                      │ PROGETTI          │
└──────────────────────────────────────────┘
```

**KPI badges (max 3, prima del summary):**
```html
<div class="kpi-row">
  <span class="kpi-badge">10+ prodotti AI lanciati</span>
  <span class="kpi-badge">20 FTE automatizzati</span>
</div>
```
```css
.kpi-badge {
  background: #F0FAE0;
  border: 0.5px solid #9ED940;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 7.5pt;
  color: #14532D;
  font-weight: 600;
  white-space: nowrap;
}
.kpi-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  margin-bottom: 8px;
}
```

**Font:** DM Sans (400, 500, 700) via Google Fonts embed. Fallback: Helvetica.

**Titoli sezione:**
- Maiuscolo, letter-spacing 0.08em
- Linea sottile sotto (1px, `#6EBF47`)
- Padding-bottom 4px

**Bullet:**
- Marker `·` in verde accent (`#6EBF47`)
- Struttura: **Etichetta bold** + testo descrittivo su stessa riga

**Formato:** A4, margini 15mm top/bottom 12mm left/right.

**Generazione:** HTML/CSS → PDF via servizio di rendering (PDFShift o equivalente), con algoritmo fit-to-2-pages.

---

### CV_ATS — DOCX ottimizzato ATS

Pensato per passare i filtri automatici dei sistemi HR (Greenhouse, Lever, Workday, etc.).

**Formato file**
- `.docx` — non PDF, non Canva, non Pages
- Nome file senza caratteri speciali: `NomeCognome_CV_Anno.docx`

**Layout**
- Singola colonna, lettura lineare top-to-bottom
- Zero sidebar, zero tabelle, zero text box, zero colonne affiancate
- Margini standard: 1 inch (2.54cm) tutti i lati

**Contatti**
- Prima riga del corpo del documento
- Mai in header o footer Word (ignorati dal 25-100% degli ATS)
- Su riga unica con tab stop — non tabella

**Font**
- Calibri 11pt corpo, 14-16pt nome
- Alternativa accettata: Arial, Georgia, Times New Roman
- Zero font decorativi o custom

**Titoli sezione — nomi standard obbligatori**
`Profilo professionale` · `Esperienze` · `Formazione` · `Competenze` · `Certificazioni` · `Lingue`
- Zero titoli creativi ("Il mio percorso", "Chi sono", etc.)

**Caratteri**
- No em dash `—` → trattino `-`
- No en dash `–` → trattino `-`
- No virgolette tipografiche `"` `"` → virgolette dritte `"`
- No emoji, no Unicode decorativi
- KPI: triangolini `▸` inline (unico Unicode ammesso, ATS-safe)
- Bullet standard Word (`•` o `-`)

**Date**
- Formato `MM/YYYY` consistente in tutto il documento
- Mai date senza mese
- Mai formati misti (es. "Gen 2022" in un posto e "01/2022" in un altro)

**Acronimi**
- Sempre forma estesa + acronimo alla prima occorrenza
- "Robotic Process Automation (RPA)", non solo "RPA"

**Keyword**
- Target 65-75% match rate con il JD
- Sopra il 75% e' keyword stuffing — penalizzato
- Keyword in contesto naturale, non listate a freddo

**Elementi vietati**
- Tabelle (anche quelle "semplici" a 1 colonna)
- Text box (contenuto invisibile all'ATS)
- Grafici, progress bar, rating visivi delle skill
- Immagini con testo, loghi aziendali
- Icone al posto di testo (icona telefono invece di "Tel:")
- Foto (rischio parsing + bias)
- Colori nel testo (solo NERO e VERDE per i titoli sezione)

**Colori ATS-safe (testo scuro su bianco):**
```
NERO      #111827  — nome, titoli ruolo
VERDE     #166534  — titoli sezione, bullet marker, bordi
VERDE_CO  #15803D  — nome azienda
GRIGIO    #374151  — testo corpo
GRIGIO_L  #6B7280  — date, note, GDPR
```

**Struttura visiva (senza tabelle):**
- Titoli sezione: bold, verde, letter-spacing, bordo bottom sottile (`#166534`)
- Nome azienda: italic bold, bordo sinistro verde
- KPI: triangolini `▸` inline prima del summary
- Contatti: tab stop su riga unica (non tabella)
- Bullet: trattino colorato via numbering config Word

**Test finale obbligatorio (A11)**
- Copia tutto il testo in plain text (Notepad)
- Se l'ordine e' corretto e nulla manca → ATS-ready
- Se il testo e' mescolato o sezioni spariscono → correggere prima di consegnare

**Generazione:** libreria `docx` (npm) in Edge Function o client-side. Nessun template .docx esterno — generato programmaticamente per garantire la conformita' ATS a ogni output.

> Il DOCX ATS non usa `docx-templates` (che richiede un file .docx di base) ma la libreria `docx` per costruzione programmatica, che da' controllo totale su ogni elemento.

---

## Architettura

```
Frontend                          Backend (Edge Functions)
--------                          -----------------------

StepExport
  |
  |-- Preview CV_VISUAL ------->  render-cv
  |   (iframe HTML)               | compila template HTML con dati CV
  |                               | algoritmo fit-to-2-pages
  |                               | chiama PDF API → blob
  |                               | salva su Storage → URL
  |
  |-- "Scarica PDF" ----------->  render-cv (format: "pdf")
  |
  |-- "Scarica DOCX ATS" ------>  render-cv-ats
                                  | costruisce DOCX programmaticamente
                                  | applica regole A1-A11
                                  | restituisce DOCX blob
```

---

## UI — StepExport

Nessun template picker. La pagina mostra:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │  CV Recruiter           │  │  CV ATS                 │  │
│  │  ─────────────────────  │  │  ─────────────────────  │  │
│  │  [preview iframe A4]    │  │  [anteprima strutturata] │  │
│  │                         │  │                         │  │
│  │  Ottimizzato per il     │  │  Ottimizzato per i      │  │
│  │  recruiter umano        │  │  filtri automatici      │  │
│  │                         │  │                         │  │
│  │  [ ↓ Scarica PDF ]      │  │  [ ↓ Scarica DOCX ]    │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  ── Altri template recruiter ── (Prossimamente con Pro) ──  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 🔒 Executive │  │ 🔒 Berlin    │  │ 🔒 Minimal   │      │
│  │   [preview]  │  │   [preview]  │  │   [preview]  │      │
│  │  Con Pro     │  │  Con Pro     │  │  Con Pro     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ATS Score: 82   Honest Score: 97                           │
└─────────────────────────────────────────────────────────────┘
```

**Sezione teaser "Altri template recruiter":**
- 3 card bloccate con preview opacizzata e badge "Con Pro"
- Testo: "Prossimamente con Versō Pro — scegli il template piu' adatto al tuo settore"
- Click sulle card → redirect a `/upgrade` (o no-op se Pro gia' attivo, con coming soon)
- Non implementate: le card sono solo UI placeholder per anticipare la feature

**CV ATS preview:** non un iframe completo — una rappresentazione testuale stilizzata del DOCX (sezioni, bullet, font mono) che comunica la struttura senza richiedere rendering.

---

## Stories

| ID | Story | Priorita' | Effort |
|----|-------|-----------|--------|
| 21.1 | Template HTML/CSS per CV_VISUAL (brand Verso, sidebar scura, KPI badges) | Must | L |
| 21.2 | Edge Function `render-cv`: compilazione HTML + fit-to-2-pages + PDF via API | Must | L |
| 21.3 | Preview iframe in StepExport (HTML compilato, aggiornamento live) | Must | M |
| 21.4 | Edge Function `render-cv-ats`: DOCX programmatico con regole A1-A11 | Must | L |
| 21.5 | Nuovo StepExport: 2 card download + teaser Pro template | Must | M |
| 21.6 | Rimuovere react-pdf, i 4 template TSX, docx-generator.ts | Should | S |

> **Ordine di implementazione:** 21.1 → 21.2 → 21.3 → 21.4 → 21.5 → 21.6

---

## Story 21.1 — Template HTML/CSS per CV_VISUAL

**Priorita':** Must

### Cosa fare

Creare 1 file HTML/CSS per il CV_VISUAL brand Verso. Il file vive in `supabase/functions/render-cv/templates/visual.html`.

### Specifiche

**Layout base:**
```css
@page { size: A4; margin: 15mm 12mm; }
body { font-family: 'DM Sans', Helvetica, sans-serif; font-size: 10pt; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

.layout { display: grid; grid-template-columns: 180pt 1fr; min-height: 100vh; }
.sidebar { background: #1C1F26; color: #F2F3F7; padding: 20pt 14pt; }
.body    { background: #FFFFFF; padding: 20pt 16pt; }
```

**Paginazione intelligente:**
```css
.section-title { break-after: avoid; }
.experience-block { break-inside: avoid; }
.experience-block:last-child { break-inside: auto; }
p, li { orphans: 2; widows: 2; }
```

**CSS Variables per fit-to-2-pages:**
```css
:root {
  --body-size: 10pt;
  --line-height: 1.5;
  --section-margin-top: 14px;
  --exp-margin-bottom: 10px;
  --bullet-margin-bottom: 2px;
  --sidebar-font-size: 8.5pt;
}
```

**Placeholder Handlebars:**
```html
<h1 class="nome">{{name}}</h1>
<p class="headline">{{headline}}</p>

{{#if kpis}}
<div class="kpi-row">
  {{#each kpis}}<span class="kpi-badge">{{this}}</span>{{/each}}
</div>
{{/if}}

<p class="summary">{{summary}}</p>

{{#each experience}}
<div class="experience-block">
  <div class="exp-header">
    <strong class="exp-role">{{this.role}}</strong>
    <span class="exp-meta">{{this.start}} - {{this.end}}</span>
  </div>
  <div class="exp-company">{{this.company}}{{#if this.location}} · {{this.location}}{{/if}}</div>
  {{#if this.description}}<p class="exp-desc">{{this.description}}</p>{{/if}}
  <ul class="bullets">
    {{#each this.bullets}}<li>{{this}}</li>{{/each}}
  </ul>
</div>
{{/each}}
```

**Gestione foto:** cerchio 72px nella sidebar. Se assente: iniziale del nome su sfondo accent.

### Criteri di accettazione

- [ ] File `visual.html` completo con sidebar + body
- [ ] CSS `@page` A4, margini corretti
- [ ] CSS variables per tutte le dimensioni modificabili dal fit-algorithm
- [ ] `break-inside: avoid` su experience-block
- [ ] KPI badges inline (non a capo)
- [ ] Foto circolare con fallback iniziale
- [ ] Testato: apri l'HTML in browser → layout corretto, nessun overflow visibile
- [ ] Font DM Sans caricato via Google Fonts link

---

## Story 21.2 — Edge Function `render-cv`

**Priorita':** Must

### Cosa fare

Edge Function che riceve CV JSON, compila il template HTML, applica fit-to-2-pages, renderizza il PDF.

### Endpoint

```
POST /functions/v1/render-cv
Authorization: Bearer <token>
{ "cv": {...}, "format": "pdf"|"html", "lang": "it"|"en" }
```

### Algoritmo fit-to-2-pages

Il motore non ha un browser per misurare l'altezza. Stima con:
- Larghezza colonna main nota (A4 - margini - sidebar = ~(186-180*0.28)mm ≈ 133mm)
- Font size nota → caratteri per riga
- Line height nota → altezza riga in mm

```typescript
interface FitConfig {
  bodySize: number;      // pt: 10 → 8.5 → 8 (step 0.5)
  lineHeight: number;    // 1.5 → 1.3 (step 0.05)
  sectionMargin: number; // px: 14 → 8 (step 2)
  expMargin: number;     // px: 10 → 6 (step 2)
  maxBullets: number;    // illimitato → 4 → 3
}

// Ciclo: stima altezza → se > 2 pagine → riduci config → riesegui
// Ordine di riduzione: 1) font-size, 2) margini, 3) bullet limit
```

### Rendering PDF

Raccomandazione: **PDFShift** (free tier 250 PDF/mese, sufficiente per MVP).

```typescript
async function renderPdf(html: string): Promise<Uint8Array> {
  const res = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa("api:" + Deno.env.get("PDFSHIFT_API_KEY")),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source: html, format: "A4", use_print: true }),
  });
  if (!res.ok) throw new Error("PDF rendering failed");
  return new Uint8Array(await res.arrayBuffer());
}
```

**Alternativa self-hosted:** Gotenberg (Docker + Chrome headless), zero costi ricorrenti.

### Criteri di accettazione

- [ ] Endpoint accetta CV JSON + format + lang
- [ ] Compila template HTML con i dati del CV
- [ ] Algoritmo fit-to-2-pages inietta CSS override nell'HTML
- [ ] `format=html` → restituisce HTML (per preview)
- [ ] `format=pdf` → restituisce PDF via servizio rendering
- [ ] PDF risultante e' max 2 pagine A4
- [ ] Autenticazione Bearer token richiesta
- [ ] CORS via `getCorsHeaders`

---

## Story 21.3 — Preview iframe in StepExport

**Priorita':** Must

### Cosa fare

Il CV_VISUAL deve essere visibile in anteprima prima del download. La preview usa il CV **gia' revisionato da `cv-formal-review`** — non il CV grezzo. La formal review e' un prerequisito bloccante: la preview non parte finche' la review non e' completata.

### Sequenza obbligatoria

```
mount StepExport
    │
    ▼
chiama cv-formal-review(cv_tailored)
    │  [stato: "Revisione in corso..."]
    │  download bloccato
    │
    ▼ completata (o fallita con fallback al CV originale)
    │
    ▼
chiama render-cv(cv_reviewed, format: "html")
    │  [stato: "Generazione preview..."]
    │  download ancora bloccato
    │
    ▼ preview pronta
    │
    ▼
abilita pulsanti download
[stato: "N correzioni applicate" oppure "Pronto"]
```

**Il CV passato a `render-cv` e `render-cv-ats` e' sempre `cv_reviewed`**, mai `cv_tailored` grezzo. Se `cv-formal-review` fallisce, si usa `cv_tailored` come fallback — ma il fallback non viene mai saltato silenziosamente: l'utente vede "Revisione non disponibile, usando CV originale".

### Implementazione

```tsx
function StepExport({ cvTailored, lang }: Props) {
  const [reviewedCv, setReviewedCv] = useState<CV | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"reviewing" | "rendering" | "ready" | "error">("reviewing");
  const [reviewCorrections, setReviewCorrections] = useState<number>(0);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      // Step 1 — formal review (bloccante)
      setReviewStatus("reviewing");
      let cv = cvTailored;
      try {
        const { data } = await supabase.functions.invoke("cv-formal-review", {
          body: { cv: cvTailored }
        });
        cv = data.reviewed_cv ?? cvTailored;
        setReviewCorrections(data.fixes?.length ?? 0);
      } catch {
        // fallback silenzioso al CV grezzo, ma avviso all'utente
        setReviewStatus("error"); // mostrera' banner "Revisione non disponibile"
      }
      setReviewedCv(cv);

      // Step 2 — genera preview (bloccante)
      setReviewStatus("rendering");
      try {
        const { data } = await supabase.functions.invoke("render-cv", {
          body: { cv, format: "html", lang }
        });
        setPreviewHtml(data);
      } catch {
        setPreviewHtml(null);
      }

      setReviewStatus("ready");
    }
    run();
  }, []);

  const isReady = reviewStatus === "ready";

  return (
    <>
      <ReviewStatusBanner status={reviewStatus} corrections={reviewCorrections} />
      <CVVisualPreview html={previewHtml} loading={!isReady} />
      <DownloadButtons cv={reviewedCv} disabled={!isReady} lang={lang} />
      <ATSPreview cv={reviewedCv} />
    </>
  );
}
```

### Stati del banner di revisione

| Stato | Messaggio | UI |
|-------|-----------|-----|
| `reviewing` | "Revisione in corso…" | spinner, download disabilitati |
| `rendering` | "Generazione anteprima…" | spinner, download disabilitati |
| `ready` (0 fix) | "Nessuna correzione necessaria" | check verde |
| `ready` (N fix) | "N correzioni applicate" | check verde, dettaglio espandibile |
| `error` | "Revisione non disponibile — usando il CV come prodotto" | warning giallo |

### Criteri di accettazione

- [ ] `cv-formal-review` viene chiamata per prima, prima di qualsiasi rendering
- [ ] Preview generata con il CV revisionato, non con il CV grezzo
- [ ] Download disabilitati finche' review + rendering non sono completati
- [ ] Se formal review fallisce: fallback al CV grezzo con banner warning
- [ ] Banner mostra stato corrente (reviewing → rendering → ready)
- [ ] Proporzioni A4 corrette (1:1.414)
- [ ] Preview scrollabile se il CV e' 2 pagine
- [ ] Nessun download automatico

---

## Story 21.4 — Edge Function `render-cv-ats`

**Priorita':** Must

### Cosa fare

Edge Function che costruisce programmaticamente il DOCX ATS partendo dal CV JSON, applicando tutte le regole A1-A11.

### Endpoint

```
POST /functions/v1/render-cv-ats
Authorization: Bearer <token>
{ "cv": {...}, "lang": "it"|"en" }
```

### Costruzione DOCX (libreria `docx`)

La funzione costruisce il documento elemento per elemento, garantendo conformita' ATS.

**Struttura documento:**

1. **Nome** — 52pt, tracking negativo, #111827
2. **Headline** — 12pt, #374151, bordo bottom sottile grigio
3. **Contatti** — riga unica con tab stop (non tabella)
4. **KPI** — triangolini `▸` inline, nessun badge grafico
5. **Sezioni** — titoli con bordo bottom verde #166534, letter-spacing
6. **Esperienze** — nome azienda con bordo sinistro verde, bullet con trattino colorato
7. **Footer GDPR** — testo muto, centrato

**Regole applicate durante la costruzione:**
- Nessuna tabella, text box, header/footer Word
- Font Calibri ovunque
- Caratteri: solo ASCII + `▸` (U+25B8, ATS-safe)
- Date: formato MM/YYYY
- Nessun em dash o en dash
- Acronimi: prima occorrenza con forma estesa + acronimo

**Keyword check (A10):**
Prima di restituire il DOCX, calcola il match rate delle keyword rilevanti vs il JD (se disponibile). Se > 75%: rimuovi keyword in eccesso dai bullet meno rilevanti, non dal summary.

### Criteri di accettazione

- [ ] DOCX generato senza tabelle, text box, immagini
- [ ] Contatti nel corpo (non header/footer Word)
- [ ] Titoli sezione standard (A4)
- [ ] Font Calibri 11pt corpo, 14pt nome
- [ ] Nessun em dash o en dash
- [ ] Date formato MM/YYYY consistenti
- [ ] Test parsing: copia il testo del DOCX → ordine e contenuto corretti
- [ ] Nessun colore nel testo oltre a NERO e VERDE
- [ ] Autenticazione Bearer token richiesta

---

## Story 21.5 — Nuovo StepExport

**Priorita':** Must

### Cosa fare

Sostituire lo step export attuale (template picker + download) con il nuovo layout a 2 card + teaser.

### Layout completo

**Sezione principale — 2 card affiancate:**

```
CV Recruiter (PDF)              CV ATS (DOCX)
─────────────────               ──────────────────
[iframe preview]                [struttura testuale]
                                CALIBRI · SINGOLA COLONNA
                                ATS-READY
Ottimizzato per il              Ottimizzato per i filtri
recruiter umano                 automatici (ATS)

[ ↓ Scarica PDF ]               [ ↓ Scarica DOCX ]
```

**Sezione teaser — altri template recruiter (Pro):**

```
── Altri template recruiter ─────────────────── Prossimamente con Versō Pro ──

[🔒 Executive]    [🔒 Berlin]    [🔒 Minimal Pro]
  opacizzato        opacizzato       opacizzato
  Con Pro           Con Pro          Con Pro

"Presto potrai scegliere il template piu' adatto al tuo settore."
```

**Comportamento teaser:**
- Card bloccate, non cliccabili (o click → toast "Prossimamente")
- Se utente e' gia' Pro → stesso messaggio "Prossimamente"
- Non mostrano preview reali — placeholder stilizzati

**Score bar in fondo:**
- ATS Score + Honest Score come badge compatti

### Modifiche tecniche

1. Rimuovere `selectedTemplate` state — non c'e' piu' scelta
2. La sequenza al mount e' **bloccante**: `cv-formal-review` → `render-cv(html)` → abilita download
3. Download PDF → chiama `render-cv(pdf)` con `cv_reviewed`
4. Download DOCX → chiama `render-cv-ats` con `cv_reviewed`
5. Upload su Storage: `cv-exports/{userId}/{applicationId}/cv-visual.pdf` e `cv-ats.docx`
6. Salvataggio in `tailored_cvs`: `template_id = "visual"` per PDF, aggiungere campo `ats_docx_url`

> **Invariante:** `cv_reviewed` (output di `cv-formal-review`) e' l'unico CV usato per tutti gli output. Non esiste un percorso in cui si scarica il CV grezzo senza aver prima tentato la review.

### Criteri di accettazione

- [ ] 2 card affiancate (una per output)
- [ ] Download disabilitati finche' la sequenza review → preview non e' completata
- [ ] Preview iframe CV_VISUAL generata con il CV revisionato
- [ ] Preview testuale CV_ATS (no iframe — struttura stilizzata) con il CV revisionato
- [ ] Pulsante Scarica PDF usa `cv_reviewed`
- [ ] Pulsante Scarica DOCX usa `cv_reviewed`
- [ ] Banner di stato visibile durante review e rendering
- [ ] Sezione teaser visibile con 3 card bloccate
- [ ] Nessun template picker
- [ ] Upload su Storage per entrambi i file
- [ ] Mobile: card impilate verticalmente

---

## Story 21.6 — Rimuovere il vecchio motore

**Priorita':** Should (dopo che il nuovo motore e' stabile)

### Cosa fare

1. Rimuovere da `package.json`: `@react-pdf/renderer`, `docx` (se non usato altrove)
2. Eliminare: `ClassicoTemplate.tsx`, `MinimalTemplate.tsx`, `ExecutiveTemplate.tsx`, `ModernoTemplate.tsx`, `docx-generator.ts`, `template-utils.ts`
3. Verificare che nessun altro file importi i componenti rimossi
4. Verificare che l'app compili senza errori

### Criteri di accettazione

- [ ] `@react-pdf/renderer` rimosso
- [ ] 4 template TSX eliminati
- [ ] `docx-generator.ts` e `template-utils.ts` eliminati
- [ ] App compila senza errori
- [ ] Bundle size ridotto (react-pdf e' ~800KB)

---

## Criteri di accettazione globali

- [ ] Ogni candidatura produce sempre 2 output: CV_VISUAL (PDF) + CV_ATS (DOCX)
- [ ] Nessun template picker — design fisso
- [ ] CV_VISUAL: layout sidebar scura + body bianco, brand Verso, max 2 pagine
- [ ] CV_ATS: DOCX singola colonna, supera test parsing plain text, regole A1-A11 rispettate
- [ ] Sezione teaser "Altri template Pro" visibile ma non funzionale
- [ ] Entrambi i file disponibili per utenti Free e Pro (gate solo su numero candidature)
- [ ] Preview PDF visibile prima del download
- [ ] Upload su Storage per entrambi dopo il download
- [ ] Nessuna regressione su formal review, honest score, ATS score

---

## Note implementative

### Scelta servizio PDF rendering

| Servizio | Quando |
|----------|--------|
| **PDFShift** | Raccomandato. Free tier 250 PDF/mese. API semplice. Sufficiente per MVP. |
| **Gotenberg** | Se serve self-hosted (zero costi ricorrenti). Docker + Chrome headless. |
| **Client-side html2canvas** | Fallback temporaneo. Qualita' inferiore (rasterizzato). |

### Compatibilita' Deno per `docx`

La libreria `docx` (npm) funziona con `npm:docx` in Deno. Alternativa client-side: costruire il DOCX nel browser (la libreria supporta browser environment). In questo caso `render-cv-ats` diventa una funzione JS lato client invece di un'edge function.

### Migrazione graduale

Possibile implementare in parallelo al vecchio motore:
1. Nuovo StepExport con feature flag `use_new_export_engine`
2. Test con utenti reali
3. Quando stabile: rimuovere il vecchio motore (story 21.6)
