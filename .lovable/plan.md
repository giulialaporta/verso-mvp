

# Risposte strutturate + guardrail anti-allucinazione

## Problema

Le risposte dell'utente alle domande di follow-up sono testo libero iniettato verbatim in 2 prompt AI:

1. **`ai-tailor` mode=analyze** (linea 529-532): `Q: ... A: ...` → l'AI può gonfiare match_score basandosi su risposte vaghe
2. **`ai-tailor` mode=tailor** (linea 562-565): stesse risposte → l'AI può inventare bullet, metriche, esperienze

Nessun vincolo su cosa l'AI fa con le risposte. Una risposta tipo "sì, un po'" può diventare "3 anni di esperienza con risultati misurabili +15% conversion".

## Flusso attuale vs proposto

```text
ATTUALE:
  prescreen genera domande (testo libero)
       ↓
  utente scrive qualsiasi cosa
       ↓
  "Q: Hai esperienza Kubernetes? A: sì un po'"
       ↓
  analyze: può gonfiare score
  tailor: può inventare bullet
  
PROPOSTO:
  prescreen genera domande + opzioni strutturate
       ↓
  utente seleziona livello + dettaglio opzionale (max 200 char)
       ↓
  "Q: Hai esperienza Kubernetes? Level: some | Detail: deploy su EKS per un progetto"
       ↓
  analyze: regole per livello (expert +10, some +5, learning +2, none 0)
  tailor: regole per livello (expert: riscrivi bullet, some: solo skill list, none: niente)
```

## Self-challenge: perché le opzioni fisse funzionano meglio?

**Obiezione 1: "L'AI ignora le istruzioni del prompt"**
Rischio reale. Mitigazione: il vincolo non è solo nel prompt ma anche nel *formato dei dati*. Se l'AI riceve `Level: some` invece di "sì, ho un po' di esperienza con Kubernetes che ho usato per fare deploy", ha meno materiale da cui allucinare. Meno input = meno spazio per interpretazione creativa.

**Obiezione 2: "Le 4 opzioni fisse non coprono tutti i casi"**  
Per questo manteniamo il campo dettaglio opzionale (max 200 char). Ma il livello discreto è il vincolo primario — il dettaglio è secondario e il prompt dice esplicitamente di non basarsi su di esso per aggiungere contenuto.

**Obiezione 3: "Il prescreen AI potrebbe non generare opzioni sensate"**
Le opzioni non sono generate dall'AI: sono fisse nel frontend, basate sul `field` della domanda. L'AI genera solo la domanda — le opzioni sono sempre le stesse 4 livelli.

**Obiezione 4: "Cosa succede con le bozze vecchie che hanno risposte testuali?"**
Retrocompatibilità: se `answers[].level` è assente, fallback al comportamento attuale (testo libero passato tal quale). Nessun breaking change.

## Come le risposte vengono usate in ogni step

### Step 1→2 (analyze)

**Attuale** (linea 529-532 di ai-tailor): le risposte sono iniettate come testo libero. L'AI ha istruzione generica "use those answers to discover implicit skills or experience".

**Proposto**: il formato cambia da:
```
CANDIDATE FOLLOW-UP ANSWERS:
Q: Hai esperienza con Kubernetes?
A: sì, ho fatto qualcosa
```
a:
```
CANDIDATE FOLLOW-UP ANSWERS (STRUCTURED):
Q: Hai esperienza con Kubernetes?
Level: some (Uso occasionale)
Detail: "deploy su EKS per un progetto interno"
```

Regole aggiunte al prompt analyze:
- `expert`: la skill conta come "has" in skills_present. Può aumentare match_score fino a +8 punti per skill.
- `some`: la skill resta in skills_missing ma con severity ridotta a "minor". Può aumentare match_score fino a +3 punti.
- `learning`: nessun effetto su score. La skill resta in skills_missing. Può apparire in learning_suggestions come "parzialmente in corso".
- `none`: conferma il gap. Nessun cambiamento.

### Step 2→3 (tailor)

**Attuale** (linea 562-565 di ai-tailor): stesse risposte testo libero. Nessun vincolo su cosa l'AI fa.

**Proposto**: stesso formato strutturato + regole esplicite nel `SYSTEM_PROMPT_TAILOR`:

```
## FOLLOW-UP ANSWER RULES — ABSOLUTE
Answers are self-reported, UNVERIFIED claims. They constrain what you can do:

- Level "expert": 
  - You MAY add the skill to skills.technical/soft/tools
  - You MAY rewrite up to 2 existing bullets to highlight this skill
  - You MUST NOT create new experiences or new bullet points from scratch
  - You MUST NOT add years of experience or metrics not in the original CV

- Level "some":
  - You MAY add the skill to skills.technical/soft/tools  
  - You MAY mention it in the summary if relevant
  - You MUST NOT rewrite bullets to emphasize it
  - You MUST NOT create any new content based on it

- Level "learning":
  - You MAY add it to skills.tools with qualifier (e.g. "Kubernetes (in corso)")
  - Nothing else

- Level "none":
  - Do NOT use this answer in any way. It confirms a gap.

- If only "Detail" text is present (no Level — legacy format):
  - Treat as "some" level. Use detail for context only, never as source for new content.
```

### Impatto su honest_score

Il `honest_score` nel tailor verifica `skills_invented`. Le regole sopra rendono più chiaro cosa conta come "inventato":
- Aggiungere una skill che l'utente ha dichiarato come "expert" o "some" → **non** è invented
- Aggiungere una skill mai menzionata dall'utente → **è** invented
- Creare un bullet basato su un dettaglio della risposta → **è** invented (il dettaglio è contesto, non fonte)

## Modifiche tecniche

### 1. `src/components/wizard/wizard-types.ts`
Aggiungere al tipo `PrescreenResult.follow_up_questions`:
```typescript
follow_up_questions: {
  id: string;
  question: string;
  context: string;
  field: string;
  // NUOVO (opzionale per retrocompat)
  options?: { value: string; label: string }[];
}[];
```

### 2. `src/components/wizard/StepVerifica.tsx`
- State cambia da `Record<string, string>` a `Record<string, { level: string; detail: string }>`
- Per ogni domanda: 4 radio buttons con label fisse basate su `field`:
  - field=experience: "Sì, esperienza solida" / "Qualche esperienza" / "Solo formazione" / "No"
  - field=skills: "Sì, uso quotidiano" / "Uso occasionale" / "Studio/certificazione" / "No"
  - field=education: "Sì, completato" / "In corso" / "Formazione equivalente" / "No"
  - field=other: "Sì" / "In parte" / "No"
- Campo `Textarea` diventa input breve (max 200 char, placeholder "Dettaglio opzionale...")
- `handleProceed` formatta: `{ question, answer, level, detail }`

### 3. `src/pages/Nuova.tsx`
- `userAnswers` type aggiornato per includere `level` e `detail` opzionali
- Il formato passato a `ai-tailor` cambia: `user_answers` include `level` e `detail`

### 4. `supabase/functions/ai-tailor/index.ts`
- Formattazione risposte nel prompt: se la risposta ha `level`, usa formato strutturato
- Aggiungere sezione `FOLLOW-UP ANSWER RULES` al `SYSTEM_PROMPT_TAILOR` (come sopra)
- Aggiungere regole al `SYSTEM_PROMPT_ANALYZE` per limitare l'impatto delle risposte sul score
- Fallback: se la risposta non ha `level` (legacy), formato testo libero invariato

### 5. `supabase/functions/ai-prescreen/index.ts`
- Nessuna modifica necessaria: le opzioni sono gestite dal frontend, non generate dall'AI

## File modificati

| File | Tipo | Descrizione |
|------|------|-------------|
| `src/components/wizard/wizard-types.ts` | Modifica | Aggiunge `options` a follow_up_questions |
| `src/components/wizard/StepVerifica.tsx` | Modifica | Radio buttons + campo dettaglio breve |
| `src/pages/Nuova.tsx` | Modifica | Tipo userAnswers aggiornato |
| `supabase/functions/ai-tailor/index.ts` | Modifica | Guardrail nel prompt + formattazione strutturata |

Zero breaking change. Retrocompatibilità con bozze esistenti che hanno risposte testuali.

