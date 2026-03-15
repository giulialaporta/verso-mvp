

## Analisi del problema

Il sistema di densità adattiva (`computeDensity`) non riesce a contenere i CV lunghi in 2 pagine perché:

1. **Stima linee troppo ottimista**: divide per 55 caratteri/riga, ma la colonna main (72% di A4 meno padding ~72pt) contiene circa 40-45 caratteri per riga a font 10pt. Questo sottostima il contenuto del ~25%.

2. **Soglie troppo alte**: il tier "ultra" scatta solo a 100+ linee stimate, ma con la sottostima reale un CV da 130 linee viene classificato come "dense" (100 stimate).

3. **Troncamento insufficiente in "ultra"**: tronca solo i bullet delle esperienze con index >= 2 a max 3, ma non limita il numero di esperienze, la lunghezza del summary, né il numero di bullet per le prime 2 esperienze.

4. **Nessun tier più aggressivo**: manca un livello "extreme" che tagli ulteriormente per CV molto densi (7+ esperienze con molti bullet ciascuna).

## Piano

### 1. Fix stima linee in `computeDensity` (template-utils.ts)

- Ridurre il divisore da 55 a 42 caratteri/riga (più realistico per la colonna main)
- Contare anche le linee della sidebar (skill, lingue, certificazioni) perché se la sidebar è più lunga del main, il PDF cresce comunque

### 2. Abbassare le soglie dei tier

```
normal:  <= 45 linee (era 55)
compact: <= 65 linee (era 75)
dense:   <= 85 linee (era 100)
ultra:   <= 110 linee (nuovo)
extreme: > 110 linee (nuovo tier)
```

### 3. Aggiungere tier "extreme"

Nuovo livello che applica:
- Font body 9pt (minimo assoluto)
- Bullet font 9pt
- Summary troncato a 200 caratteri con "…"
- Max 2 bullet per TUTTE le esperienze (non solo index >= 2)
- Max 5 esperienze visibili (le più vecchie vengono omesse)
- Line height 1.35
- Margini minimi tra sezioni

### 4. Aggiungere funzione `truncateSummary`

Per i tier ultra/extreme, troncare il summary a un massimo di caratteri (300 per ultra, 200 per extreme).

### 5. Aggiungere funzione `limitExperiences`

Per il tier extreme, limitare le esperienze mostrate a max 5, aggiungendo un indicatore "... e N altre esperienze" se troncate.

### 6. Applicare nei 4 template

Tutti e 4 i template (Classico, Minimal, Executive, Moderno) devono usare `truncateSummary` e `limitExperiences` con il density config.

### File coinvolti

| File | Modifica |
|------|----------|
| `src/components/cv-templates/template-utils.ts` | Fix stima linee, nuove soglie, tier "extreme", funzioni truncateSummary e limitExperiences |
| `src/components/cv-templates/ClassicoTemplate.tsx` | Applicare truncateSummary e limitExperiences |
| `src/components/cv-templates/MinimalTemplate.tsx` | Idem |
| `src/components/cv-templates/ExecutiveTemplate.tsx` | Idem |
| `src/components/cv-templates/ModernoTemplate.tsx` | Idem |

