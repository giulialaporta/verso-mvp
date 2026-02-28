
# Regola linguistica chiara: separazione CV vs UI

## Problema

La regola attuale dice "Language In = Language Out" -- tutto l'output segue la lingua dell'annuncio. Ma il sito e' in italiano, quindi quando l'annuncio e' in inglese, l'utente vede un mix confuso:
- ATS check descriptions in inglese (screenshot: "Many relevant keywords such as...")
- Seniority note in inglese ("The candidate's extensive experience...")
- Follow-up questions in inglese ("How have you typically approached...")
- Score note in inglese ("Score adjusted: 3 essential skills missing")

## Nuova regola: due livelli linguistici

| Livello | Lingua | Campi |
|---------|--------|-------|
| **CV content** (il CV adattato) | Lingua dell'annuncio | `tailored_patches` values, `summary`, bullets, skill labels |
| **Analisi/UI** (tutto il resto) | **Sempre italiano** | `score_note`, `seniority_match.note`, `ats_checks[].label/detail`, `diff[].reason`, `structural_changes[].reason/item`, `suggestions[].message`, `learning_suggestions[].resource_name/duration` |

## Modifiche

### 1. `ai-tailor/index.ts` -- System prompt

Sostituire la regola linguistica con:

```text
## CRITICAL RULE -- TWO-LEVEL LANGUAGE POLICY
1. Detect the language of the JOB POSTING. Report it in detected_language.
2. CV CONTENT (tailored_patches values, summary, bullets, skill labels, descriptions) 
   MUST be in the SAME LANGUAGE as the job posting.
3. ANALYSIS & UI TEXT (score_note, seniority_match.note, ats_checks label/detail, 
   diff reasons, structural_changes reason/item, suggestions, learning_suggestions) 
   MUST ALWAYS be in ITALIAN, regardless of the job posting language.
```

Aggiornare anche le `description` dei campi nello schema che attualmente dicono "IN THE SAME LANGUAGE as the job posting" -- cambiarle in "ALWAYS in Italian".

Aggiornare la funzione `adjustScore` per generare sempre note in italiano (rimuovere il branch inglese).

### 2. `ai-prescreen/index.ts` -- System prompt

Stessa regola: le follow-up questions e tutte le spiegazioni devono essere sempre in italiano. Cambiare:

```text
## CRITICAL RULE -- LANGUAGE
ALL analysis output (explanations, questions, notes, context, messages) MUST be in ITALIAN, 
regardless of the job posting language.
```

### 3. `adjustScore` in `ai-tailor` -- rimuovere branch EN

La funzione attualmente genera note in italiano o inglese in base a `detected_language`. Semplificarla per generare sempre in italiano.

## File coinvolti

| File | Modifica |
|------|----------|
| `supabase/functions/ai-tailor/index.ts` | Nuovo prompt bilingue, schema descriptions, adjustScore solo italiano |
| `supabase/functions/ai-prescreen/index.ts` | Prompt: output analisi sempre in italiano |
