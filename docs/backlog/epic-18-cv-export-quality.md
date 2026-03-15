# Epic 18 — Qualità Export CV (PDF + DOCX + Skills + Impaginazione)

## Obiettivo

Risolvere 3 problemi critici nell'export CV:
1. Le foto non appaiono nei PDF (bug nel campo `photo_base64` vs `photo_url`)
2. L'impaginazione è rotta: page break dentro i paragrafi, nessun margine top dalla seconda pagina in poi, sidebar che non si estende sulle pagine successive
3. Le skill non sono riordinabili dall'utente né ordinate intelligentemente dall'AI
4. Manca l'export DOCX (solo PDF disponibile)

---

## Problema 1 — Foto mancante nei PDF (BUG)

### Causa

Il parsing (`parse-cv`) salva la URL della foto nel campo `photo_base64` del tipo `ParsedCV`:
```
parsedCV.photo_base64 = photoUrl;  // parse-cv/index.ts:414
```

Il tailoring (`ai-tailor`) copia il campo:
```
if (photoBase64) (tailoredCV as any).photo_base64 = photoBase64;  // ai-tailor/index.ts:707
```

Ma tutti i 4 template PDF cercano un campo diverso:
```
const photoUrl = clean(cv.photo_url) || clean(personal.photo_url);  // ogni template
```

**Risultato:** `cv.photo_url` è sempre `undefined` → la foto non viene mai renderizzata nel PDF.

### Cosa fare

Nei 4 template (`ClassicoTemplate`, `MinimalTemplate`, `ExecutiveTemplate`, `ModernoTemplate`), aggiornare la riga che legge la foto:

```typescript
const photoUrl = clean(cv.photo_url) || clean(cv.photo_base64) || clean(personal.photo_url);
```

Questo risolve il bug sia per i CV nuovi che per quelli già salvati. Il rename `photo_base64` → `photo_url` è una story separata (P3.3) che può essere fatta dopo.

### Criteri di accettazione

- [ ] La foto appare nei PDF esportati (tutti i 4 template)
- [ ] Funziona sia con CV master che con CV tailored
- [ ] Nessuna regressione se la foto non esiste (campo null/assente)

---

## Problema 2 — Impaginazione PDF rotta

### Causa

I template usano un singolo `<Page>` con layout a 2 colonne (`flexDirection: "row"`). `react-pdf` gestisce male il multi-page con layout sidebar:

1. **La sidebar non si estende sulla seconda pagina** — il background scuro si ferma alla fine della prima pagina, la seconda ha solo contenuto main su sfondo bianco
2. **Nessun margine top sulle pagine successive** — il contenuto che va in overflow ricomincia dal bordo superiore della pagina, senza padding
3. **Page break dentro i blocchi** — anche con `wrap={false}` sui singoli blocchi esperienza, se un blocco è più alto della pagina disponibile viene spezzato. I bullet point vengono tagliati a metà

### Cosa fare

#### A. Margine top sulle pagine successive

Aggiungere margine top per le pagine successive usando la proprietà `fixed` di react-pdf oppure padding sulla pagina:

```typescript
<Page size="A4" style={{ ...ds.page }}>
  <View style={baseStyles.main}>
    {/* Header ripetuto con padding top per pagine successive */}
  </View>
</Page>
```

Il modo più affidabile: impostare `paddingTop` e `paddingBottom` sulla `<Page>`, non solo sulla `<View>`. Questo garantisce margini su tutte le pagine:

```typescript
<Page size="A4" style={{ fontFamily: "DM Sans", paddingTop: 32, paddingBottom: 40 }}>
```

#### B. Sidebar che si estende su tutte le pagine

Per i template con sidebar (Classico, Minimal, Moderno), usare un `<View fixed>` per il background della sidebar che si ripete su ogni pagina:

```typescript
<View fixed style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "28%", backgroundColor: SIDEBAR_BG }} />
```

Questo crea un background fisso che copre tutta la pagina, indipendentemente dal contenuto.

#### C. Page break intelligenti

- Rimuovere `wrap={false}` dai blocchi esperienza più lunghi (quelli con molti bullet). `wrap={false}` forza il blocco intero nella pagina successiva se non entra, creando grandi spazi vuoti.
- Usare `wrap={false}` solo su blocchi piccoli: education, certifications, single experience senza bullet
- Per le esperienze con bullet: permettere il wrap ma aggiungere `minPresenceAhead={40}` per evitare che un titolo esperienza finisca da solo in fondo alla pagina:

```typescript
<View style={ds.expBlock} minPresenceAhead={40}>
  <Text style={ds.expRole}>{role}</Text>
  ...
</View>
```

- Aggiungere `orphans={2} widows={2}` equivalente: assicurare che almeno 2 bullet restino con il titolo e almeno 2 passino alla pagina successiva.

#### D. Padding bottom per evitare testo tagliato

Aggiungere `paddingBottom: 40` a `<Page>` (non alla View main) per evitare che l'ultimo elemento di ogni pagina venga tagliato.

### Criteri di accettazione

- [ ] La sidebar ha sfondo scuro su tutte le pagine (non solo la prima)
- [ ] Le pagine successive hanno almeno 32pt di margine top
- [ ] Le pagine successive hanno almeno 40pt di margine bottom
- [ ] I blocchi esperienza lunghi vengono spezzati correttamente (non enormi spazi bianchi)
- [ ] Il titolo di un'esperienza non finisce da solo in fondo alla pagina (almeno 2 bullet insieme)
- [ ] Testato con CV di 3+ pagine
- [ ] Tutti i 4 template aggiornati

---

## Problema 3 — Riordinamento skill

### Oggi

Le skill vengono mostrate nell'ordine in cui l'AI le restituisce. L'utente non può:
- Riordinarle a mano (drag & drop o frecce)
- Scegliere quali mostrare nel CV e quali nascondere

### Cosa fare

#### A. Ordinamento automatico intelligente (nel tailoring)

In `ai-tailor`, nel system prompt TAILOR, aggiungere la regola:

> Ordina le skill nel CV tailored per rilevanza rispetto all'annuncio: prima le skill che matchano i requisiti, poi le skill tecniche, poi le soft skill. Le skill richieste dall'annuncio devono apparire per prime.

Questo non richiede cambiamenti frontend — l'AI ordina le skill nel JSON tailored.

#### B. Riordinamento manuale in StepRevisione

Nello step 3 del wizard (revisione CV tailored), nella sezione skill:
- Mostrare le skill come chip draggabili (drag & drop) o con frecce su/giù
- L'utente può trascinare le skill per riordinarle
- L'ordine finale viene salvato nel CV tailored prima dell'export

**Implementazione suggerita:**
- Usare una lista con pulsanti freccia (su/giù) per ogni skill — più semplice del drag & drop
- Oppure: chip con long-press + drag su mobile, click + drag su desktop
- Al rilascio, aggiornare l'array `skills.technical` / `skills.soft` / `skills.tools` nel CV tailored

#### C. Toggle visibilità skill

Accanto a ogni skill chip: icona occhio (Eye/EyeClosed) per nascondere/mostrare la skill nel CV. Le skill nascoste non appaiono nel PDF ma restano nel JSON (per poterle riattivare).

### Criteri di accettazione

- [ ] Le skill nel CV tailored sono ordinate per rilevanza (matching first)
- [ ] L'utente può riordinare le skill manualmente in StepRevisione
- [ ] L'utente può nascondere skill dal CV in StepRevisione
- [ ] L'ordine e la visibilità vengono rispettati nel PDF esportato
- [ ] Il riordinamento funziona su mobile (touch-friendly)

---

## Problema 4 — Export DOCX

### Oggi

Solo export PDF (via `@react-pdf/renderer`). Molti recruiter preferiscono DOCX per editare il CV prima di inviarlo al cliente.

### Cosa fare

Aggiungere un pulsante "Scarica DOCX" accanto a "Scarica PDF" in StepExport.

**Libreria suggerita:** `docx` (npm package `docx`) — genera file .docx in browser senza server.

**Struttura:**
1. Creare `src/components/cv-templates/docx-generator.ts` con funzione `generateDocx(cv, template, lang)`:
   - Usa la libreria `docx` per creare un Document con sezioni
   - Mappa le stesse sezioni del PDF (personal, summary, experience, education, skills, etc.)
   - Un solo layout (non serve replicare i 4 template — layout professionale pulito)
   - Include la foto se disponibile
   - Margini standard (2.5cm top/bottom, 2cm left/right)
   - Font: Calibri (standard DOCX) o Arial

2. In `StepExport.tsx`: aggiungere secondo pulsante "Scarica DOCX" sotto "Scarica PDF"
   - Stile: `variant="outline"` per differenziare dal PDF (primario)
   - Genera blob DOCX → download → upload su storage (`cv-exports`)

3. **Solo per utenti Pro** — il DOCX è un benefit aggiuntivo del piano Pro.

### Criteri di accettazione

- [ ] Pulsante "Scarica DOCX" visibile in StepExport
- [ ] DOCX generato correttamente con tutte le sezioni del CV
- [ ] Foto inclusa nel DOCX se disponibile
- [ ] DOCX apribile in Word, Google Docs, LibreOffice senza errori
- [ ] DOCX riservato agli utenti Pro (lucchetto per Free)
- [ ] File salvato su storage come il PDF

---

## Stories

| ID | Story | Priorita' |
|----|-------|----------|
| 18.1 | Fix bug foto: leggere `photo_base64` nei 4 template PDF | **Must — BUG** |
| 18.2 | Impaginazione: sidebar fixed su tutte le pagine, margini top/bottom | Must |
| 18.3 | Impaginazione: page break intelligenti, rimuovere `wrap={false}` dai blocchi lunghi | Must |
| 18.4 | Prompt AI tailor: ordinare skill per rilevanza | Must |
| 18.5 | StepRevisione: riordinamento manuale skill (frecce su/giù) + toggle visibilità | Should |
| 18.6 | Export DOCX con libreria `docx`, Pro-only | Should |
