

# Fix: Skills renderizzate carattere per carattere

## Problema
Nella vista "Adattato" (Step 3), le competenze vengono mostrate un carattere alla volta in una griglia. Questo succede perche' l'AI a volte restituisce `skills.technical` come stringa (es. `"Management, Customer Experience"`) invece che come array `["Management", "Customer Experience"]`.

Il codice in `renderCV` fa:
```text
const all = [
  ...(skills.technical || []),
  ...(skills.soft || []),
  ...(skills.tools || []),
];
```

Quando si fa spread di una stringa (`[..."abc"]`), JavaScript produce `["a", "b", "c"]` — da qui i singoli caratteri.

## Soluzione

### 1. Sanitizzare gli array di skills in `renderCV` (`src/pages/Nuova.tsx`)

Aggiungere una funzione helper `ensureArray` che:
- Se il valore e' gia' un array, lo restituisce
- Se e' una stringa, la splitta per virgola e trima ogni elemento
- Altrimenti restituisce `[]`

Applicarla a `skills.technical`, `skills.soft`, `skills.tools` prima dello spread.

### 2. Validare l'output nell'edge function (`supabase/functions/ai-tailor/index.ts`)

Dopo aver applicato le patch al CV, validare che i campi skills siano sempre array. Se l'AI ha restituito una stringa, convertirla in array prima di inviare la risposta al frontend.

## File coinvolti

| File | Modifica |
|------|----------|
| `src/pages/Nuova.tsx` | Aggiungere `ensureArray()` helper nel `renderCV` per gestire skills stringa |
| `supabase/functions/ai-tailor/index.ts` | Validare che `tailoredCV.skills.*` siano array dopo `applyPatches` |

## Risultato
Le competenze verranno sempre renderizzate correttamente come chip, indipendentemente dal formato restituito dall'AI.

