

# Piano: Miglioramento cv-formal-review + normalizzazione deterministica

## Diagnosi

Il `cv-formal-review` ha un prompt debole e riscrive l'intero CV come `revised_cv` senza schema vincolato. Questo causa: troncamento bullet, sostituzione caratteri non-ATS, mix linguistici. Il `cv-review` (più robusto, con ground truth) non è mai chiamato dal frontend.

## Strategia

Adottare il piano approvato nella conversazione precedente, **integrandovi i 5 suggerimenti dell'utente**:

1. Eliminare `cv-formal-review` come edge function
2. Sostituirlo con normalizzazione deterministica client-side
3. Integrare le regole formali nel prompt di `cv-review` (che verrà integrato in `ai-tailor`)
4. Applicare i suggerimenti specifici al prompt e al codice

## Step di implementazione

### Step 1 — Normalizzatore deterministico in `template-utils.ts`

Creare `normalizeCvText(cv, lang)` che:
- Sostituisce em dash (—) e en dash (–) con trattino ASCII (-)
- Sostituisce virgolette curve (" " ' ') con virgolette dritte (" e ')
- Uniforma date al formato `Mmm YYYY` localizzato (Gen 2021 / Jan 2021)
- Uniforma separatori date a `-` ASCII
- Ritorna il CV normalizzato (nuovo oggetto, no mutazione)

### Step 2 — Aggiornare prompt di `cv-review` con regole formali

Aggiungere al SYSTEM_PROMPT di `cv-review/index.ts`:
- **Regola 9 (aggiornata)**: Separatore date = solo `-` ASCII, mai `–` o `—`
- **Regola 12**: Caratteri ATS-safe — solo ASCII standard. Mai em dash, en dash, virgolette curve. Sostituire con trattino (-) e virgolette dritte (")
- **Regola 13**: No truncation — NON rimuovere, accorciare o unire bullet/frasi già presenti. Correggi SOLO la forma, mai il contenuto o la lunghezza

### Step 3 — Integrare cv-review in ai-tailor (post-tailoring, server-side)

In `ai-tailor/index.ts`, dopo l'integrity check e prima della response:
- Chiamare `callAi` con il prompt di cv-review, passando `original_cv` come ground truth
- Usare il risultato come `tailored_cv` finale
- Preservare photo_base64 e personal data come già fa cv-review

### Step 4 — Semplificare StepExport

In `StepExport.tsx`:
- Rimuovere la chiamata a `cv-formal-review`, il retry logic, `reviewStatus`, `reviewFixes`, `reviewedCv`, `ReviewFix` type, `ReviewStatus` type
- Rimuovere il collapsible "Correzioni formali"
- `activeCv = normalizeCvText(tailoredCv, lang)` — deterministico, istantaneo
- I download partono subito senza attendere revisione

### Step 5 — Aggiornare cv-formal-review con i suggerimenti (prima di eliminarlo)

Questi miglioramenti vanno in realtà nel prompt di cv-review (Step 2), dato che eliminiamo cv-formal-review:
- Rimuovere `template_id` dal userMessage (suggerimento 4)
- Aggiungere `if (!lang) console.warn(...)` fallback nel log (suggerimento 5) — questo va in ai-tailor dove si integra cv-review

### Step 6 — Eliminare cv-formal-review

- Eliminare `supabase/functions/cv-formal-review/index.ts`
- Usare il tool `delete_edge_functions` per rimuovere la funzione deployata

### Step 7 — Fix bug in cv-review

La riga 273 di `cv-review/index.ts` ha un bug: `const userId = user.id` — `user` non esiste, dovrebbe essere `userData.user.id`. Questo va fixato prima dell'integrazione in ai-tailor.

## Flusso risultante

```text
ai-tailor (patches + integrity + cv-review integrato)
    ↓
tailored_cv (già pulito server-side)
    ↓
StepExport → normalizeCvText(cv, lang)  ← deterministico, istantaneo
    ↓
Download DOCX/PDF
```

## File modificati

| File | Azione |
|------|--------|
| `src/components/cv-templates/template-utils.ts` | Aggiungere `normalizeCvText()` |
| `src/components/wizard/StepExport.tsx` | Rimuovere cv-formal-review, usare normalizzazione deterministica |
| `supabase/functions/ai-tailor/index.ts` | Integrare cv-review post-tailoring |
| `supabase/functions/cv-review/index.ts` | Aggiungere regole 12-13, fix bug riga 273 |
| `supabase/functions/cv-formal-review/index.ts` | Eliminare |

