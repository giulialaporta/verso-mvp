

# Regola universale `wrap={false}` su tutti i template PDF

## Regola

Ogni `<View>` che rappresenta un **blocco atomico** (un singolo item di una lista) deve avere `wrap={false}` per impedire che venga spezzato tra due pagine. Questo vale per: esperienza, educazione, progetto, certificazione, extra section item.

## Audit — blocchi mancanti per template

| Template | expBlock | eduBlock | projBlock | certBlock | extraSection | twoCol |
|----------|----------|----------|-----------|-----------|--------------|--------|
| Classico | ✓ | **manca** | **manca** | **manca** | **manca** | — |
| Minimal | ✓ | **manca** | **manca** | — (in sidebar) | **manca** | — |
| Executive | ✓ | ✓ | **manca** | **manca** | **manca** | **manca** |
| Moderno | ✓ | ✓ | **manca** | — (in sidebar) | **manca** | — |

## Modifiche

**ClassicoTemplate.tsx** — Aggiungere `wrap={false}` a:
- `eduBlock` (riga 151)
- `projBlock` (riga 169)
- cert `<View>` (riga 105)
- extra section `<View>` (riga 179)

**MinimalTemplate.tsx** — Aggiungere `wrap={false}` a:
- `eduBlock` (riga 155)
- `projBlock` (riga 173)
- extra section `<View>` (riga 183)

**ExecutiveTemplate.tsx** — Aggiungere `wrap={false}` a:
- `twoCol` View (riga 156)
- cert `<View>` (riga 188)
- `projBlock` (riga 202)
- extra section `<View>` (riga 213)

**ModernoTemplate.tsx** — Aggiungere `wrap={false}` a:
- `projBlock` (riga 193)
- extra section `<View>` (riga 203)

Totale: 13 aggiunte di `wrap={false}`, zero cambi strutturali o di stile.

