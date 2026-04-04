

# Problemi del DOCX Generator — Analisi completa

## Problemi identificati

### 1. Bullet points con carattere Unicode invece di numerazione Word
Il generatore usa `• ` come TextRun manuale invece del sistema di numerazione nativo di Word (`LevelFormat.BULLET`). Questo rende i bullet non standard per gli ATS e impedisce l'indentazione corretta.

### 2. Date NON allineate a destra (tab stop mancanti)
Le date compaiono su una riga separata sotto l'azienda, occupando spazio inutile. Un CV professionale allinea la data a destra sulla stessa riga del ruolo tramite tab stop (`TabStopType.RIGHT`).

### 3. `normalizeDate` non gestisce il formato "01.2018"
Le date con punto (es. `01.2018 – 01.2021`) passano al fallback `sanitize()` senza conversione, causando formati inconsistenti nel documento (mix di `06/2023` e `01.2018`).

### 4. Ruoli resi come `HeadingLevel.HEADING_2` (sbagliato)
I titoli di sezione usano `HeadingLevel.HEADING_2`, che li inserisce nella struttura TOC/outline del documento. I ruoli lavorativi usano la stessa dimensione font delle sezioni (`sectionSize = 22`). In un CV ATS, solo il nome dovrebbe essere heading.

### 5. Azienda su riga separata dal ruolo — spreco di spazio
Ruolo, azienda e data occupano 3 righe. Layout professionale: **Ruolo** + data (stessa riga con tab stop), azienda in corsivo sotto.

### 6. Enorme spazio vuoto su pagina 2
La pagina 2 è mezza vuota. Il generatore non ottimizza i margini o la spaziatura per far stare tutto in una pagina quando possibile. Margini di 25mm top/bottom sono eccessivi.

### 7. "…" come riga orfana di troncamento
Quando il density system tronca i bullet, aggiunge `"…"` come riga standalone — visivamente brutto e confuso.

### 8. Education — istituzioni in MAIUSCOLO e nessuna data visibile
Le date di inizio/fine degli studi non vengono mostrate. L'istituzione viene concatenata al titolo tutto su una riga, il che con nomi lunghi risulta illeggibile.

### 9. Nessuna numerazione Word nativa per i bullet
L'import non include `LevelFormat`, `NumberFormat`, o `Tab`/`TabStopType` — tutti necessari per un DOCX professionale.

### 10. Colore azienda hardcoded
`"333333"` usato direttamente invece di passare per lo style system (`s.mutedHex`).

---

## Piano di implementazione

### Step 1 — Fix imports e infrastruttura
Aggiungere agli import: `TabStopType`, `TabStopPosition`, `Tab`, `LevelFormat`, `convertInchesToTwip`.

### Step 2 — Numerazione bullet nativa Word
Configurare `numbering.config` nel `Document` con `LevelFormat.BULLET` e riferirlo nei paragrafi bullet, eliminando il carattere `•` manuale.

### Step 3 — Layout esperienza con tab stop per date
Ristrutturare ogni blocco esperienza:
- Riga 1: **Ruolo** `[TAB]` *data range* (allineato a destra)
- Riga 2: *Azienda* · *Location* (in corsivo, colore muted)
- Bullet sotto

### Step 4 — Fix `normalizeDate`
Aggiungere regex per formato `DD.YYYY` → `DD/YYYY` (es. `01.2018` → `01/2018`).

### Step 5 — Education con date e layout migliorato
- Riga 1: **Degree: Field** `[TAB]` *date range*
- Riga 2: *Institution* · *Grade*

### Step 6 — Ottimizzare margini e spaziatura
Ridurre margini a 20mm top/bottom (già 20mm laterali). Ridurre spacing dei section title e dei blocchi esperienza per massimizzare l'uso dello spazio.

### Step 7 — Eliminare "…" orfano
Se il troncamento è necessario, appendere "…" all'ultimo bullet visibile invece di creare una riga separata.

### Step 8 — Rimuovere HeadingLevel dai section titles
Usare paragrafi normali con formattazione bold invece di `HeadingLevel.HEADING_2`, più compatibile con gli ATS.

### Step 9 — Aggiornare i test
Verificare che i test esistenti passino con la nuova struttura (il blob size potrebbe cambiare).

---

## Dettaglio tecnico

**File modificati:**
- `src/components/cv-templates/docx-generator.ts` — riscrittura sostanziale del layout
- `src/components/cv-templates/template-utils.ts` — fix `truncateBullets` per appendere "…" inline
- `src/test/docx-generator.test.ts` — aggiornamento se necessario

