

# Fix Preview + PDF Export

## Problemi identificati

1. **Preview non scala**: L'iframe mostra il CV a dimensione reale (A4 = ~794x1123px) dentro un container piccolo. Serve uno scaling CSS per adattarlo.
2. **PDF blocca popup**: `printCvAsPdf()` usa `window.open()` che viene bloccato. Serve iframe nascosto con `.print()`.

## Modifiche — `src/components/wizard/StepExport.tsx`

### 1. CVPreview — scaling responsivo

Sostituire l'iframe attuale con un approccio "CSS zoom":
- Container con `aspect-ratio: 1/1.414` e `overflow: hidden`
- L'iframe interno ha dimensioni fisse A4 (794x1123px) 
- Applicare `transform: scale(containerWidth / 794)` con `transformOrigin: top left`
- Usare un `ResizeObserver` o ref per calcolare la larghezza del container e derivare lo scale factor
- Il container clip l'overflow, l'iframe viene ridotto proporzionalmente

### 2. PDF — iframe nascosto con print()

Sostituire `printCvAsPdf()`:
- Aggiungere un `<iframe>` nascosto (`position: absolute; left: -9999px`) al componente
- Al click su "Scarica PDF": scrivere l'HTML (gia' disponibile dalla CVPreview) in `srcdoc` dell'iframe nascosto
- `onLoad` → `contentWindow.print()`
- Nessun popup, nessun blocco

### 3. Condivisione HTML tra preview e print

- CVPreview espone l'HTML caricato tramite un callback `onHtmlLoaded`
- StepExport salva l'HTML in uno state `previewHtml`
- Il bottone PDF riutilizza `previewHtml` senza richiamare render-cv

**File**: `src/components/wizard/StepExport.tsx`

