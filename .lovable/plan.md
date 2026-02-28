

# Piano completo: Tailoring a due livelli + Approvazione interattiva modifiche

## Panoramica

Due macro-modifiche integrate nell'architettura esistente:

1. **Tailoring a due livelli** -- L'AI opera sia a livello strutturale (rimuovere/riordinare/condensare sezioni) sia a livello contenuto (riformulare). Il CV risultante e' conciso ed efficace.
2. **Approvazione/rifiuto per ogni modifica** -- Nello Step 2, l'utente vede ogni modifica suggerita e puo' approvare o rifiutare singolarmente. Solo le modifiche approvate vengono applicate al CV finale in Step 3.

---

## 1. Modifiche a `ai-tailor` (backend)

### 1a. System prompt: due livelli + sinteticita'

Aggiungere al prompt esistente due nuove sezioni:

```text
## TWO-LEVEL TAILORING

### Level 1 -- STRUCTURAL (what to keep/remove/reorder)
- REMOVE experiences completely irrelevant to the target role
- REORDER experiences by relevance to the job (most relevant first)
- CONDENSE verbose bullet lists (max 4-5 bullets per experience, keep only impactful ones)
- REMOVE irrelevant projects, certifications, or extra sections
- If education is not the candidate's strength for this role, keep it minimal

### Level 2 -- CONTENT (how to rewrite what remains)
- Summary: 2-3 sentences maximum, specific to this role
- Bullets: action verb + measurable result, one line each
- Skills: ordered by relevance, remove generic/obvious ones

## CONCISENESS RULE
Be as concise and effective as possible.
A well-targeted 1-page CV beats a generic 3-page CV.
Every word must earn its place. Remove filler, cliches, and redundancy.
If a section adds no value for THIS specific role, remove it entirely.
```

### 1b. Aggiornare le FUNDAMENTAL RULES

Sostituire la riga "You may ONLY modify: summary, description/bullets of experiences, skill ordering" con regole ampliate:

```text
- You CAN remove entire experience/education/project entries if irrelevant to the target role
- You CAN reorder entries by relevance
- You CAN reduce the number of bullets per experience
- You CAN remove entire extra_sections if not relevant
- You CANNOT invent new experiences, degrees, or certifications
- You CANNOT modify dates, company names, degree titles, grades
- You CANNOT touch personal data or photo_base64
```

### 1c. Aggiornare i valid paths per le patch

Cambiare l'istruzione sui valid paths da singoli campi ad array interi:

```text
Valid paths include full arrays: "experience", "education", "certifications", "projects", "extra_sections"
As well as individual fields: "summary", "experience[N].bullets", "skills.technical", etc.
When removing or reordering entries, return the entire array with entries removed/reordered.
```

### 1d. Nuovo campo nel tool schema: `structural_changes`

Aggiungere al tool schema per tracciare le modifiche strutturali:

```json
{
  "structural_changes": {
    "type": "array",
    "description": "List of structural changes made (removals, reorders, condensations)",
    "items": {
      "type": "object",
      "properties": {
        "action": { "type": "string", "enum": ["removed", "reordered", "condensed"] },
        "section": { "type": "string" },
        "item": { "type": "string", "description": "What was affected" },
        "reason": { "type": "string" }
      },
      "required": ["action", "section", "item", "reason"]
    }
  }
}
```

### 1e. Aggiungere `patch_path` al diff schema

Ogni entry nel `diff` deve puntare alla patch corrispondente:

```json
{
  "patch_path": {
    "type": "string",
    "description": "Corresponding path in tailored_patches for this change"
  }
}
```

### 1f. Mantenere `tailored_patches` nella risposta

Attualmente la riga `delete result.tailored_patches` rimuove le patch dalla risposta. Rimuovere questa riga per conservare sia `tailored_patches` che `tailored_cv` nella risposta al frontend.

---

## 2. Modifiche al frontend (`Nuova.tsx`)

### 2a. Aggiornare il tipo `TailorResult`

Aggiungere i nuovi campi:

```typescript
type TailorResult = {
  // ... campi esistenti ...
  tailored_patches?: Array<{ path: string; value: unknown }>;
  structural_changes?: Array<{
    action: "removed" | "reordered" | "condensed";
    section: string;
    item: string;
    reason: string;
  }>;
  diff: {
    section: string;
    index?: number;
    original: string;
    suggested: string;
    reason: string;
    patch_path?: string;  // NUOVO
  }[];
};
```

### 2b. Trasformare Step 2 (StepAnalisi) con approvazione interattiva

Dopo le card di score/skills/ATS, la sezione "Modifiche suggerite" diventa interattiva:

**Stato interno:**
- `diffDecisions: Record<number, "approved" | "rejected">` -- inizializzato con tutte le modifiche "approved" di default

**UI per ogni modifica:**
```text
+-----------------------------------------------------+
| SUMMARY                           [Approva] [Rifiuta]|
| --------------------------------------------------- |
| Originale: "Sono un professionista con..."           |
| (barrato, grigio)                                    |
|                                                      |
| Suggerito: "Software engineer con 3 anni di..."     |
| (verde)                                              |
|                                                      |
| Motivo: "Riformulato per il ruolo target"            |
+-----------------------------------------------------+
```

- Bottone CheckCircle (verde) = approvato (default)
- Bottone XCircle (rosso) = rifiutato
- Card rifiutata: opacita' ridotta, bordo rosso
- Sopra la lista: contatore "4/6 modifiche approvate"
- Bottoni batch: "Approva tutte" / "Rifiuta tutte"

**Sezione modifiche strutturali:**
Se presenti `structural_changes`, mostrarle prima dei diff come card informative:
- "Rimossa: Cameriere - Ristorante Da Mario" con motivo
- Ciascuna con bottoni approva/rifiuta

### 2c. Ricostruzione CV selettiva (passaggio Step 2 -> Step 3)

Quando l'utente clicca "Vedi il CV adattato":

1. Prendere il CV originale (dal master_cv gia' disponibile nel result)
2. Filtrare `tailored_patches` mantenendo solo quelle corrispondenti ai diff/structural_changes approvati (correlazione via `patch_path` o indice)
3. Applicare `applyPatches(originalCV, approvedPatches)` lato frontend (la funzione `applyPatches` e' gia' presente in `ai-tailor` -- va duplicata nel frontend)
4. Il risultato diventa il `tailored_cv` usato nello Step 3

Questo richiede anche che il frontend riceva il CV originale. Opzioni:
- Il backend gia' restituisce `master_cv_id` -- il frontend puo' fare un fetch dal DB
- Oppure aggiungere `original_cv` alla risposta di `ai-tailor`

Scelta: aggiungere `original_cv` alla risposta (senza `photo_base64`) per evitare un round-trip aggiuntivo.

### 2d. Aggiornamento del bottone "Vedi il CV adattato"

Il bottone passa il CV ricostruito (con solo le patch approvate) a Step 3 invece del `tailored_cv` completo.

---

## File coinvolti

| File | Modifica |
|------|----------|
| `supabase/functions/ai-tailor/index.ts` | Prompt a due livelli, sinteticita', `structural_changes` nel schema, `patch_path` nei diff, conservare `tailored_patches` e `original_cv` nella risposta |
| `src/pages/Nuova.tsx` | Tipo `TailorResult` aggiornato, stato `diffDecisions`, UI approvazione/rifiuto con contatore, rendering `structural_changes`, ricostruzione CV selettiva con `applyPatches` frontend, bottoni batch |

---

## Ordine di implementazione

1. Aggiornare il system prompt e il tool schema di `ai-tailor` (due livelli, sinteticita', `structural_changes`, `patch_path`, conservare patches + original_cv)
2. Aggiornare i tipi e lo stato in `Nuova.tsx` (TailorResult, diffDecisions)
3. Implementare l'UI di approvazione/rifiuto nello Step 2 con contatore e bottoni batch
4. Implementare `applyPatches` nel frontend e la ricostruzione selettiva nel passaggio Step 2 -> Step 3
5. Rendering delle `structural_changes` con approvazione nel Step 2

