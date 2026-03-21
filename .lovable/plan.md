

# Epic 21 — Stato attuale e piano di implementazione

## Stato delle stories

| Story | Stato | Note |
|-------|-------|------|
| 21.1 | Parziale | Template HTML esistono ma usano Inter, colori generici, nessun KPI badge. Manca il template "visual" brand Verso con DM Sans, sidebar #1C1F26, accent #6EBF47 |
| 21.2 | Fatto | `render-cv` edge function funziona con fit-to-2-pages e output HTML |
| 21.3 | Fatto | CVPreview con iframe esiste in StepExport |
| 21.4 | Non fatto | Nessuna edge function `render-cv-ats`. Esiste `docx-generator.ts` client-side ma non segue le regole ATS A1-A11 |
| 21.5 | Non fatto | StepExport ha ancora il template picker con 4 template. Serve il layout a 2 card (CV Recruiter + CV ATS) + teaser Pro |
| 21.6 | Fatto | `react-pdf` e i 4 template TSX sono gia' stati rimossi |

## Piano di implementazione (3 stories rimanenti)

### Story 21.1 — Template CV_VISUAL brand Verso

Creare un nuovo template `visual` in `supabase/functions/render-cv/templates.ts`:
- **Font**: DM Sans (400, 500, 700) via Google Fonts
- **Colori**: sidebar #1C1F26, accent #6EBF47, KPI badges (#F0FAE0 bg, #9ED940 border, #14532D text)
- **Layout**: grid 28% sidebar + 72% body, come da spec
- **KPI badges**: sezione `{{#if kpis}}` con `.kpi-row` e `.kpi-badge` inline
- **Bullet marker**: `·` in verde accent
- **Titoli sezione**: maiuscolo, letter-spacing 0.08em, linea sotto 1px #6EBF47
- **Foto**: cerchio 72px con fallback iniziale del nome
- Aggiornare `prepareData()` in `render-cv/index.ts` per estrarre `kpis` dal CV JSON
- Aggiungere `"visual"` alla lista `validTemplates`
- Rideploy `render-cv`

**File**: `supabase/functions/render-cv/templates.ts`, `supabase/functions/render-cv/index.ts`

### Story 21.4 — DOCX ATS via client-side

Riscrivere `src/components/cv-templates/docx-generator.ts` come generatore ATS-compliant:
- **Singola colonna**, zero tabelle, zero text box
- **Font Calibri** 11pt corpo, 16pt nome
- **Contatti** su riga unica con tab stop (non tabella, non header Word)
- **Titoli sezione standard**: "Profilo professionale", "Esperienze", "Formazione", "Competenze", "Certificazioni", "Lingue"
- **Colori**: solo nero #111827 e verde #166534 per titoli
- **Caratteri**: no em dash, no en dash, no virgolette tipografiche
- **Date**: formato MM/YYYY
- **KPI**: triangolini `▸` inline
- **Bullet**: trattino `-` via numbering config Word
- **Footer GDPR**: testo muto centrato
- Mantenere generazione client-side (la libreria `docx` e' gia' in `package.json`)

**File**: `src/components/cv-templates/docx-generator.ts`

### Story 21.5 — Nuovo StepExport (2 card + teaser)

Riscrivere `src/components/wizard/StepExport.tsx`:
- Rimuovere template picker (nessuna scelta template)
- **Sequenza bloccante** al mount: `cv-formal-review` → `render-cv(visual, html)` → abilita download
- **Layout 2 card affiancate** (impilate su mobile):
  - **CV Recruiter**: iframe preview del template visual + bottone "Scarica PDF"
  - **CV ATS**: anteprima testuale stilizzata (struttura sezioni, font mono) + bottone "Scarica DOCX"
- **Teaser "Altri template recruiter"**: 3 card opacizzate con lock + "Prossimamente con Verso Pro"
- **Banner stati**: reviewing → rendering → ready (con conteggio correzioni)
- Download PDF: `printCvAsPdf()` con template `visual`
- Download DOCX: `generateDocx()` con il nuovo generatore ATS
- Entrambi i download disponibili per Free e Pro (nessun gate)
- Upload su Storage dopo download

**File**: `src/components/wizard/StepExport.tsx`, `src/components/cv-templates/index.ts`

## Ordine di esecuzione

1. **21.1** — Template visual (prerequisito per preview)
2. **21.4** — Generatore DOCX ATS
3. **21.5** — Nuovo StepExport che usa entrambi

## Dettagli tecnici

- I vecchi 4 template (classico, minimal, executive, moderno) restano in `templates.ts` per backward compatibility ma non verranno piu' mostrati nello step export
- Il template `visual` viene aggiunto come quinto template nel dizionario `TEMPLATES`
- `docx-generator.ts` viene riscritto completamente: il codice attuale genera DOCX basati sui 4 vecchi template con stili diversi per ciascuno; il nuovo genera un unico output ATS-compliant
- Nessuna nuova edge function necessaria: il DOCX resta client-side, il PDF resta via `render-cv`

