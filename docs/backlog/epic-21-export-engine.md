# Epic 21 — Nuovo motore di export CV (HTML/CSS → PDF + template DOCX)

## Obiettivo

Sostituire l'attuale pipeline di export (react-pdf + docx programmatico) con un sistema basato su:
- **PDF:** template HTML/CSS renderizzati server-side con un algoritmo fit-to-2-pages
- **DOCX:** template .docx reali (progettati in Word) riempiti con i dati del CV
- **Preview:** lo stesso HTML renderizzato in un iframe per anteprima istantanea

Il CV finale deve essere perfettamente impaginato su max 2 pagine A4, con spaziature corrette, a-capo sensati, nessun contenuto troncato, e aspetto professionale.

---

## Perche' cambiare

| Problema attuale | Causa | Soluzione |
|---|---|---|
| Contenuto che trabocca o viene troncato ("…") | react-pdf non ha paginazione reale; density system stima con CPL=42 | Browser rendering + loop fit-to-2-pages basato su altezza reale |
| CV sempre su 1 pagina (taglia contenuto per stare) | Single `<Page>` component, no multi-page | CSS `@page` produce N pagine naturalmente, l'algoritmo limita a 2 |
| DOCX non assomiglia al PDF (no sidebar, no foto) | Due pipeline completamente separate | Un template HTML → PDF; un template .docx progettato identico |
| Nessun preview prima del download | react-pdf genera blob → download cieco | Stesso HTML in un iframe = preview istantanea |
| Aggiungere un template = 200+ righe di JSX + 100 righe di docx builder | Template hardcoded in codice | Template HTML/CSS o .docx files: un designer puo' crearli senza toccare codice |
| No hyphenation, no widow/orphan control | react-pdf li disabilita | CSS `hyphens: auto`, `orphans: 2`, `widows: 2` |
| Font da CDN (latenza, fallback) | `Font.register()` da jsdelivr | Font embedded nel template HTML o nel servizio di rendering |

---

## Architettura

```
Frontend                          Backend (Edge Function)
--------                          ----------------------

StepExport                        render-cv
  |                                 |
  |-- Preview (iframe HTML) <------ | compila template HTML
  |                                 |     con dati CV
  |-- "Scarica PDF" ------------->  | adatta CSS (fit-to-2-pages)
  |                                 | chiama API rendering → PDF blob
  |                                 | salva su Storage → ritorna URL
  |
  |-- "Scarica DOCX" ----------->  render-cv-docx
                                    | carica template .docx da Storage
                                    | riempie placeholder con dati CV
                                    | ritorna DOCX blob
```

---

## Stories

| ID | Story | Priorita' | Effort |
|----|-------|-----------|--------|
| 21.1 | Creare i 4 template HTML/CSS con layout A4 e CSS Paged Media | Must | L |
| 21.2 | Edge Function `render-cv`: compilazione template + fit-to-2-pages + PDF API | Must | L |
| 21.3 | Preview istantanea nel frontend (iframe con HTML compilato) | Must | M |
| 21.4 | Creare i 4 template .docx reali e riempirli con `docx-templates` | Must | M |
| 21.5 | Integrare il nuovo motore in StepExport + ExportDrawer | Must | M |
| 21.6 | Rimuovere react-pdf, docx-generator.ts e i 4 template TSX | Should | S |

> **Ordine di implementazione:** 21.1 → 21.2 → 21.3 → 21.5 → 21.4 → 21.6

---

## Story 21.1 — Template HTML/CSS con layout A4 e CSS Paged Media

**Priorita':** Must

### Cosa fare

Creare 4 template HTML/CSS corrispondenti ai 4 template attuali (Classico, Minimal, Executive, Moderno). Ogni template e' un file HTML completo con `<style>` inline e placeholder Handlebars-style.

I template vanno salvati come file in `supabase/functions/render-cv/templates/` (o in Storage).

### Specifiche per ogni template

**Tutti i template condividono:**
```css
@page {
  size: A4;
  margin: 15mm 12mm 15mm 12mm;
}

body {
  font-size: var(--body-size, 10pt);
  line-height: var(--line-height, 1.5);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Paginazione intelligente */
.section-title {
  break-after: avoid;      /* non lasciare un titolo da solo in fondo pagina */
}
.experience-block {
  break-inside: avoid;     /* non spezzare un'esperienza a meta' */
}
.experience-block:last-child {
  break-inside: auto;      /* l'ultima esperienza puo' andare a capo */
}
p, li {
  orphans: 2;              /* minimo 2 righe prima del page break */
  widows: 2;               /* minimo 2 righe dopo il page break */
}
```

**Template "Classico":**
- Layout: CSS Grid 2 colonne (28% sidebar scura + 72% main)
- Sidebar: background `#1C1F26`, testo `#F2F3F7`, accent `#60A5FA`
- Font: Inter (400, 500, 700) via Google Fonts embed
- Foto: cerchio 72px nella sidebar
- Sidebar contiene: foto, contatti, competenze, lingue, certificazioni
- Main contiene: nome, headline, profilo, esperienza, formazione, progetti

**Template "Minimal":**
- Layout: CSS Grid 2 colonne (26% sidebar chiara + 74% main)
- Colori chiari, minimal, accent sottile
- Font: Inter
- Sidebar piu' stretta, separatori sottili

**Template "Executive":**
- Layout: singola colonna centrata, no sidebar
- Accent: `#2563EB`, linee orizzontali sotto i titoli sezione
- Nome centrato grande, contatti in riga sotto il nome
- Font: DM Sans (400, 500, 700)

**Template "Moderno":**
- Layout: CSS Grid 2 colonne (35% sidebar scura + 65% main)
- Sidebar: `#1E293B`, accent `#38BDF8`
- Sidebar piu' ampia del Classico
- Font: Inter

### Placeholder syntax

Usare la sintassi Handlebars-compatibile:
```html
<h1>{{name}}</h1>
<p>{{summary}}</p>
{{#each experience}}
<div class="experience-block">
  <strong>{{this.role}}</strong> — {{this.company}}
  <span class="meta">{{this.start}} – {{this.end}}</span>
  <ul>
    {{#each this.bullets}}<li>{{this}}</li>{{/each}}
  </ul>
</div>
{{/each}}
```

### CSS Variables per il fit-to-2-pages

I template devono usare CSS custom properties per tutti i valori che l'algoritmo di fitting puo' modificare:

```css
:root {
  --body-size: 10pt;
  --line-height: 1.5;
  --section-margin-top: 16px;
  --exp-margin-bottom: 12px;
  --bullet-margin-bottom: 2px;
  --sidebar-font-size: 8.5pt;
}
```

L'Edge Function inietta un `<style>` override con i valori calcolati dall'algoritmo.

### Criteri di accettazione

- [ ] 4 file template HTML completi (classico, minimal, executive, moderno)
- [ ] CSS `@page` con size A4 e margini corretti
- [ ] `break-inside: avoid` su experience-block
- [ ] `break-after: avoid` su section-title
- [ ] `orphans: 2; widows: 2` su paragrafi
- [ ] CSS variables per font-size, line-height, margins
- [ ] Layout 2 colonne funzionante (CSS Grid) per classico, minimal, moderno
- [ ] Layout 1 colonna centrato per executive
- [ ] Foto circolare nella sidebar (con fallback iniziale se assente)
- [ ] Placeholder Handlebars per tutti i campi CV
- [ ] Font embedded (Google Fonts link o @font-face)
- [ ] Colori esatti dei template attuali
- [ ] Testato manualmente: aprire l'HTML in un browser → aspetto corretto su A4

---

## Story 21.2 — Edge Function render-cv

**Priorita':** Must

### Cosa fare

Creare una nuova Edge Function `render-cv` che:
1. Riceve CV JSON + template ID + formato (pdf/html)
2. Compila il template HTML con i dati
3. Esegue l'algoritmo fit-to-2-pages
4. Renderizza il PDF tramite un servizio esterno
5. Restituisce il PDF blob (o l'HTML per la preview)

### Endpoint

```
POST /functions/v1/render-cv
Authorization: Bearer <token>
Content-Type: application/json

{
  "cv": { ... },              // CV JSON (parsed_data format)
  "template_id": "classico",  // classico | minimal | executive | moderno
  "format": "pdf",            // "pdf" | "html"
  "lang": "it"                // target language
}
```

**Response (format=pdf):**
```
Content-Type: application/pdf
Body: PDF binary
```

**Response (format=html):**
```
Content-Type: text/html
Body: HTML compilato (per preview iframe)
```

### Compilazione template

Usare una funzione di template semplice (non serve Handlebars full — un mini-engine basta):

```typescript
function compileTemplate(html: string, data: Record<string, any>): string {
  // Sostituire {{variabile}} con valori
  // Gestire {{#each array}}...{{/each}} per loop
  // Gestire {{#if condizione}}...{{/if}} per condizionali
  // Gestire {{this.campo}} dentro i loop
}
```

In alternativa, usare una libreria lightweight come `eta` o `mustache` disponibile per Deno.

### Preparazione dati per il template

Prima di compilare, preparare i dati:

```typescript
function prepareTemplateData(cv: Record<string, any>, lang: string) {
  const personal = cv.personal || {};
  return {
    name: clean(personal.name) || "Nome Cognome",
    email: clean(personal.email),
    phone: clean(personal.phone),
    location: clean(personal.location),
    linkedin: clean(personal.linkedin),
    website: clean(personal.website),
    photoUrl: clean(cv.photo_url) || clean(cv.photo_base64) || clean(personal.photo_url),
    summary: clean(cv.summary),
    experience: (cv.experience || []).map(exp => ({
      role: clean(exp.role) || clean(exp.title),
      company: exp.company,
      start: exp.start,
      end: exp.end || (exp.current ? (lang === "it" ? "Attuale" : "Present") : ""),
      location: clean(exp.location),
      description: clean(exp.description),
      bullets: (exp.bullets || []).filter(b => clean(b)),
    })),
    education: (cv.education || []).map(ed => ({
      degree: ed.degree,
      field: clean(ed.field),
      institution: ed.institution,
      period: [ed.start, ed.end].filter(Boolean).join(" – "),
      grade: clean(ed.grade),
    })),
    skills: mergeAndDeduplicateSkills(cv.skills),
    languages: cv.skills?.languages || [],
    certifications: (cv.certifications || []).filter(c => clean(c.name)),
    projects: (cv.projects || []).filter(p => clean(p.name)),
    extraSections: (cv.extra_sections || []).filter(s => s.title && s.items?.length),
    // Localizzazione
    headers: getHeaders(lang),
  };
}
```

### Algoritmo fit-to-2-pages

L'algoritmo deve garantire che il PDF sia max 2 pagine A4 (594mm di altezza totale contenuto).

**Approccio:** l'Edge Function non ha un browser per misurare l'altezza. Percio' l'algoritmo lavora con una **stima migliorata** basata su:
- Larghezza colonna nota (dimensioni A4 - margini - eventuale sidebar)
- Font size nota → caratteri per riga calcolabili con precision
- Line height nota → altezza per riga calcolabile
- Ogni sezione ha un overhead fisso (titolo + margini)

```typescript
interface FitConfig {
  bodySize: number;      // pt (10 → 8, step 0.5)
  lineHeight: number;    // 1.5 → 1.3, step 0.05
  sectionMargin: number; // px (16 → 8, step 2)
  expMargin: number;     // px (12 → 6, step 2)
  maxBullets: number;    // 99 → 4 → 3
}

function fitTo2Pages(data: TemplateData, templateId: string): FitConfig {
  const pageHeight = 297 - 30; // A4 height - margins (mm)
  const maxHeight = pageHeight * 2; // 2 pages

  let config: FitConfig = {
    bodySize: 10,
    lineHeight: 1.5,
    sectionMargin: 16,
    expMargin: 12,
    maxBullets: 99,
  };

  // Stima altezza con la config attuale
  while (estimateHeight(data, config, templateId) > maxHeight) {
    // Step 1: riduci font-size (10 → 8, minimo)
    if (config.bodySize > 8) {
      config.bodySize -= 0.5;
      config.lineHeight = Math.max(1.3, config.lineHeight - 0.03);
      continue;
    }
    // Step 2: riduci margini
    if (config.sectionMargin > 8) {
      config.sectionMargin -= 2;
      config.expMargin = Math.max(6, config.expMargin - 2);
      continue;
    }
    // Step 3: limita bullet (prima 4, poi 3)
    if (config.maxBullets > 3) {
      config.maxBullets = config.maxBullets > 4 ? 4 : 3;
      continue;
    }
    // Non si puo' fare di piu' — accetta overflow
    break;
  }

  return config;
}

function estimateHeight(data: TemplateData, config: FitConfig, templateId: string): number {
  // Calcola larghezza colonna main in mm
  const pageWidth = 210 - 24; // A4 - margini laterali
  const mainWidth = templateId === "executive"
    ? pageWidth
    : pageWidth * 0.72; // 72% per layout 2 colonne

  // Caratteri per riga (approssimazione: 1pt ≈ 0.35mm larghezza media)
  const charWidth = config.bodySize * 0.22; // mm per carattere medio
  const charsPerLine = Math.floor(mainWidth / charWidth);

  const lineH = config.bodySize * config.lineHeight * 0.35; // altezza riga in mm

  let height = 0;

  // Nome + subtitle
  height += 12;

  // Summary
  if (data.summary) {
    height += config.sectionMargin * 0.35; // section margin
    height += 6; // section title
    height += Math.ceil(data.summary.length / charsPerLine) * lineH;
  }

  // Experience
  if (data.experience.length > 0) {
    height += config.sectionMargin * 0.35;
    height += 6;
    for (const exp of data.experience) {
      height += 3 * lineH; // role + company + meta
      if (exp.description) {
        height += Math.ceil(exp.description.length / charsPerLine) * lineH;
      }
      const bullets = exp.bullets.slice(0, config.maxBullets);
      for (const b of bullets) {
        height += Math.ceil(b.length / charsPerLine) * lineH;
      }
      height += config.expMargin * 0.35;
    }
  }

  // Education, certifications, projects (stime simili)
  height += data.education.length * 3 * lineH;
  height += data.certifications.length * 2 * lineH;
  for (const proj of data.projects) {
    height += 2 * lineH;
    if (proj.description) height += Math.ceil(proj.description.length / charsPerLine) * lineH;
  }

  return height;
}
```

L'algoritmo inietta i valori calcolati come CSS variables nell'HTML prima del rendering:

```typescript
const fitConfig = fitTo2Pages(templateData, templateId);

const cssOverride = `<style>
:root {
  --body-size: ${fitConfig.bodySize}pt;
  --line-height: ${fitConfig.lineHeight};
  --section-margin-top: ${fitConfig.sectionMargin}px;
  --exp-margin-bottom: ${fitConfig.expMargin}px;
}
</style>`;

compiledHtml = compiledHtml.replace("</head>", cssOverride + "</head>");
```

Se `maxBullets` e' stato ridotto, i bullet vengono tagliati nei dati PRIMA della compilazione.

### Rendering PDF

Chiamare un servizio di rendering. Raccomandazione: **PDFShift** (semplice, economico, ottima qualita').

```typescript
async function renderPdf(html: string): Promise<Uint8Array> {
  const response = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa("api:" + Deno.env.get("PDFSHIFT_API_KEY")),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: html,
      format: "A4",
      margin: "0", // margini gia' nel CSS @page
      sandbox: false,
      use_print: true, // usa @media print CSS
    }),
  });

  if (!response.ok) throw new Error("PDF rendering failed: " + response.status);
  return new Uint8Array(await response.arrayBuffer());
}
```

**Alternativa gratuita:** se il budget e' zero, usare `jsPDF` + `html2canvas` client-side come fallback temporaneo. Ma la qualita' e' inferiore (rasterizzato).

**Alternativa self-hosted:** Gotenberg (Docker container con Chrome headless). Piu' complesso ma zero costi ricorrenti.

### Criteri di accettazione

- [ ] Edge Function `render-cv` creata e deployata
- [ ] Accetta CV JSON + template_id + format (pdf/html) + lang
- [ ] Compila template HTML con dati CV
- [ ] Algoritmo fit-to-2-pages produce CSS overrides
- [ ] format=html restituisce HTML compilato
- [ ] format=pdf restituisce PDF via servizio di rendering
- [ ] PDF risultante e' max 2 pagine A4
- [ ] Autenticazione Bearer token richiesta
- [ ] CORS configurato correttamente (getCorsHeaders)
- [ ] Logging costi rendering (opzionale)

---

## Story 21.3 — Preview istantanea nel frontend

**Priorita':** Must

### Cosa fare

Aggiungere un preview panel in StepExport che mostra il CV renderizzato in tempo reale PRIMA del download.

### Behavior

1. Quando l'utente arriva a StepExport, viene chiamata l'Edge Function `render-cv` con `format: "html"`
2. L'HTML compilato viene renderizzato in un `<iframe>` con dimensioni A4 scalate
3. L'utente vede esattamente cosa verra' scaricato
4. Cambiando template, il preview si aggiorna (con loading state)
5. Il pulsante "Scarica PDF" usa lo stesso template per generare il PDF

### Layout

```
┌─────────────────────────────────────────────────┐
│  Template: [Classico] [Minimal] [Executive] [M] │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │                                           │  │
│  │          CV PREVIEW (iframe A4)           │  │
│  │          scala ~60% per desktop           │  │
│  │          scrollabile se 2 pagine          │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  [ Scarica PDF ]  [ Scarica DOCX (Pro) ]        │
└─────────────────────────────────────────────────┘
```

**Mobile:** preview a larghezza piena, scala ~40%, scrollabile verticalmente.

### Implementazione

```tsx
function CVPreview({ cv, templateId, lang }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/functions/v1/render-cv", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cv, template_id: templateId, format: "html", lang }),
    })
      .then(res => res.text())
      .then(html => { setHtml(html); setLoading(false); })
      .catch(() => setLoading(false));
  }, [cv, templateId, lang]);

  if (loading) return <Skeleton className="w-full aspect-[1/1.414]" />;

  return (
    <iframe
      srcDoc={html}
      className="w-full aspect-[1/1.414] border rounded-lg shadow-lg bg-white"
      style={{ transform: "scale(0.6)", transformOrigin: "top left" }}
      sandbox="allow-same-origin"
    />
  );
}
```

### Criteri di accettazione

- [ ] Preview visibile in StepExport prima del download
- [ ] Preview si aggiorna al cambio template (con loading skeleton)
- [ ] Preview mantiene proporzioni A4 (1:1.414)
- [ ] Preview scrollabile se il CV e' 2 pagine
- [ ] Preview funziona su mobile (scala ridotta)
- [ ] Nessun download automatico — l'utente decide quando scaricare

---

## Story 21.4 — Template DOCX reali con docx-templates

**Priorita':** Must

### Cosa fare

Sostituire il docx-generator.ts programmatico con template .docx reali riempiti dalla libreria `docx-templates`.

### Approccio

1. **Creare 4 file .docx** professionali in Word/Google Docs, uno per ogni template
2. **Caricare i template** in Supabase Storage (bucket `cv-templates`)
3. **Creare Edge Function `render-cv-docx`** (o estendere `render-cv`) che:
   - Scarica il template .docx da Storage
   - Riempie i placeholder con i dati CV usando `docx-templates`
   - Restituisce il DOCX blob

### Placeholder syntax (docx-templates)

Nei file .docx, usare la sintassi di `docx-templates`:

```
{name}
{summary}
{#experience}
{role} — {company}
{start} – {end} · {location}
{#bullets}
• {.}
{/bullets}
{/experience}
```

### Template .docx design

Ogni template deve essere progettato in Word con:
- **Stili Word nativi** (Heading 1, Heading 2, Normal, List Bullet) — Word gestisce la paginazione
- **Colori e font** corrispondenti al template PDF
- **Margini identici** al PDF (15mm top/bottom, 12mm left/right)
- **Layout a 2 colonne** (per Classico, Minimal, Moderno) usando la funzionalita' "Colonne" di Word

> **Nota:** il layout a 2 colonne in Word e' piu' limitato del CSS Grid. Se troppo complesso, usare un layout a 1 colonna con le skill in riga orizzontale (pills separate da " · ") invece della sidebar verticale.

### Edge Function

```typescript
import createReport from "docx-templates";

async function generateDocxFromTemplate(
  cv: Record<string, any>,
  templateId: string,
  lang: string
): Promise<Uint8Array> {
  // 1. Scarica template da Storage
  const templateBuffer = await downloadTemplate(templateId);

  // 2. Prepara dati (stessa funzione di render-cv)
  const data = prepareTemplateData(cv, lang);

  // 3. Riempi template
  const result = await createReport({
    template: templateBuffer,
    data,
    cmdDelimiter: ["{", "}"],
  });

  return result;
}
```

### Dipendenze

Aggiungere `docx-templates` alle dipendenze dell'Edge Function. Verificare compatibilita' con Deno. Se non compatibile, valutare alternative:
- `easy-template-x` (piu' leggero, compatibile Deno)
- Compilazione client-side (la libreria funziona nel browser)

Se la compilazione DOCX non e' praticabile server-side, spostarla client-side:
```typescript
import { createReport } from "docx-templates";

async function downloadAndFillDocx(cv, templateId, lang) {
  const templateUrl = supabase.storage.from("cv-templates").getPublicUrl(`${templateId}.docx`);
  const templateBuffer = await fetch(templateUrl).then(r => r.arrayBuffer());
  const data = prepareTemplateData(cv, lang);
  const result = await createReport({ template: templateBuffer, data });
  saveAs(new Blob([result]), `cv-${templateId}.docx`);
}
```

### Criteri di accettazione

- [ ] 4 file .docx template caricati in Supabase Storage
- [ ] Ogni template ha placeholder per tutti i campi CV
- [ ] docx-templates (o alternativa) riempie i placeholder correttamente
- [ ] Il DOCX risultante ha formattazione professionale
- [ ] Il DOCX risultante e' max 2 pagine (gestito da Word, ma i template devono essere progettati per questo)
- [ ] Font, colori, margini coerenti con i template PDF
- [ ] Funziona sia su Word che su Google Docs (compatibilita' .docx)

---

## Story 21.5 — Integrare il nuovo motore in StepExport + ExportDrawer

**Priorita':** Must

### Cosa fare

Collegare il nuovo motore di rendering ai componenti frontend esistenti. Sostituire le chiamate a react-pdf e docx-generator con le chiamate al nuovo sistema.

### Modifiche a StepExport

1. **Rimuovere** l'import di `pdf` da `@react-pdf/renderer` e dei template TSX
2. **Rimuovere** l'import di `generateDocx` da `docx-generator.ts`
3. **Aggiungere** il componente `CVPreview` (da story 21.3)
4. **Modificare `handleDownload`:**
   ```typescript
   async function handleDownload() {
     setDownloading(true);
     try {
       const response = await supabase.functions.invoke("render-cv", {
         body: { cv: cvData, template_id: selectedTemplate, format: "pdf", lang },
       });
       if (response.error) throw response.error;
       const blob = new Blob([response.data], { type: "application/pdf" });
       saveAs(blob, `cv-${selectedTemplate}.pdf`);
       // Upload to storage (same as now)
     } finally {
       setDownloading(false);
     }
   }
   ```
5. **Modificare `handleDownloadDocx`:** chiamare la nuova Edge Function o il generatore client-side (da story 21.4)

### Modifiche a ExportDrawer

Stesse modifiche: sostituire il rendering react-pdf con la chiamata alla Edge Function.

### Formal Review

Il flusso cv-formal-review resta invariato — viene chiamato sul CV JSON, non sul PDF. Il CV corretto viene passato a render-cv per il rendering.

### Criteri di accettazione

- [ ] StepExport usa il nuovo motore per PDF e DOCX
- [ ] ExportDrawer usa il nuovo motore
- [ ] Preview visibile prima del download
- [ ] Download PDF funzionante con il nuovo motore
- [ ] Download DOCX funzionante con il nuovo motore
- [ ] Formal review continua a funzionare
- [ ] Upload su Storage dopo download (come prima)
- [ ] Nessuna regressione: tutti i template funzionano

---

## Story 21.6 — Rimuovere il vecchio motore (react-pdf + docx-generator)

**Priorita':** Should (dopo che il nuovo motore funziona)

### Cosa fare

1. Rimuovere da `package.json`:
   - `@react-pdf/renderer`
   - `docx` (se non usato altrove)

2. Eliminare i file:
   - `src/components/cv-templates/ClassicoTemplate.tsx`
   - `src/components/cv-templates/MinimalTemplate.tsx`
   - `src/components/cv-templates/ExecutiveTemplate.tsx`
   - `src/components/cv-templates/ModernoTemplate.tsx`
   - `src/components/cv-templates/docx-generator.ts`
   - `src/components/cv-templates/template-utils.ts` (se non usato altrove)

3. Aggiornare `src/components/cv-templates/index.ts` per esportare solo il registry (template ID, nome, free/pro)

4. Verificare che nessun altro file importi i componenti rimossi

### Criteri di accettazione

- [ ] `@react-pdf/renderer` rimosso da package.json
- [ ] `docx` rimosso da package.json (se non usato)
- [ ] 4 file template TSX eliminati
- [ ] docx-generator.ts eliminato
- [ ] L'app compila senza errori
- [ ] Bundle size ridotto significativamente (react-pdf e' pesante)

---

## Criteri di accettazione globali

- [ ] Il CV PDF e' sempre max 2 pagine A4
- [ ] Nessun contenuto troncato con "…" — l'algoritmo riduce font/margini prima di tagliare
- [ ] Ogni esperienza lavorativa e' presente nel CV finale
- [ ] Layout a 2 colonne funziona sia in PDF che in DOCX
- [ ] Spaziature corrette: nessun titolo orfano in fondo pagina, nessun blocco esperienza spezzato
- [ ] Hyphenation attiva (parole lunghe vanno a capo correttamente)
- [ ] Preview istantanea nel browser prima del download
- [ ] Il DOCX ha la stessa struttura visiva del PDF
- [ ] Aggiungere un nuovo template = creare un file HTML + un file DOCX, nessun codice da scrivere
- [ ] L'app compila senza react-pdf (riduzione bundle size)

---

## Note implementative

### Scelta del servizio PDF rendering

| Servizio | Quando usarlo |
|---|---|
| **PDFShift** | Scelta raccomandata. API semplice, buona qualita', free tier 250 PDF/mese. Sufficiente per MVP. |
| **Gotenberg** | Se serve self-hosted (zero costi ricorrenti). Richiede Docker. |
| **Browserless.io** | Se serve esecuzione JS nel rendering (animazioni, calcoli). |
| **Client-side (jsPDF + html2canvas)** | Fallback temporaneo se nessun servizio esterno. Qualita' inferiore (rasterizzato). |

### Compatibilita' Deno per DOCX

`docx-templates` usa Node APIs (Buffer, fs). Per Deno:
- Usare `npm:docx-templates` con Deno npm compatibility
- Oppure usare `easy-template-x` che e' piu' leggero
- Oppure generare il DOCX client-side (la libreria funziona nel browser)

### Migrazione graduale

E' possibile implementare il nuovo motore **in parallelo** al vecchio:
1. Aggiungere un toggle "Usa nuovo motore (beta)" in StepExport
2. Testare con utenti reali
3. Quando stabile, rimuovere il vecchio motore (story 21.6)
