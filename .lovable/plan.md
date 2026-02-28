
# Piano: Score prima, modifiche dopo conferma + CTA abbandono

## Problema attuale

Il wizard chiama `ai-tailor` che restituisce TUTTO in un colpo: score, analisi, E le modifiche al CV. L'utente vede score e modifiche insieme nello Step 2 (Analisi). Se lo score e' basso, ha gia' sprecato tempo e token AI per generare un CV inutile.

## Nuovo flusso

Il wizard passa da 4 a 5 step:

```text
Step 0: Annuncio (invariato)
Step 1: Verifica / Pre-screening (invariato)
Step 2: Score — solo analisi (score, ATS, skills, seniority). Nessuna modifica al CV.
         Se score <= 25%: CTA positiva "Investi le tue energie altrove"
         Se score > 25%: bottone "Genera il CV adattato"
Step 3: Modifiche — genera patches + approvazione interattiva (l'attuale sezione "Modifiche suggerite")
Step 4: CV Adattato — anteprima + export (invariato, era Step 3)
```

## Modifiche tecniche

### 1. Backend: `ai-tailor/index.ts` — aggiungere parametro `mode`

La funzione accetta un nuovo campo `mode` nel body:

- `mode: "analyze"` (default) — Il prompt AI produce SOLO: `match_score`, `ats_score`, `score_note`, `skills_present`, `skills_missing`, `seniority_match`, `ats_checks`, `learning_suggestions`, `suggestions`. NON produce `tailored_patches`, `diff`, `structural_changes`, `honest_score`. Usa un tool schema ridotto. Piu' veloce e meno token.

- `mode: "tailor"` — Il prompt AI produce SOLO: `tailored_patches`, `diff`, `structural_changes`, `honest_score`. Riceve anche le info dell'analisi precedente (skills_missing, score) per contestualizzare le modifiche.

Due tool schema separati: `TOOL_SCHEMA_ANALYZE` e `TOOL_SCHEMA_TAILOR`, con prompt leggermente diversi.

### 2. Frontend: `Nuova.tsx` — ristrutturazione step

**StepIndicator**: 5 step invece di 4: `["Annuncio", "Verifica", "Score", "Modifiche", "CV Adattato"]`

**Nuovo Step 2 (StepScore)**: Componente che mostra solo:
- Match Score animato con barra gradiente e score_note
- ATS Score e Seniority (griglia 2 colonne)
- Skills presenti e mancanti
- Learning suggestions
- ATS checks
- **Se score <= 25%**: Card con CTA positiva

```text
"Questo ruolo richiede competenze che al momento non hai.
 Verso ti consiglia di investire le tue energie su posizioni
 piu' in linea con il tuo profilo — dove puoi davvero brillare."

 [Cerca un'altra posizione]  [Procedi comunque]
```

- **Se score > 25%**: Bottone "Genera il CV adattato" che lancia la seconda chiamata AI

**Step 3 (StepModifiche)**: L'attuale sezione "Modifiche suggerite" di StepAnalisi, con le approvazioni interattive. Viene mostrata solo dopo che la seconda chiamata AI (mode=tailor) ritorna.

**Step 4**: L'attuale StepCVAdattato (invariato nel contenuto)

### 3. Stato nel wizard principale

Nuove variabili di stato:

```typescript
const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
const [tailoring, setTailoring] = useState(false);
```

Flusso:
- `handleVerificaProceed` chiama `ai-tailor` con `mode: "analyze"`, salva in `analyzeResult`, va a Step 2
- Step 2 mostra lo score. Se l'utente clicca "Genera CV", chiama `ai-tailor` con `mode: "tailor"`, va a Step 3
- Step 3 mostra le modifiche con approvazione interattiva, poi va a Step 4

### 4. Tipi aggiornati

```typescript
type AnalyzeResult = {
  match_score: number;
  score_note?: string;
  ats_score: number;
  skills_present: { label: string; has: boolean }[];
  skills_missing: { label: string; importance: string }[];
  seniority_match: { candidate_level: string; role_level: string; match: boolean; note: string };
  ats_checks: { check: string; label: string; status: "pass" | "warning" | "fail"; detail?: string }[];
  learning_suggestions?: LearningSuggestion[];
  suggestions?: { type: string; message: string }[];
  detected_language: string;
};

// TailorResult rimane per i dati delle modifiche (patches, diff, structural_changes, honest_score)
```

### 5. CTA abbandono — tono positivo

La soglia e' `match_score <= 25`. Il messaggio e' empatico e orientato all'azione:

```text
Titolo: "Forse non e' la posizione giusta"
Corpo: "Il match con questo ruolo e' basso. Non significa che non sei valido — 
        significa che le tue competenze brillano altrove. Concentra le energie
        su posizioni dove puoi fare davvero la differenza."
CTA primaria: "Cerca un'altra posizione" → naviga a /app/nuova (reset)
CTA secondaria: "Procedi comunque" → lancia la generazione del CV
```

## File coinvolti

| File | Modifica |
|------|----------|
| `supabase/functions/ai-tailor/index.ts` | Aggiungere parametro `mode`, due tool schema separati, due prompt, logica condizionale |
| `src/pages/Nuova.tsx` | StepIndicator a 5 step, nuovo StepScore, StepModifiche separato, CTA abbandono, flusso aggiornato |

## Ordine di implementazione

1. Backend: split `ai-tailor` in due modalita' (analyze / tailor)
2. Frontend: nuovo StepScore con CTA abbandono
3. Frontend: StepModifiche separato dalla vecchia StepAnalisi
4. Frontend: aggiornamento flusso principale e StepIndicator
5. Deploy edge function
