

# Fix: Numeri fantasma, foto mancante, sidebar troncata

## Problemi

### 1. Numeri senza senso in alto nel CV (KPI badges)
La funzione `extractKpis()` in `render-cv/index.ts` estrae frammenti numerici dai bullet con una regex (`/(\d[\d.,]*[+]?\s*(%|K|M|...))/`), decontestualizzandoli. Ad esempio da "Aumentato il fatturato del +30% annuo" estrae solo "+30% annuo" come badge. Questo viola il principio anti-allucinazione: il sistema sta **inventando KPI** che l'utente non ha mai fornito come tali.

**Fix**: Rimuovere completamente `extractKpis()` e la sezione `{{#if kpis.length}}` dal template visual. I KPI badges non verranno mostrati.

### 2. Foto mancante
La pipeline e':
- `ai-tailor` preserva `photo_base64` nel CV tailorato
- `cv-formal-review` usa `compactCV()` che **rimuove** `photo_base64`
- L'AI restituisce `revised_cv` **senza** foto
- `render-cv` riceve il CV senza foto

**Fix**: In `StepExport.tsx`, dopo aver ricevuto il `revised_cv` dalla formal review, re-iniettare `photo_base64` dal `tailoredCv` originale prima di inviare a `render-cv`. Aggiungere anche il `photo_url` dal master CV se disponibile.

### 3. Sidebar troncata a meta' pagina
Il CSS usa `min-height: 100vh` su `.page`, ma nella stampa (e nell'iframe di preview) il `100vh` corrisponde solo alla prima viewport. Se il contenuto va su 2 pagine, la sidebar si ferma alla fine della prima pagina (o alla fine del contenuto sidebar).

**Fix**: Cambiare l'approccio CSS nei template con sidebar (visual, classico, moderno, minimal):
- `.page` diventa il container principale con `position: relative`
- `.sidebar` usa `position: fixed; top: 0; bottom: 0; left: 0; width: 28%` per la stampa
- Alternativa piu' semplice e compatibile: usare un approccio con `background` sull'elemento `.page` che simula la colonna colorata tramite `background: linear-gradient(to right, #1C1F26 28%, transparent 28%)` — questo garantisce che il colore si estenda su tutte le pagine senza dipendere dall'altezza del contenuto sidebar

## File da modificare

| File | Modifica |
|------|----------|
| `supabase/functions/render-cv/index.ts` | Rimuovere `extractKpis()`, rimuovere `kpis` da `PreparedData` e `prepareData()` |
| `supabase/functions/render-cv/templates.ts` | Rimuovere sezione KPI badges dal template VISUAL. Aggiungere `background: linear-gradient(...)` al `.page` di tutti i template con sidebar (visual, classico, moderno, minimal) |
| `src/components/wizard/StepExport.tsx` | Re-iniettare `photo_base64`/`photo_url` nel `reviewedCv` prima di passarlo a `render-cv` |

## Dettagli tecnici

Per la sidebar full-height, il gradient approach funziona cosi':
```css
.page {
  background: linear-gradient(to right, var(--sidebar-bg) 28%, transparent 28%);
}
```
Questo disegna il colore della sidebar come background del container `.page`, che si estende naturalmente su tutta l'altezza del contenuto (anche multi-pagina). La sidebar vera resta sopra con il suo padding e contenuto.

