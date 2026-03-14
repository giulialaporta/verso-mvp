

# Story 17 — Analisi Retributiva nello Step 2

## Acceptance Criteria

1. **AC-1**: Se `salary_expectations` è presente nel profilo utente, viene inviato nel body della request a `ai-prescreen`
2. **AC-2**: Il prompt di `ai-prescreen` include istruzioni per generare `salary_analysis` quando riceve `salary_expectations`
3. **AC-3**: Il tool schema di `ai-prescreen` include la struttura `salary_analysis` come campo opzionale
4. **AC-4**: Nello Step 1 (Verifica), se `salary_analysis` è presente nel response, appare la card "Analisi Retributiva" con:
   - Due barre orizzontali proporzionali (candidato vs posizione)
   - Range RAL formattati (es. "€35-42K")
   - Badge fonte per ogni barra (Da te / Dall'annuncio / Stimata)
   - Delta percentuale colorato (verde ↑ / giallo → / rosso ↓)
   - Nota esplicativa dall'AI
   - Disclaimer in testo muted
5. **AC-5**: Se `salary_analysis` è assente nel response → nessuna sezione, nessun errore
6. **AC-6**: Se l'utente non ha `salary_expectations` nel profilo → `salary_expectations` non viene inviato, e l'AI può comunque stimare dalla posizione se il range è esplicito nell'annuncio

## Piano di implementazione

### 1. Edge Function `ai-prescreen` (2 modifiche)

**Prompt**: Aggiungere sezione che istruisce l'AI a produrre `salary_analysis` quando riceve `salary_expectations` o quando l'annuncio contiene un range esplicito.

**Tool schema**: Aggiungere `salary_analysis` come proprietà opzionale con struttura:
```
salary_analysis: {
  candidate_estimate: { min, max, source, basis }
  position_estimate: { min, max, source, basis }
  delta: "positive" | "neutral" | "negative"
  delta_percentage: string
  note: string
}
```

**Request body**: Leggere `salary_expectations` dal body della request e includerlo nel messaggio user all'AI.

### 2. Frontend `Nuova.tsx` (2 modifiche)

**Chiamata**: Fetch `salary_expectations` dal profilo utente e passarlo nel body di `ai-prescreen`.

**Componente `SalaryAnalysisCard`**: Nuova sezione dentro `StepVerifica`, renderizzata condizionalmente. Implementa barre proporzionali, badge fonte, delta colorato, disclaimer.

### File coinvolti

| File | Modifiche |
|------|-----------|
| `supabase/functions/ai-prescreen/index.ts` | Prompt + schema + body handling |
| `src/pages/Nuova.tsx` | Fetch salary, pass to API, render card |

