

# Fix: Sidebar troncata nella seconda pagina del CV Recruiter

## Problema

Il `linear-gradient` su `.page` si estende con l'altezza del contenuto, ma nella stampa/PDF il browser non ridisegna i background CSS sulle pagine successive. Il gradiente viene renderizzato solo sulla prima "viewport" del documento, causando la sidebar bianca dalla seconda pagina in poi.

## Soluzione

Usare un pseudo-elemento `::before` con `position: fixed` nel contesto di stampa. In modalita' print, `position: fixed` fa si' che l'elemento venga ripetuto su ogni pagina stampata. Il pseudo-elemento disegna solo il rettangolo colorato (senza contenuto), mentre la sidebar vera resta nel flusso naturale del grid.

```css
@media print {
  .page::before {
    content: "";
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: 28%;
    background: var(--sidebar-bg);
    z-index: -1;
  }
}
```

## File da modificare

**`supabase/functions/render-cv/templates.ts`** — Aggiungere la regola `@media print` con il pseudo-elemento `::before` ai 4 template con sidebar:
- **VISUAL**: `width: 28%`
- **CLASSICO**: `width: 28%`
- **MINIMAL**: `width: 26%`
- **MODERNO**: `width: 35%`

Il `linear-gradient` su `.page` resta come fallback per la visualizzazione nell'iframe (non-print), ma il `@media print` garantisce la copertura su tutte le pagine stampate.

Poi redeploy della edge function `render-cv`.

