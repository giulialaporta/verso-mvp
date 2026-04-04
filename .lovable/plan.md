

# CV Optimization AI — Piano Finale

## Modifiche rispetto al piano precedente

1. **Banner "CV ottimizzato"**: aggiunto diff esplicito tra CV parsato e `optimized_cv`. Il banner appare solo se `JSON.stringify(parsed) !== JSON.stringify(optimized)`. Nessun falso positivo.
2. **`date_gaps` rimosso dalla v1**: categoria esclusa dal prompt e dal componente tips. Verrà aggiunta in una fase successiva con logica dedicata.

---

## Flusso

```text
Upload → parse-cv → [mostra preview subito]
                  └→ [background] cv-optimize → diff? → aggiorna preview + tips
```

## Componenti

### 1. Edge Function `supabase/functions/cv-optimize/index.ts`

- Input: `{ cv_data: ParsedCV }`
- Output: `{ optimized_cv: ParsedCV, tips: Tip[] }`
- Usa `compactCV` per ridurre token, poi chiama Lovable AI (gemini-2.5-flash) con tool calling per output strutturato
- Prompt: recruiter esperto 15+ anni, corregge solo forma (verbi d'azione, cliché, date uniformi, summary generico), non inventa contenuti
- Categorie tips v1: `missing_kpi`, `missing_section`, `weak_bullets`, `generic_skills`, `missing_contact`, `summary_quality`
- **No `date_gaps`** in v1
- Temperatura 0.2
- Gestione errori 429/402 con risposte appropriate

### 2. `supabase/functions/_shared/ai-provider.ts`

- Aggiungere task `cv-optimize` al routing

### 3. `src/components/CVOptimizationTips.tsx` (nuovo)

- Card compatte per ogni tip: icona per categoria, bordo per priorità (high=accent, medium=warning, low=border)
- Ogni tip dismissabile
- Tips `missing_section` con azione "Aggiungi sezione"
- Props: `tips: Tip[]`, `onDismiss`, `onAddSection`

### 4. `src/pages/Onboarding.tsx`

- Dopo parse-cv, lancia `cv-optimize` in background (`optimizing: boolean`, `aiTips: Tip[]`)
- **Diff check**: `const hasChanges = JSON.stringify(parsedData) !== JSON.stringify(optimizedCv)`
- Se `hasChanges`: aggiorna `parsedData` con CV ottimizzato, mostra banner "Abbiamo migliorato la formattazione del tuo CV. Rivedi e modifica liberamente."
- Se `!hasChanges`: nessun banner, mostra solo eventuali tips
- Se `cv-optimize` fallisce: graceful degradation, prosegue con CV originale
- Tips mostrati sopra CVSections nello step preview

### 5. `src/pages/CVEdit.tsx`

- Pulsante "Ottimizza con AI" che lancia `cv-optimize` sul CV corrente
- Stesso diff check e banner
- Mostra tips risultanti

### Nessuna modifica al database. Tips transitori, non persistiti.

