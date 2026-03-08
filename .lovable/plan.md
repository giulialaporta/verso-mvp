

# Fix Contrasto Testo — Root Cause e Piano

## Problema

`text-secondary` in Tailwind risolve a `hsl(var(--secondary))` = `hsl(228, 10%, 12%)` ≈ `#1C1E28` — quasi nero su sfondo nero. **Tutto il testo marcato `text-secondary` è praticamente invisibile.**

Il brand system definisce `--color-secondary: #5DBBFF` (Arctic Blue) per "links, info states, score bars", ma nel CSS la variabile `--secondary` è mappata al colore surface-2 (sfondo scuro), non al blu.

Stesso problema con `--muted-foreground: 0 0% 50%` (`#808080`) che ha contrasto borderline su sfondi scuri.

## Impatto

~125 occorrenze di `text-secondary` in 9 file — tutte invisibili. Include:
- **Punteggio ATS** (screenshot allegato)
- **Status chip "INVIATA"**
- **Icone info** (LinkedIn, risorse, salary)
- **Badge e progress bar** ATS

## Piano di Fix

### 1. Aggiungere colore `info` nel CSS (`src/index.css`)

Aggiungere una nuova variabile per il blu Arctic Blue del brand:

```css
--info: 207 100% 68%; /* #5DBBFF */
--info-foreground: 228 14% 5%;
--warning: 42 100% 70%; /* #FFD166 — già usato ma non definito come var */
```

E alzare `--muted-foreground` da 50% a 55% per migliorare il contrasto.

### 2. Registrare `info` in Tailwind (`tailwind.config.ts`)

```typescript
info: {
  DEFAULT: "hsl(var(--info))",
  foreground: "hsl(var(--info-foreground))",
},
```

### 3. Sostituire `text-secondary` → `text-info` ovunque usato per testo/icone

File coinvolti:
- `src/pages/Nuova.tsx` — score ATS, icone, risorse, badge
- `src/components/ExportDrawer.tsx` — punteggio ATS, explanation
- `src/pages/Candidature.tsx` — ATS score badge
- `src/pages/Home.tsx` — ATS score nella lista
- `src/components/SalaryAnalysisCard.tsx` — icone e badge
- `src/components/StatusChip.tsx` — status "inviata" (da `text-secondary` a `text-info`)

**NON toccare** `bg-secondary` nei componenti UI (button, slider, progress, sheet, badge) — quelli usano correttamente il colore come sfondo surface.

### 4. Alzare contrasto `--muted-foreground`

Da `0 0% 50%` a `0 0% 55%` — migliora leggibilità delle label secondarie senza stravolgere il design.

---

### File modificati

| File | Modifica |
|------|----------|
| `src/index.css` | Aggiungere `--info`, `--warning` vars, alzare `--muted-foreground` |
| `tailwind.config.ts` | Registrare colore `info` |
| `src/pages/Nuova.tsx` | `text-secondary` → `text-info` per testo/icone |
| `src/components/ExportDrawer.tsx` | Idem |
| `src/pages/Candidature.tsx` | Idem |
| `src/pages/Home.tsx` | Idem |
| `src/components/SalaryAnalysisCard.tsx` | Idem |
| `src/components/StatusChip.tsx` | Status "inviata": `text-secondary` → `text-info` |

Nessuna modifica al database.

