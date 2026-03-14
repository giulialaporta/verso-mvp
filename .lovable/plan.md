

# Fix: Tono di voce, stato candidature, rispetto lingua CV

## 3 problemi da risolvere

### 1. Tono di voce: prima persona singolare, mai plurale
Verso deve parlare in prima persona ("Sto analizzando...") e dare del "tu" all'utente. Ci sono stringhe con "stiamo", "abbiamo", "aiutaci" da correggere.

**File e modifiche:**
- `src/pages/Onboarding.tsx` riga 300: "Stiamo estraendo le informazioni" → "Sto estraendo le informazioni"
- `src/pages/Onboarding.tsx` riga 333: "Abbiamo trovato" → "Ho trovato"
- `src/components/wizard/StepVerifica.tsx` riga 137: "Aiutaci a conoscerti meglio" → "Aiutami a conoscerti meglio"
- `src/components/wizard/StepRevisione.tsx` riga 83: "Cosa abbiamo cambiato" → "Cosa ho cambiato"

### 2. Stato candidatura: sincronizzare con la scelta dell'utente
Quando l'utente seleziona uno stato nella pagina dettaglio e salva, lo stato viene aggiornato correttamente nel DB. Tuttavia `handleMarkSent` in `Nuova.tsx` imposta sempre `"inviata"` — questo è corretto perché l'azione è esplicita ("Ho inviato la candidatura").

Il problema potrebbe essere che nel `DetailContent.tsx` e `CandidaturaDetail.tsx` il salvataggio dello stato funziona già, ma il `drawerStatus` parte da `app.status.toLowerCase()`. Verifico che non ci siano disallineamenti: il codice è corretto, lo stato viene salvato e la lista viene invalidata. Nessun bug qui.

### 3. Lingua CV: rispettare l'override dell'utente
Il frontend passa `languageOverride` nel campo `analyze_context.detected_language` al tailor. Il prompt del tailor usa `detected_language` dal context per decidere la lingua del CV. Il flusso è:
- L'utente seleziona "English" nello Step 2
- `languageOverride` viene settato a `"en"`
- In `handleGenerateCv`, viene passato come `analyze_context.detected_language`

Il prompt dice: "CV CONTENT MUST be in the SAME LANGUAGE as the job posting (provided as detected_language)". Questo è corretto, ma il prompt fa riferimento al "job posting language" che potrebbe confondere il modello se l'annuncio è in italiano ma l'utente ha scelto inglese. Devo rendere esplicito nel prompt che `detected_language` è la lingua target scelta dall'utente, non necessariamente quella dell'annuncio.

**File e modifiche:**
- `supabase/functions/ai-tailor/index.ts`: nel `SYSTEM_PROMPT_TAILOR`, chiarire che `detected_language` nel context è la lingua TARGET scelta dall'utente e deve essere rispettata anche se l'annuncio è in un'altra lingua. Aggiungere nel `contextInfo` una riga esplicita tipo `- Target CV language (user override): ${analyze_context.detected_language}` e aggiungere al prompt una regola che dica "The detected_language in the PRIOR ANALYSIS CONTEXT is the user's chosen language for the CV. ALWAYS use this language for ALL CV content, even if the job posting is in a different language."

## Riepilogo modifiche

| File | Tipo |
|------|------|
| `src/pages/Onboarding.tsx` | Copy: 1a persona |
| `src/components/wizard/StepVerifica.tsx` | Copy: 1a persona |
| `src/components/wizard/StepRevisione.tsx` | Copy: 1a persona |
| `supabase/functions/ai-tailor/index.ts` | Prompt: rispetto lingua override |

