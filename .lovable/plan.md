

# Piano completo: Recruiter onesto + Effetto WOW

## Panoramica

Implementazione combinata di due macro-feature:
- **Recruiter onesto**: pre-screening AI con dealbreaker, domande interattive, penalizzazione score
- **Effetto WOW**: animazione score con counter, editing inline del CV, suggerimenti risorse per skill gap

Il wizard passa da 3 a 4 step:

```text
Step 0: Annuncio (invariato)
Step 1: Verifica (NUOVO - dealbreaker + domande)
Step 2: Analisi (arricchita con risposte utente)
Step 3: CV Adattato (con editing inline)
```

---

## 1. Migrazione DB

Aggiungere colonna `user_answers jsonb` alla tabella `applications` per persistere le risposte alle domande del pre-screening.

---

## 2. Nuova edge function: `ai-prescreen`

`supabase/functions/ai-prescreen/index.ts`

- Modello: `google/gemini-2.5-flash` (veloce, economico)
- Input: `job_data` (dal job parsing) + CV dell'utente (caricato dal DB via auth)
- Output via tool calling:
  - `requirements_analysis`: array di requisiti classificati come `mandatory` / `preferred` / `nice_to_have`, con flag `candidate_has` e `gap_type` (`bridgeable` / `unbridgeable`)
  - `dealbreakers`: array di gap critici incolmabili (es. "5+ anni richiesti, 1 anno nel CV")
  - `follow_up_questions`: 3-5 domande mirate per scoprire competenze implicite
  - `overall_feasibility`: `low` / `medium` / `high`
  - `feasibility_note`: spiegazione breve

Il system prompt istruisce l'AI a:
- Riconoscere parole chiave mandatory ("must have", "required", "X+ years", "obbligatorio")
- Riconoscere parole chiave preferred ("nice to have", "preferred", "gradito")
- Generare domande solo per gap colmabili (non chiedere dell'esperienza se mancano 4 anni)
- Comportarsi come recruiter esperto e onesto

---

## 3. Modifiche a `ai-tailor`

- Nuovo campo nel body: `user_answers?: Array<{question: string, answer: string}>`
- Il prompt viene arricchito con una sezione "ADDITIONAL CONTEXT FROM CANDIDATE" contenente le risposte
- Il `match_score` viene penalizzato: se ci sono requisiti mandatory mancanti, il massimo possibile e' 40%
- Nuovo campo nel tool schema: `learning_suggestions` (array di `{skill, resource_name, url, type, duration}`) per suggerire risorse per skill mancanti essenziali

---

## 4. UI Step 1: Pre-screening (NUOVO)

Dopo Step 0 (annuncio confermato), il wizard chiama `ai-prescreen` e mostra:

**Se ci sono dealbreaker:**
- Card con bordo rosso, icona Warning
- Lista dei dealbreaker con spiegazione
- Indicatore feasibility (basso/medio/alto) colorato
- Tono: "Verso non ti impedisce di candidarti, ma vuole che tu sia consapevole."

**Domande interattive:**
- Card con le domande generate dall'AI
- Ogni domanda ha un campo Textarea per la risposta
- Le domande sono facoltative (l'utente puo' lasciare vuoto)
- Bottone "Prosegui con queste informazioni"

Le risposte vengono salvate in `applications.user_answers` e passate ad `ai-tailor`.

---

## 5. Animazione score con counter (Step 2)

- Il match score "conta" da 0 al valore finale con `requestAnimationFrame`
- La barra di progresso si riempie con timing `ease-out` su 800ms
- Ogni card dei risultati appare con stagger animation (Framer Motion, delay incrementale)
- Se score >= 80%: badge verde "Ottimo match"
- Se score <= 40%: badge rosso "Gap significativi"

---

## 6. Editing inline del CV (Step 3)

- Nella vista "Adattato", ogni sezione diventa cliccabile:
  - Summary: click per editare in textarea
  - Bullet points: click per editare singoli bullet
  - Skills: click per aggiungere/rimuovere tag
- Le modifiche aggiornano lo state `tailored_cv` in memoria
- Il PDF scaricato riflette le modifiche dell'utente
- Usa il componente `InlineEdit` gia' presente nel progetto

---

## 7. Suggerimenti risorse per skill gap (Step 2)

- Sotto le skill mancanti con importanza "essential", mostrare card cliccabili con:
  - Icona GraduationCap
  - Nome risorsa (es. "Python for Data Science - Coursera")
  - Tipo (corso/certificazione)
  - Durata stimata
  - Link diretto
- I dati vengono dall'AI (campo `learning_suggestions` in `ai-tailor`)

---

## File coinvolti

| File | Modifica |
|------|----------|
| `supabase/functions/ai-prescreen/index.ts` | **Nuovo** -- edge function pre-screening |
| `supabase/functions/ai-tailor/index.ts` | Accettare `user_answers`, `learning_suggestions`, penalizzazione score |
| `supabase/config.toml` | Aggiungere `[functions.ai-prescreen]` |
| `src/pages/Nuova.tsx` | Wizard a 4 step, nuovo Step "Verifica", animazione score, editing inline |
| Migrazione DB | Aggiungere `user_answers jsonb` a `applications` |

## Ordine di implementazione

1. Migrazione DB (`user_answers`)
2. Edge function `ai-prescreen`
3. Modifiche a `ai-tailor` (user_answers + learning_suggestions + penalizzazione)
4. UI Step "Verifica" (dealbreaker + domande)
5. Animazione score counter + stagger
6. Editing inline CV in Step 3
7. Suggerimenti risorse per skill gap

