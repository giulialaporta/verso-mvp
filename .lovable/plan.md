

## Problema

L'AI rimuove esperienze lavorative dal CV quando la posizione target è più junior, riducendo di fatto gli anni di esperienza visibili del candidato. Questo è controproducente: un candidato senior che si candida per una posizione junior deve comunque mostrare tutta la sua esperienza.

## Piano

### 1. Modificare il prompt di `ai-tailor` (SYSTEM_PROMPT_TAILOR)

Nella sezione "EXPERIENCE PROTECTION", sostituire le regole attuali con:

- **MAI rimuovere esperienze** — tutte le esperienze del candidato devono restare nel CV
- **MAI ridurre gli anni di esperienza** visibili
- Rimuovere l'azione "removed" dallo structural_changes enum
- Consentire solo: riordino per rilevanza, condensazione bullet, riscrittura contenuto
- Se il candidato è overqualified: valorizzare l'esperienza come punto di forza, non nasconderla

### 2. Rimuovere "removed" dal tool schema tailor

Nel `TOOL_SCHEMA_TAILOR`, cambiare l'enum di `structural_changes.action` da `["removed", "reordered", "condensed"]` a `["reordered", "condensed"]`.

### 3. Aggiornare il prompt di analisi (SYSTEM_PROMPT_ANALYZE)

Nella sezione seniority_match: se il candidato è più senior del ruolo, il `note` deve suggerire di valorizzare l'esperienza extra, non penalizzarla.

### 4. Rimuovere `limitExperiences` dai template di rendering

La funzione `limitExperiences` nel display (template-utils) taglia esperienze per ragioni di spazio PDF. Questo va mantenuto solo come ultima risorsa visiva ma **non** deve confondersi con il taglio AI. Il comportamento attuale è corretto (taglia solo in tier "extreme" per fitting), lo lascio invariato.

### File coinvolti

| File | Modifica |
|------|----------|
| `supabase/functions/ai-tailor/index.ts` | Riscrivere EXPERIENCE PROTECTION nel prompt tailor, rimuovere "removed" dall'enum structural_changes |

