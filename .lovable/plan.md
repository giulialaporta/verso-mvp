

# Piano: Ottimizzazione formal review + fix lingua headline

## Problemi identificati

1. **Correzioni formali visibili all'utente**: Il pannello collapsible mostra tutte le fix applicate — l'utente non dovrebbe vederle
2. **Velocita' cv-formal-review**: Il CV viene inviato con `JSON.stringify(cv, null, 2)` (molto verboso) e `maxTokens: 8192` (troppo alto). Inoltre usa tool calling che aggiunge latenza
3. **Headline in italiano nei CV in inglese**: I template HTML e DOCX hanno gia' i dizionari en/it, ma il parametro `lang` potrebbe non arrivare correttamente. L'ATSPreview in StepExport ha i suoi header separati che funzionano. Il vero problema potrebbe essere nel passaggio di `cvLang` o nel render-cv che riceve `lang` ma `getHeaders()` supporta solo `"en"` esatto (non `"english"`, non undefined)

## Modifiche

### 1. StepExport.tsx — Rimuovere pannello correzioni

- Eliminare completamente la sezione `Collapsible` con `reviewFixes` (righe 338-362)
- Rimuovere lo state `fixesOpen` e `reviewFixes`
- Il banner di stato mostra solo: "Revisione in corso..." → "Generazione anteprima..." → "Pronto" (senza conteggio fix)
- Il review resta attivo in background ma e' trasparente all'utente

### 2. cv-formal-review — Velocizzare

- Ridurre `maxTokens` da 8192 a 4096 (il revised_cv e' gia' compatto)
- Compattare il CV prima dell'invio: rimuovere `photo_base64`, limitare i bullet mostrati, usare `JSON.stringify(cv)` senza indentazione
- Semplificare il prompt: rimuovere le spiegazioni verbose, tenere solo le regole essenziali in formato lista
- Opzionale: switchare da tool calling a output JSON diretto (piu' veloce su Haiku)

### 3. Fix lingua headline — render-cv + DOCX + ATSPreview

- **render-cv/index.ts**: Aggiungere supporto per varianti lingua (`"english"` → `"en"`, `"italiano"` → `"it"`) in `getHeaders()`, dato che `detected_language` dall'AI potrebbe restituire la parola intera
- **docx-generator.ts**: Stessa normalizzazione nel `getHeaders()` locale
- **StepExport.tsx ATSPreview**: Stessa normalizzazione nel componente ATSPreview

La normalizzazione: `if (lang?.toLowerCase().startsWith("en")) → english headers`

### File da modificare

| File | Modifica |
|------|----------|
| `src/components/wizard/StepExport.tsx` | Rimuovere pannello fix, semplificare banner stati |
| `supabase/functions/cv-formal-review/index.ts` | Prompt compatto, maxTokens 4096, rimuovere photo_base64, JSON compatto |
| `supabase/functions/render-cv/index.ts` | Normalizzare lang in getHeaders |
| `src/components/cv-templates/docx-generator.ts` | Normalizzare lang in getHeaders |

