
# Match Score intelligente + eliminazione score_breakdown + lingua domande

## Panoramica

Tre interventi:
1. Aggiungere post-processing deterministico dello score nel backend con una nota sintetica (mai un breakdown tecnico)
2. Mostrare solo un commento breve sotto il Match Score (es. "Punteggio ridotto per 2 competenze essenziali mancanti")
3. Assicurarsi che le follow-up questions di ai-prescreen rispettino la lingua dell'annuncio

---

## 1. Backend: `ai-tailor/index.ts`

### 1a. Aggiungere `score_note` al tool schema

Aggiungere un campo nel tool schema:

```json
"score_note": {
  "type": "string",
  "description": "1-2 sentence explanation of the match score IN THE SAME LANGUAGE as the job posting. Explain key factors affecting the score."
}
```

Aggiungerlo anche ai `required`.

### 1b. Post-processing deterministico dopo la risposta AI

Dopo aver parsato il risultato AI (linea ~492), aggiungere la funzione `adjustScore`:

```text
Logica:
1. Contare skills_missing con importance === "essential" -> essentialMissing
2. Se essentialMissing >= 3: cap = 30
   Se essentialMissing === 2: cap = 40
   Se essentialMissing === 1: cap = 55
   Altrimenti: cap = 100
3. Se seniority_match.match === false:
   - Differenza di 2+ livelli: penalty = 15
   - Altrimenti: penalty = 5
4. Contare ats_checks con status === "fail": atsFails * 3
5. finalScore = min(AI_score, cap) - seniorityPenalty - atsPenalty
6. Clamp: min 5, max 98
7. Se il score e' stato modificato, generare una score_note sintetica
   (in italiano o inglese in base a detected_language)
```

La `score_note` generata dal backend sovrascrive quella dell'AI solo se il punteggio viene modificato. Se il punteggio resta invariato, usare la nota dell'AI.

Esempio di note generate:
- IT: "Punteggio ridotto: mancano 2 competenze essenziali per questo ruolo."
- EN: "Score reduced: 2 essential skills are missing for this role."
- IT: "Buon match complessivo, lieve penalita' per disallineamento seniority."

### 1c. NON esporre score_breakdown

Non aggiungere nessun campo `score_breakdown` alla risposta. Solo `match_score` (numero) e `score_note` (stringa).

---

## 2. Frontend: `Nuova.tsx`

### 2a. Aggiornare `TailorResult`

Aggiungere:
```typescript
score_note?: string;
```

### 2b. Mostrare la nota sotto il Match Score

Sotto la barra del Match Score (linea ~840, dopo la chiusura del progress bar), aggiungere:

```text
{result.score_note && (
  <p className="text-sm text-muted-foreground mt-2">{result.score_note}</p>
)}
```

Nessun breakdown tecnico, nessun dettaglio numerico. Solo il commento sintetico.

---

## 3. Lingua delle follow-up questions

Le domande vengono da `ai-prescreen/index.ts` che ha gia' la regola "Detect the language of the JOB POSTING. ALL output MUST be in that language." Questo copre le domande.

Per le label statiche del frontend ("Aiutaci a conoscerti meglio", "La tua risposta (facoltativa)..."), queste sono in italiano fisso. Dato che il sito e' in italiano, sono gia' corrette. Se in futuro si vuole i18n, si puo' aggiungere, ma per v1 il sito e' italiano.

Le label dei requisiti ("obbligatorio", "preferito", "gradito") nella sezione requirements_analysis sono hardcoded in italiano. Questo e' coerente col sito in italiano.

---

## File coinvolti

| File | Modifica |
|------|----------|
| `supabase/functions/ai-tailor/index.ts` | Aggiungere `score_note` al schema, funzione `adjustScore` post-AI, sovrascrivere score e nota se necessario |
| `src/pages/Nuova.tsx` | Aggiungere `score_note` al tipo, renderizzare sotto il Match Score |

## Ordine

1. Aggiornare il tool schema di ai-tailor con `score_note` + post-processing deterministico
2. Aggiornare tipo e UI in Nuova.tsx
3. Deploy edge function
