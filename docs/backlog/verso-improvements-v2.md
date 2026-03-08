# Verso Improvements v2 — Specifiche per Lovable

> **Contesto:** questo documento contiene **17 stories** che migliorano sia il backend AI (Edge Functions) che il frontend UX dell'app Verso. Il wizard `/app/nuova` passa da 5 a 6 step, si aggiunge l'analisi retributiva, l'honest score diventa calcolato (non dichiarato dall'AI), e l'export diventa uno step vero del wizard.
>
> **Eseguire le stories in ordine.** Ogni story è un prompt autonomo. L'ordine è critico: le prime 9 stories sono backend (Edge Functions), le ultime 8 sono frontend.
>
> **Fase 1 (stories 1-3):** moduli shared — prerequisiti per tutto il resto.
> **Fase 2 (stories 4-9):** miglioramenti alle singole Edge Functions.
> **Fase 3 (stories 10-17):** modifiche frontend + database.

---

## Story 1 — `_shared/compact-cv.ts`: unificare compactCV

### Problema

`compactCV` è duplicata in `ai-prescreen` e `ai-tailor` con logiche diverse:
- `ai-tailor` (riga 22) filtra anche stringhe "None", "N/A", "n/d", "undefined"
- `ai-prescreen` (riga 117) non filtra queste stringhe

Il CV che arriva a `ai-prescreen` contiene rumore che `ai-tailor` non vedrebbe → risultati incoerenti.

### Cosa fare

**1. Creare `supabase/functions/_shared/compact-cv.ts`**

```typescript
/**
 * Compact CV utility — strips nulls, empty values, placeholder strings, and photo data.
 * Shared across all edge functions that process CV data.
 */

const PLACEHOLDER_VALUES = ["None", "none", "null", "N/A", "n/a", "undefined", "N/D", "n/d", "-", "—"];

export function compactCV(data: Record<string, unknown>): Record<string, unknown> {
  if (Array.isArray(data)) {
    const filtered = data
      .map((item) => (typeof item === "object" && item !== null ? compactCV(item as Record<string, unknown>) : item))
      .filter((item) => item !== null && item !== undefined && item !== "");
    return filtered.length > 0 ? (filtered as unknown as Record<string, unknown>) : (undefined as unknown as Record<string, unknown>);
  }
  if (typeof data === "object" && data !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === "photo_base64") continue;
      if (value === null || value === undefined || value === "") continue;
      if (typeof value === "string" && PLACEHOLDER_VALUES.includes(value.trim())) continue;
      if (Array.isArray(value) && value.length === 0) continue;
      const compacted = typeof value === "object" && value !== null
        ? compactCV(value as Record<string, unknown>)
        : value;
      if (compacted !== undefined && compacted !== null) {
        result[key] = compacted;
      }
    }
    return Object.keys(result).length > 0 ? result : (undefined as unknown as Record<string, unknown>);
  }
  return data;
}
```

**2. Aggiornare `ai-prescreen/index.ts`**

- Rimuovere la funzione `compactCV` locale (righe 106-129)
- Aggiungere import: `import { compactCV } from "../_shared/compact-cv.ts";`

**3. Aggiornare `ai-tailor/index.ts`**

- Rimuovere la funzione `compactCV` locale (righe 10-34)
- Aggiungere import: `import { compactCV } from "../_shared/compact-cv.ts";`

### Criteri di accettazione

- [ ] File `_shared/compact-cv.ts` creato con la versione completa (con filtro placeholder)
- [ ] `ai-prescreen` importa da `_shared` e non ha più `compactCV` locale
- [ ] `ai-tailor` importa da `_shared` e non ha più `compactCV` locale
- [ ] Le funzioni continuano a funzionare correttamente dopo la modifica

---

## Story 2 — `_shared/ai-fetch.ts`: retry con backoff e fallback model

### Problema

Se l'AI gateway restituisce un errore 500 o timeout, la funzione fallisce immediatamente. Non c'è retry con backoff né fallback su modello alternativo.

### Cosa fare

**1. Creare `supabase/functions/_shared/ai-fetch.ts`**

```typescript
/**
 * Resilient AI fetch with retry and fallback model.
 */

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const FALLBACK_MODEL = "google/gemini-2.0-flash";
const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 3000]; // ms

interface AIFetchOptions {
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: unknown }>;
  tools?: unknown[];
  tool_choice?: unknown;
}

interface AIFetchResult {
  data: Record<string, unknown>;
  model_used: string;
  retries: number;
}

export async function aiFetch(options: AIFetchOptions): Promise<AIFetchResult> {
  const { apiKey, model, messages, tools, tool_choice } = options;

  let lastError: Error | null = null;
  let retries = 0;

  // Try primary model with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, tools, tool_choice }),
      });

      // Non-retryable errors
      if (response.status === 401 || response.status === 402 || response.status === 429) {
        const errText = await response.text();
        throw new AIError(response.status, errText);
      }

      if (response.ok) {
        return { data: await response.json(), model_used: model, retries: attempt };
      }

      // Retryable error (500, 502, 503, 504)
      lastError = new Error(`AI returned ${response.status}`);
      retries = attempt + 1;
    } catch (e) {
      if (e instanceof AIError) throw e;
      lastError = e instanceof Error ? e : new Error(String(e));
      retries = attempt + 1;
    }

    // Wait before retry (except after last attempt)
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
    }
  }

  // Try fallback model (single attempt)
  if (model !== FALLBACK_MODEL) {
    console.warn(`Primary model ${model} failed after ${retries} attempts. Trying fallback: ${FALLBACK_MODEL}`);
    try {
      const response = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: FALLBACK_MODEL, messages, tools, tool_choice }),
      });

      if (response.ok) {
        return { data: await response.json(), model_used: FALLBACK_MODEL, retries };
      }
    } catch {
      // Fallback also failed
    }
  }

  throw lastError || new Error("AI request failed after all retries");
}

export class AIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AIError";
  }
}
```

**2. Integrare in ogni funzione**

Sostituire le chiamate `fetch` dirette all'AI gateway con `aiFetch`. Esempio per `parse-cv`:

```typescript
import { aiFetch, AIError } from "../_shared/ai-fetch.ts";

// PRIMA:
const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", { ... });

// DOPO:
try {
  const { data: aiData, model_used } = await aiFetch({
    apiKey: LOVABLE_API_KEY,
    model: "google/gemini-2.5-flash",
    messages: [...],
    tools: [...],
    tool_choice: { type: "function", function: { name: "extract_cv_data" } }
  });
  console.log(`AI response from model: ${model_used}`);
  // ... rest of processing
} catch (e) {
  if (e instanceof AIError) {
    if (e.status === 429) return new Response(...);
    if (e.status === 402) return new Response(...);
  }
  throw e;
}
```

Fare la stessa cosa per `scrape-job`, `ai-prescreen`, `ai-tailor`.

### Criteri di accettazione

- [ ] File `_shared/ai-fetch.ts` creato con retry (max 2, backoff 1s/3s) e fallback model
- [ ] Errori 401/402/429 non vengono retried (non-retryable)
- [ ] Errori 500/502/503/504 vengono retried fino a 2 volte
- [ ] Se il modello primario fallisce dopo i retry → tentativo con `google/gemini-2.0-flash`
- [ ] Tutte e 4 le funzioni usano `aiFetch` al posto di `fetch` diretto
- [ ] Log del modello effettivamente usato nella response

---

## Story 3 — `_shared/validate-output.ts`: validazione schema output AI

### Problema

Nessuna delle 4 funzioni valida lo schema dell'output AI. Se il modello restituisce un JSON con campi mancanti, tipi sbagliati, o struttura corrotta, viene passato al frontend senza controlli.

### Cosa fare

**1. Creare `supabase/functions/_shared/validate-output.ts`**

```typescript
/**
 * Lightweight output validation for AI responses.
 * Checks required fields and basic type constraints.
 */

interface ValidationRule {
  field: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
}

interface ValidationResult {
  valid: boolean;
  missing: string[];
  typeErrors: string[];
}

export function validateOutput(data: Record<string, unknown>, rules: ValidationRule[]): ValidationResult {
  const missing: string[] = [];
  const typeErrors: string[] = [];

  for (const rule of rules) {
    const value = data[rule.field];

    if (value === undefined || value === null) {
      if (rule.required) missing.push(rule.field);
      continue;
    }

    if (rule.type === "array" && !Array.isArray(value)) {
      typeErrors.push(`${rule.field}: expected array, got ${typeof value}`);
    } else if (rule.type !== "array" && typeof value !== rule.type) {
      typeErrors.push(`${rule.field}: expected ${rule.type}, got ${typeof value}`);
    }
  }

  return {
    valid: missing.length === 0 && typeErrors.length === 0,
    missing,
    typeErrors
  };
}
```

**2. Definire regole per ogni funzione**

```typescript
// parse-cv
export const PARSE_CV_RULES: ValidationRule[] = [
  { field: "personal", type: "object", required: true },
  { field: "summary", type: "string", required: true },
  { field: "experience", type: "array", required: false },
  { field: "education", type: "array", required: false },
  { field: "skills", type: "object", required: false },
];

// scrape-job
export const SCRAPE_JOB_RULES: ValidationRule[] = [
  { field: "company_name", type: "string", required: true },
  { field: "role_title", type: "string", required: true },
  { field: "description", type: "string", required: true },
  { field: "key_requirements", type: "array", required: true },
  { field: "required_skills", type: "array", required: true },
];

// ai-prescreen
export const PRESCREEN_RULES: ValidationRule[] = [
  { field: "detected_language", type: "string", required: true },
  { field: "requirements_analysis", type: "array", required: true },
  { field: "dealbreakers", type: "array", required: true },
  { field: "follow_up_questions", type: "array", required: true },
  { field: "overall_feasibility", type: "string", required: true },
  { field: "feasibility_note", type: "string", required: true },
];

// ai-tailor analyze
export const ANALYZE_RULES: ValidationRule[] = [
  { field: "detected_language", type: "string", required: true },
  { field: "match_score", type: "number", required: true },
  { field: "ats_score", type: "number", required: true },
  { field: "skills_present", type: "array", required: true },
  { field: "skills_missing", type: "array", required: true },
  { field: "seniority_match", type: "object", required: true },
  { field: "ats_checks", type: "array", required: true },
];

// ai-tailor tailor
export const TAILOR_RULES: ValidationRule[] = [
  { field: "structural_changes", type: "array", required: true },
  { field: "tailored_patches", type: "array", required: true },
  { field: "honest_score", type: "object", required: true },
  { field: "diff", type: "array", required: true },
];
```

**3. Integrare la validazione in ogni funzione**

Dopo il parsing della risposta AI (dove oggi c'è il `JSON.parse`), aggiungere:

```typescript
import { validateOutput, PARSE_CV_RULES } from "../_shared/validate-output.ts";

// ... dopo aver ottenuto parsedCV ...

const validation = validateOutput(parsedCV, PARSE_CV_RULES);
if (!validation.valid) {
  console.error("AI output validation failed:", validation);
  // Log ma non bloccare — restituisci comunque il risultato con un warning
}
```

> **Nota:** La validazione logga ma **non blocca**. Un output parziale è meglio di nessun output. Se `match_score` o `ats_score` sono undefined → default a 0.

### Criteri di accettazione

- [ ] File `_shared/validate-output.ts` creato con `validateOutput()` e regole per tutte e 4 le funzioni
- [ ] Ogni funzione importa e chiama `validateOutput` dopo il parsing AI
- [ ] Campi mancanti vengono loggati come warning (non bloccano la response)
- [ ] Se `match_score` o `ats_score` sono undefined → default a 0

---

## Story 4 — `parse-cv`: few-shot examples, sinonimi, regole estrazione

### Problema

Il system prompt di `parse-cv` elenca i campi da estrarre ma non dà guidance su situazioni ambigue. Il modello perde campi con CV non standard (tabelle, colonne affiancate, titoli di sezione in lingue diverse, lingue in formati eterogenei).

### Cosa fare

Aggiungere i seguenti blocchi al system prompt di `parse-cv`, dopo la riga `RULES:`:

**1. Section mapping multilingua**

```
## SECTION MAPPING — Recognize these section titles in ANY language:
- Experience = "Esperienze", "Esperienze professionali", "Percorso professionale", "Work Experience", "Employment History", "Professional Experience", "Berufserfahrung", "Expérience professionnelle", "Experiencia laboral"
- Education = "Istruzione", "Formazione", "Titoli di studio", "Percorso formativo", "Education", "Academic Background", "Ausbildung", "Formation", "Educación"
- Skills = "Competenze", "Competenze tecniche", "Skills", "Core Competencies", "Fähigkeiten", "Compétences", "Habilidades"
- Languages = "Lingue", "Conoscenze linguistiche", "Languages", "Sprachen", "Langues", "Idiomas"
- Certifications = "Certificazioni", "Attestati", "Abilitazioni", "Certifications", "Licenses", "Zertifikate"
- Projects = "Progetti", "Projects", "Portfolio", "Projekte"
```

**2. Regola layout a colonne**

```
## MULTI-COLUMN LAYOUT
If the CV has a two-column or multi-column layout:
- Read the MAIN column first (usually the wider one, typically on the right)
- Then read the SIDEBAR column (usually narrower, typically on the left)
- The sidebar often contains: personal info, skills, languages, certifications
- The main column often contains: experience, education, projects
- Do NOT skip sidebar content — it often contains skills and languages
```

**3. Separazione description/bullets**

```
## DESCRIPTION vs BULLETS separation rules:
- If text uses bullet markers (•, -, *, ▸, ▹, ◦, ►) → extract as "bullets"
- If text is continuous paragraph(s) with NO bullet markers → extract as "description"
- If text MIXES paragraphs and bullets → put paragraphs in "description" and bulleted items in "bullets"
- NEVER duplicate: the same text must NOT appear in both fields
```

**4. Normalizzazione lingue/CEFR**

```
## LANGUAGE LEVEL NORMALIZATION
Always extract language proficiency and map to CEFR when possible:
- "Native" / "Madrelingua" / "Muttersprache" / "Langue maternelle" → level: "C2", descriptor: "Madrelingua"
- "Fluent" / "Fluente" / "Fließend" / "Courant" → level: "C1"
- "Advanced" / "Avanzato" / "Fortgeschritten" → level: "B2-C1"
- "Intermediate" / "Intermedio" / "Mittelstufe" / "Intermédiaire" → level: "B1-B2"
- "Basic" / "Base" / "Grundkenntnisse" / "Débutant" / "Scolastico" → level: "A1-A2"
- If an explicit CEFR level is given (e.g. "B2"), use it directly
- Always populate BOTH "level" (CEFR code) and "descriptor" (original text)
```

**5. Few-shot example**

```
## EXAMPLE — Ambiguous CV extraction

INPUT (CV excerpt):
"ESPERIENZE LAVORATIVE
Azienda ABC — Milano | Sviluppatore Full Stack | Mar 2021 – Presente
Sviluppo e manutenzione di applicazioni web enterprise.
• Migrazione del monolite a microservizi (Node.js, Docker)
• Riduzione tempi di deploy del 40% tramite CI/CD pipeline
• Coordinamento team di 3 sviluppatori junior

LINGUE
Italiano: madrelingua
Inglese: ottimo (C1)
Francese: base"

EXPECTED OUTPUT:
{
  "experience": [{
    "role": "Sviluppatore Full Stack",
    "company": "Azienda ABC",
    "location": "Milano",
    "start": "Mar 2021",
    "end": "",
    "current": true,
    "description": "Sviluppo e manutenzione di applicazioni web enterprise.",
    "bullets": [
      "Migrazione del monolite a microservizi (Node.js, Docker)",
      "Riduzione tempi di deploy del 40% tramite CI/CD pipeline",
      "Coordinamento team di 3 sviluppatori junior"
    ]
  }],
  "skills": {
    "languages": [
      { "language": "Italiano", "level": "C2", "descriptor": "madrelingua" },
      { "language": "Inglese", "level": "C1", "descriptor": "ottimo" },
      { "language": "Francese", "level": "A2", "descriptor": "base" }
    ]
  }
}
```

**6. Regola null handling**

```
## NULL HANDLING
- If a field is genuinely not present in the CV, set it to null (not empty string "")
- Only use empty string "" if the CV explicitly shows the field but it's blank
- This applies to: grade, honors, program, publication, location, linkedin, website
```

### Criteri di accettazione

- [ ] Il prompt include il blocco SECTION MAPPING con sinonimi multilingua
- [ ] Il prompt include la regola MULTI-COLUMN LAYOUT
- [ ] Il prompt include le regole DESCRIPTION vs BULLETS
- [ ] Il prompt include la regola LANGUAGE LEVEL NORMALIZATION
- [ ] Il prompt include un few-shot example
- [ ] Il prompt include la regola NULL HANDLING

---

## Story 5 — `scrape-job`: upgrade modello + campi extra + pulizia HTML

### Problema

`scrape-job` usa `google/gemini-2.5-flash-lite`, un modello troppo debole per annunci complessi. Mancano campi utili per il seniority match e l'analisi retributiva: `seniority_level`, `salary_range`, `industry`.

### Cosa fare

**1. Cambiare modello** in `scrape-job/index.ts` (riga 175):

```
// PRIMA
model: "google/gemini-2.5-flash-lite"

// DOPO
model: "google/gemini-2.5-flash"
```

La cache a 7 giorni ammortizza l'aumento di costo.

**2. Aggiungere regola per requisiti impliciti nel system prompt:**

```
## IMPLICIT REQUIREMENTS
Deduce implicit requirements from context when clearly inferable:
- International team / global company / foreign HQ → language requirement (specify which)
- "Travel required" / multiple office locations → willingness to travel
- Startup / fast-paced environment → adaptability, autonomy
- "X+ years" in any form → extract as key requirement with the exact number
Do NOT invent requirements — only extract what is clearly implied by the text.
```

**3. Aggiungere campi allo schema tool** `extract_job_data` (NON aggiungerli ai `required`):

```javascript
seniority_level: {
  type: "string",
  enum: ["internship", "junior", "mid", "senior", "lead", "manager", "director", "executive"],
  description: "Inferred seniority level from job title, requirements, and years of experience mentioned"
},
salary_range: {
  type: "string",
  description: "Salary range if mentioned in the posting (preserve original format and currency)"
},
industry: {
  type: "string",
  description: "Industry or sector (e.g., 'fintech', 'healthcare', 'e-commerce')"
}
```

**4. Migliorare la pulizia HTML** (righe 94-103). Aggiungere rimozione di nav/header/footer:

```javascript
jobText = html
  .replace(/<nav[\s\S]*?<\/nav>/gi, "")
  .replace(/<header[\s\S]*?<\/header>/gi, "")
  .replace(/<footer[\s\S]*?<\/footer>/gi, "")
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .replace(/<style[\s\S]*?<\/style>/gi, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/\s+/g, " ")
  .trim();
```

### Criteri di accettazione

- [ ] Modello cambiato a `google/gemini-2.5-flash`
- [ ] System prompt include regola IMPLICIT REQUIREMENTS
- [ ] Schema include `seniority_level`, `salary_range`, `industry` (opzionali)
- [ ] Pulizia HTML migliorata (rimozione nav/header/footer)

---

## Story 6 — `ai-prescreen` e `ai-tailor`: chiarimento language policy

### Problema

La policy linguistica è definita diversamente in ogni funzione. Quando un utente ha un CV in italiano e si candida per un annuncio in inglese, il modello a volte sbaglia lingua (specie con annunci bilingui).

### Cosa fare

**1. Aggiungere esempi espliciti in `ai-prescreen`** (dopo la regola lingua):

```
## LANGUAGE EXAMPLES
- CV in Italian + Job posting in English → ALL output in Italian (dealbreakers, questions, notes)
- CV in English + Job posting in Italian → ALL output in Italian
- CV in German + Job posting in German → ALL output in Italian
The rule is simple: this is an Italian product. Analysis is ALWAYS in Italian. No exceptions.
```

**2. Aggiungere esempi espliciti in `ai-tailor` (analyze):**

```
## LANGUAGE EXAMPLES
- CV in Italian + Job posting in English:
  - score_note: in Italian ("Il candidato ha buone competenze tecniche ma...")
  - suggestions: in Italian ("Aggiungere certificazione AWS")
  - skills labels: in English (preserve job posting keywords for ATS matching)
- CV in English + Job posting in Italian:
  - score_note: in Italian
  - skills labels: in Italian (preserve job posting keywords)
```

**3. Aggiungere esempi espliciti in `ai-tailor` (tailor):**

```
## LANGUAGE EXAMPLES
- Job posting in English → ALL CV content patches in English:
  - summary: "Experienced full-stack developer..."
  - bullets: "Reduced deployment time by 40%..."
  - skills: ["React", "Node.js", "Docker"]
- Job posting in Italian → ALL CV content patches in Italian:
  - summary: "Sviluppatore full-stack con esperienza..."
  - bullets: "Riduzione del 40% dei tempi di deploy..."
- diff reasons and structural_changes reasons → ALWAYS in Italian:
  - "Rimossa esperienza non rilevante per il ruolo"
  - "Riformulato bullet con verbo d'azione e risultato misurabile"
```

### Criteri di accettazione

- [ ] Ogni funzione ha esempi concreti di language policy nel prompt
- [ ] Testato con: CV italiano + annuncio inglese → CV tailored in inglese, analisi in italiano
- [ ] Testato con: CV inglese + annuncio italiano → CV tailored in italiano, analisi in italiano

---

## Story 7 — `ai-tailor`: score adjustment basato su severity AI

### Problema

La funzione `adjustScore` in `ai-tailor` (righe 349-382) applica cap deterministici basati solo sul conteggio delle skill essenziali mancanti, senza considerare la gravità: non distingue "Python mancante per un ruolo Python" da "Excel mancante per un ruolo developer".

### Cosa fare

**1. Aggiungere `severity` allo schema `skills_missing` in `TOOL_SCHEMA_ANALYZE`:**

```javascript
skills_missing: {
  type: "array",
  items: {
    type: "object",
    properties: {
      label: { type: "string" },
      importance: { type: "string", enum: ["essential", "important", "nice_to_have"] },
      severity: {
        type: "string",
        enum: ["critical", "moderate", "minor"],
        description: "How much this gap impacts candidacy. critical = role cannot be performed without it. moderate = significant disadvantage but learnable. minor = gap is cosmetic or easily bridged."
      },
      years_to_bridge: {
        type: "string",
        description: "Estimated time to acquire this skill (e.g., '3-6 months', '1-2 years', 'not bridgeable')"
      }
    },
    required: ["label", "importance", "severity"]
  }
}
```

**2. Aggiungere istruzione nel system prompt** `SYSTEM_PROMPT_ANALYZE` (dopo `## SCORE PENALIZATION FOR MANDATORY GAPS`):

```
## SKILL GAP SEVERITY CLASSIFICATION
For each missing skill, assess severity honestly:
- **critical**: The role CANNOT be performed without this skill. Example: "React" for a "React Developer" role, "5+ years experience" when candidate has 1.
- **moderate**: Significant gap but the skill can be learned within 6-12 months, OR the candidate has transferable skills. Example: "Docker" for a backend role where candidate knows other containerization.
- **minor**: Nice-to-have skill, or the candidate likely has it implicitly. Example: "Git" for any developer, "Microsoft Office" for an office role.
```

**3. Riscrivere `adjustScore` per usare severity:**

```javascript
function adjustScore(r: Record<string, unknown>): void {
  const skillsMissing = Array.isArray(r.skills_missing)
    ? r.skills_missing as Array<{ label: string; importance: string; severity?: string }>
    : [];

  // Count by severity
  const criticalMissing = skillsMissing.filter(s => s.importance === "essential" && s.severity === "critical").length;
  const moderateMissing = skillsMissing.filter(s => s.importance === "essential" && s.severity === "moderate").length;
  const essentialNoSeverity = skillsMissing.filter(s => s.importance === "essential" && !s.severity).length;

  // Cap based on critical gaps (non-negotiable)
  let cap = 100;
  if (criticalMissing >= 3) cap = 25;
  else if (criticalMissing === 2) cap = 35;
  else if (criticalMissing === 1) cap = 45;

  // Moderate gaps reduce cap less aggressively
  if (moderateMissing >= 2) cap = Math.min(cap, 60);
  else if (moderateMissing === 1) cap = Math.min(cap, 70);

  // Backward compatibility: essential skills without severity (old behavior)
  if (essentialNoSeverity >= 2) cap = Math.min(cap, 40);
  else if (essentialNoSeverity === 1) cap = Math.min(cap, 55);

  // Seniority penalty
  const seniority = r.seniority_match as { candidate_level?: string; role_level?: string; match?: boolean } | undefined;
  const levels = ["junior", "mid", "senior", "lead", "executive"];
  let seniorityPenalty = 0;
  if (seniority && seniority.match === false) {
    const cIdx = levels.indexOf(seniority.candidate_level || "");
    const rIdx = levels.indexOf(seniority.role_level || "");
    const gap = (cIdx >= 0 && rIdx >= 0) ? Math.abs(cIdx - rIdx) : 0;
    if (gap >= 3) seniorityPenalty = 20;
    else if (gap >= 2) seniorityPenalty = 12;
    else if (gap === 1) seniorityPenalty = 5;
  }

  // ATS penalty
  const atsChecks = Array.isArray(r.ats_checks) ? r.ats_checks as Array<{ status: string }> : [];
  const atsFails = atsChecks.filter(c => c.status === "fail").length;
  const atsPenalty = atsFails * 3;

  const aiScore = typeof r.match_score === "number" ? r.match_score : 50;
  const finalScore = Math.max(5, Math.min(98, Math.min(aiScore, cap) - seniorityPenalty - atsPenalty));

  if (finalScore !== aiScore) {
    const parts: string[] = [];
    if (criticalMissing > 0) parts.push(`${criticalMissing} competenz${criticalMissing === 1 ? "a critica mancante" : "e critiche mancanti"}`);
    if (moderateMissing > 0) parts.push(`${moderateMissing} competenz${moderateMissing === 1 ? "a importante mancante" : "e importanti mancanti"}`);
    if (essentialNoSeverity > 0) parts.push(`${essentialNoSeverity} competenz${essentialNoSeverity === 1 ? "a essenziale mancante" : "e essenziali mancanti"}`);
    if (seniorityPenalty > 0) parts.push("disallineamento seniority");
    if (atsPenalty > 0) parts.push(`${atsFails} check ATS non superat${atsFails === 1 ? "o" : "i"}`);
    r.score_note = `Punteggio adeguato: ${parts.join(", ")}.`;
    r.match_score = finalScore;
  }
}
```

### Criteri di accettazione

- [ ] Lo schema `skills_missing` include `severity` (critical/moderate/minor) e `years_to_bridge`
- [ ] Il system prompt include le regole di classificazione severity
- [ ] `adjustScore` usa severity per calibrare i cap
- [ ] Backward compatibility mantenuta (skill senza severity funzionano come prima)

---

## Story 8 — `ai-tailor`: validazione patches e protezione integrità CV

### Problema

Il sistema di patches in `ai-tailor` (funzione `applyPatches`, righe 37-76) è fragile: path con indice fuori range creano nodi undefined, `applyPatches` crea nodi intermedi se non esistono, e non c'è limite sulla quantità di modifiche.

### Cosa fare

**1. Riscrivere `applyPatches` con validazione path:**

```typescript
function applyPatches(
  original: Record<string, unknown>,
  patches: Array<{ path: string; value: unknown }>
): { result: Record<string, unknown>; skipped: string[] } {
  const result = JSON.parse(JSON.stringify(original));
  const skipped: string[] = [];

  for (const patch of patches) {
    const { path, value } = patch;
    const segments = path.replace(/\[(\d+)\]/g, ".$1").split(".");

    // Validate: check that parent path exists
    let target: unknown = result;
    let valid = true;
    for (let i = 0; i < segments.length - 1; i++) {
      if (target === null || target === undefined || typeof target !== "object") {
        console.warn(`applyPatches: invalid parent path "${path}" at segment "${segments[i]}"`);
        skipped.push(path);
        valid = false;
        break;
      }
      const seg = segments[i];
      const idx = Number(seg);
      if (!isNaN(idx)) {
        const arr = target as unknown[];
        if (!Array.isArray(arr) || idx >= arr.length) {
          console.warn(`applyPatches: array index out of bounds "${path}" — index ${idx}, length ${(arr as unknown[])?.length}`);
          skipped.push(path);
          valid = false;
          break;
        }
        target = arr[idx];
      } else {
        const obj = target as Record<string, unknown>;
        if (obj[seg] === undefined && i < segments.length - 2) {
          console.warn(`applyPatches: intermediate path "${seg}" does not exist in "${path}"`);
          skipped.push(path);
          valid = false;
          break;
        }
        if (obj[seg] === undefined) {
          const nextSeg = segments[i + 1];
          obj[seg] = !isNaN(Number(nextSeg)) ? [] : {};
        }
        target = obj[seg];
      }
    }
    if (!valid || target === null || target === undefined || typeof target !== "object") continue;

    const lastSeg = segments[segments.length - 1];
    const lastIdx = Number(lastSeg);
    if (!isNaN(lastIdx)) {
      (target as Record<string, unknown>)[lastIdx as unknown as string] = value;
    } else {
      (target as Record<string, unknown>)[lastSeg] = value;
    }
  }

  return { result, skipped };
}
```

**2. Aggiungere change-ratio check** dopo aver applicato le patches:

```typescript
function calculateChangeRatio(original: string, patched: string): number {
  const originalLen = original.length;
  const patchedLen = patched.length;
  const diff = Math.abs(originalLen - patchedLen);
  return diff / originalLen;
}

// Dopo applyPatches:
const originalJson = JSON.stringify(compactedCV);
const patchedJson = JSON.stringify(tailoredCV);
const changeRatio = calculateChangeRatio(originalJson, patchedJson);

if (changeRatio > 0.6) {
  console.warn(`High change ratio: ${(changeRatio * 100).toFixed(1)}% — patches may be too aggressive`);
}
```

**3. Aggiungere `skipped_patches` alla response** del tailor mode:

```typescript
if (skipped.length > 0) {
  result.skipped_patches = skipped;
}
```

### Criteri di accettazione

- [ ] `applyPatches` valida che i path parent esistano prima di creare nodi
- [ ] Array index out of bounds → patch skippata (non crash)
- [ ] Change ratio > 60% → warning in console
- [ ] Response include `skipped_patches` se ci sono patch non applicate

---

## Story 9 — `parse-cv`: miglioramento estrazione foto

### Problema

L'estrazione foto in `parse-cv` (`extractFirstImage`, righe 10-39) cerca magic bytes JPEG/PNG nel binario del PDF. PDF con immagini in stream compressi non vengono trovate, e non c'è euristica per distinguere "foto persona" da "logo".

### Cosa fare

**1. Delegare il rilevamento foto all'AI.** Aggiungere al system prompt:

```
## PHOTO DETECTION
- has_photo: set to true ONLY if the CV contains a visible photograph of a person (headshot, portrait, ID photo)
- Do NOT set has_photo to true for logos, icons, decorative images, or QR codes
- If has_photo is true, also set photo_position to indicate where the photo is located: "top-left", "top-right", "top-center", or "side-left"
```

Aggiungere `photo_position` allo schema tool:

```javascript
photo_position: {
  type: "string",
  enum: ["top-left", "top-right", "top-center", "side-left"],
  description: "Position of the candidate's photo in the CV layout"
}
```

**2. Migliorare l'euristica di estrazione binaria** (`extractFirstImage`):

```typescript
function extractFirstImage(bytes: Uint8Array): { data: Uint8Array; ext: string } | null {
  const candidates: Array<{ data: Uint8Array; ext: string; size: number }> = [];

  // Search for JPEG markers
  for (let i = 0; i < bytes.length - 3; i++) {
    if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8 && bytes[i + 2] === 0xFF) {
      for (let j = i + 3; j < bytes.length - 1; j++) {
        if (bytes[j] === 0xFF && bytes[j + 1] === 0xD9) {
          const imgBytes = bytes.slice(i, j + 2);
          // Profile photos: 5KB-500KB. Skip tiny (icons) and huge (full-page graphics)
          if (imgBytes.length > 5000 && imgBytes.length < 500000) {
            candidates.push({ data: imgBytes, ext: "jpg", size: imgBytes.length });
          }
          break;
        }
      }
    }
  }

  // Search for PNG markers
  for (let i = 0; i < bytes.length - 8; i++) {
    if (bytes[i] === 0x89 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x4E && bytes[i + 3] === 0x47) {
      for (let j = i + 8; j < bytes.length - 8; j++) {
        if (bytes[j] === 0x49 && bytes[j + 1] === 0x45 && bytes[j + 2] === 0x4E && bytes[j + 3] === 0x44) {
          const imgBytes = bytes.slice(i, j + 8);
          if (imgBytes.length > 5000 && imgBytes.length < 500000) {
            candidates.push({ data: imgBytes, ext: "png", size: imgBytes.length });
          }
          break;
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  // Heuristic: profile photos tend to be 10KB-200KB. Sort by distance from ideal size (50KB)
  const idealSize = 50000;
  candidates.sort((a, b) => Math.abs(a.size - idealSize) - Math.abs(b.size - idealSize));

  return candidates[0];
}
```

**3. Condizionare l'upload alla conferma AI.** Invertire il flusso:

```
1. Chiama AI con il PDF
2. Se AI dice has_photo: true → prova a estrarre foto dal binario
3. Se estrazione fallisce → non caricare nulla
```

Questo evita di caricare su Storage loghi o icone scambiati per foto.

### Criteri di accettazione

- [ ] Il system prompt include la regola PHOTO DETECTION con distinzione foto/logo
- [ ] Lo schema include `photo_position`
- [ ] L'euristica di estrazione usa range 5KB-500KB e seleziona la foto più "plausibile"
- [ ] L'upload avviene solo se l'AI conferma `has_photo: true`

---

## Story 10 — Database: aggiungere colonna salary_expectations

### Cosa fare

Aggiungere una colonna JSONB nullable alla tabella `profiles`.

**Migration SQL:**

```sql
alter table profiles
  add column salary_expectations jsonb default null;
```

**Struttura del campo:**

```json
{
  "current_salary": 38000,
  "desired_minimum": 42000,
  "currency": "EUR"
}
```

**RLS:** nessuna modifica necessaria. La tabella `profiles` ha già RLS che limita l'accesso al proprio record.

### Criteri di accettazione

- [ ] Colonna `salary_expectations` (JSONB, nullable) aggiunta a `profiles`
- [ ] Nessun breaking change sui flussi esistenti

---

## Story 11 — Onboarding: sezione RAL opzionale

### Cosa fare

Nello step 3 dell'onboarding (preview + edit del CV), aggiungere una sezione in fondo, **dopo** tutte le sezioni del CV e **prima** del pulsante "Continua".

### Layout

Sezione con sfondo `--color-surface` (`#141518`), bordo `--color-border` (`#2A2D35`), border-radius 12px, padding 24px.

```
┌─────────────────────────────────────────────────┐
│  Aspettative economiche (opzionale)             │
│                                                 │
│  Queste info sono private e non appaiono nel CV.│
│  Servono per darti un'analisi più precisa       │
│  sulle posizioni.                               │
│                                                 │
│  RAL attuale o ultima        [€ ________]       │
│  RAL desiderata (minima)     [€ ________]       │
│                                                 │
│  [Salta]                                        │
└─────────────────────────────────────────────────┘
```

### Comportamento

- I due campi sono input numerici, placeholder "es. 35000"
- Suffisso "€/anno" visibile nel campo
- L'utente può compilarne uno, entrambi, o nessuno
- "Salta" chiude la sezione (collassa) e il pulsante "Continua" resta visibile sotto
- Se l'utente compila almeno un campo → al click su "Continua", salva in `profiles.salary_expectations`:
  ```json
  { "current_salary": 38000, "desired_minimum": 42000, "currency": "EUR" }
  ```
- Se l'utente non compila nulla → non salva nulla (il campo resta null)
- La sezione ha un'icona Phosphor `CurrencyEur` (duotone) nel titolo

### Stile

- Titolo: DM Sans 600 16px `--color-text-primary`
- Descrizione: DM Sans 400 13px `--color-text-secondary`
- Label campi: DM Sans 400 14px `--color-text-secondary`
- Input: sfondo `--color-surface-2`, bordo `--color-border`, testo `--color-text-primary`
- Link "Salta": DM Sans 400 13px `--color-text-muted`, underline on hover

### Criteri di accettazione

- [ ] Sezione RAL visibile nello step 3 dell'onboarding, dopo le sezioni CV
- [ ] Campi opzionali — nessun blocco se vuoti
- [ ] Salvataggio in `profiles.salary_expectations` al click "Continua"
- [ ] Se nessun campo compilato → niente salvataggio, il campo resta null

---

## Story 12 — Dashboard: mostrare e modificare RAL

### Cosa fare

Nella CV card della dashboard (`/app/home`), aggiungere una riga sotto le info del CV che mostra la RAL se compilata.

### Comportamento

**Se `profiles.salary_expectations` è compilato:**
- Mostrare una riga: `RAL attuale: €38.000 · Desiderata: €42.000+` con icona Phosphor `CurrencyEur` e icona `PencilSimple` per editare
- Click sull'icona apre un inline edit (stessa meccanica delle skill chips) con i due campi
- Salvataggio immediato al blur o Enter

**Se non compilato:**
- Mostrare: `Aggiungi aspettative RAL` come link cliccabile con icona `CurrencyEur`
- Click apre gli stessi due campi inline

### Stile

- Testo: DM Sans 400 13px `--color-text-secondary`
- Valori RAL: DM Sans 500 13px `--color-text-primary`
- Icona edit: 16px `--color-text-muted`, hover `--color-text-secondary`

### Criteri di accettazione

- [ ] RAL mostrata nella CV card se compilata
- [ ] Edit inline funzionante
- [ ] Aggiunta RAL possibile se non ancora compilata
- [ ] Salvataggio in `profiles.salary_expectations`

---

## Story 13 — Aggiornare lo step indicator a 6 step

### Cosa fare

Lo step indicator in alto nel wizard (`/app/nuova`) attualmente mostra 5 step. Aggiornarlo a 6.

### Step labels

| # | Label |
|---|-------|
| 1 | Annuncio |
| 2 | Analisi |
| 3 | Tailoring |
| 4 | Revisione |
| 5 | Export |
| 6 | Completa |

### Stile (invariato)

- Step completato: dot `#A8FF78` + label DM Sans 400 13px `--color-text-secondary`
- Step attuale: dot `#A8FF78` pulsante + label `--color-text-primary`
- Step futuro: dot `--color-border` + label `--color-text-muted`
- Navigazione back: freccia `ArrowLeft` in alto a sinistra

### Criteri di accettazione

- [ ] 6 dot nello step indicator
- [ ] Labels aggiornate
- [ ] Navigazione back funziona su tutti e 6 gli step

---

## Story 14 — Wizard step 4: trasformare Score in Revisione

### Contesto

Lo step 4 attuale mostra Match Score, ATS Score e Honest Score come numeri/contatori. Con questa story diventa "Revisione": un riepilogo chiaro di cosa è cambiato, con possibilità di vedere il confronto originale vs adattato.

### Prerequisito dati

Il response di `ai-tailor` contiene già un campo `diff[]` con questa struttura:

```json
{
  "section": "experience",
  "index": 0,
  "original": "Ho gestito il team",
  "suggested": "Coordinato team di 3 sviluppatori, riducendo il time-to-market del 25%",
  "reason": "Aggiunto verbo d'azione e risultato misurabile",
  "patch_path": "experience[0].bullets[2]"
}
```

E contiene `structural_changes[]`:

```json
{
  "action": "removed",
  "section": "experience",
  "item": "Cameriere presso Bar Roma (2018)",
  "reason": "Esperienza non rilevante per il ruolo"
}
```

**Oggi questi dati vengono ignorati dal frontend.** Con questa story vengono finalmente mostrati.

### Layout — 3 blocchi

**Blocco 1: Score (compatto, in alto)**

Due barre affiancate (desktop) o stacked (mobile):
```
Match: 74/100  [▓▓▓▓▓▓▓▓▓░]     ATS: 82/100  [▓▓▓▓▓▓▓▓▓▓░]
```
Stesse barre animate di oggi ma più compatte (altezza 8px anziché 12px).

**Blocco 2: Cosa abbiamo cambiato**

Card sfondo `--color-surface`, padding 20px:

```
Cosa abbiamo cambiato

✏️  4 bullet riscritti su 18
🔄  2 esperienze riordinate
✂️  1 esperienza rimossa
📝  Summary riscritto
🏷️  3 skill irrilevanti rimosse

Nessuna informazione inventata.
Date, aziende e titoli invariati. ✓

Confidence: 94%  ✓ Verificato
```

**Come costruire i dati per questo blocco:**

Il frontend ha accesso sia al CV originale (`original_cv` dal response di `ai-tailor`) che al CV tailored (dopo applicazione patches). Calcolare le differenze:

```typescript
// Esperienze
const expOriginal = originalCV.experience?.length || 0;
const expTailored = tailoredCV.experience?.length || 0;
const expRemoved = expOriginal - expTailored;

// Bullet riscritti: contare le entries in diff[] dove section === "experience"
const bulletsRewritten = diff.filter(d => d.section === "experience" && d.original !== d.suggested).length;

// Bullet totali nel CV originale
const bulletsTotal = originalCV.experience?.reduce((sum, exp) => sum + (exp.bullets?.length || 0), 0) || 0;

// Summary riscritto: cercare in diff[] dove section === "summary"
const summaryRewritten = diff.some(d => d.section === "summary");

// Skill rimosse: confrontare arrays
const skillsOriginal = [...(originalCV.skills?.technical || []), ...(originalCV.skills?.soft || []), ...(originalCV.skills?.tools || [])];
const skillsTailored = [...(tailoredCV.skills?.technical || []), ...(tailoredCV.skills?.soft || []), ...(tailoredCV.skills?.tools || [])];
const skillsRemoved = skillsOriginal.filter(s => !skillsTailored.includes(s)).length;

// Sezioni rimosse
const sectionsRemoved = structural_changes.filter(c => c.action === "removed").map(c => c.item);
```

**Confidence score — calcolo frontend:**

```
confidence = 100
  - (expRemoved / expOriginal) * 15
  - (bulletsRewritten / bulletsTotal) * 25
  - (summaryRewritten ? 5 : 0)
  - (skillsRemoved * 2)
  - (sectionsRemoved.length * 5)

// Floor a 0, cap a 100
confidence = Math.max(0, Math.min(100, Math.round(confidence)))
```

Se il calcolo rileva esperienze inventate (presenti nel tailored ma non nell'originale) → `confidence = 0` e mostrare flag "Attenzione: verificare manualmente il CV".

La label "✓ Verificato" appare SEMPRE (è calcolato dal codice, non dall'AI). Rimuovere i contatori dell'honest score generato dall'AI — usare solo quelli calcolati qui.

**Icone Phosphor:** `PencilSimple` (bullet riscritti), `ArrowsClockwise` (riordinate), `Scissors` (rimosse), `TextAlignLeft` (summary), `Tag` (skill).

**Blocco 3: Confronto dettagliato (collassato di default)**

Toggle "Mostra modifiche" che espande una lista di diff:

```
▶ Mostra modifiche (7)

[quando espanso:]

Summary
  - "Sviluppatore con 6 anni di esperienza in ambito web."
  + "Full-stack developer con 6 anni in fintech, specializzato in React e Node.js."
  ↳ Riscritto per il ruolo target

Esperienza — Acme Corp, Bullet 3
  - "Ho gestito il team"
  + "Coordinato team di 3 sviluppatori, riducendo il time-to-market del 25%"
  ↳ Aggiunto verbo d'azione e risultato misurabile

Struttura — Esperienza rimossa
  ✂️ Cameriere presso Bar Roma (2018)
  ↳ Esperienza non rilevante per il ruolo

[... altre diff ...]
```

Stile diff:
- Riga rimossa (`-`): DM Sans 400 13px, sfondo `rgba(255,107,107,0.08)`, testo `#FF6B6B`
- Riga aggiunta (`+`): DM Sans 400 13px, sfondo `rgba(168,255,120,0.08)`, testo `#A8FF78`
- Reason (`↳`): DM Sans 400 12px `--color-text-muted`, italic

Usare il campo `diff[]` dal response di `ai-tailor` per popolare la lista. Per i `structural_changes`, usare `item` e `reason`.

### Criteri di accettazione

- [ ] Score compatti in alto (match + ATS)
- [ ] Blocco "Cosa abbiamo cambiato" con contatori calcolati dal confronto CV originale vs tailored
- [ ] Confidence calcolato dal frontend, non dall'AI
- [ ] Label "✓ Verificato" presente
- [ ] Diff collassata di default, espandibile con toggle
- [ ] Ogni diff mostra originale, suggerito, e reason
- [ ] Structural changes (esperienze rimosse) mostrate nella diff

---

## Story 15 — Wizard step 5: export come step completo

### Contesto

Oggi l'export PDF è lo step 5 del wizard ma ha un layout tipo modale. Con questa story diventa uno step a pieno schermo con preview live del PDF.

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Esporta il tuo CV                                   │
│                                                      │
│  Scegli il template                                  │
│                                                      │
│  ┌────────────┐    ┌────────────┐                   │
│  │  ┌──────┐  │    │  ┌──────┐  │                   │
│  │  │ mini │  │    │  │ mini │  │                   │
│  │  │ prev │  │    │  │ prev │  │                   │
│  │  └──────┘  │    │  └──────┘  │                   │
│  │  Classico  │    │  Minimal   │                   │
│  │   ● sel    │    │   ○        │                   │
│  └────────────┘    └────────────┘                   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  │         [Preview PDF — rendering live        │   │
│  │          del template selezionato con         │   │
│  │          i dati del CV tailored.              │   │
│  │          Aspect ratio A4, max-height 500px,   │   │
│  │          scrollabile se necessario]           │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │          📥  Scarica PDF                     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ATS Score: 82/100 ✓      Confidence: 94% ✓         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Comportamento

- **Template cards:** due card selezionabili con miniatura del template. Card selezionata: bordo `--color-accent` 2px. Card non selezionata: bordo `--color-border`.
- **Preview PDF:** usare `@react-pdf/renderer` per rendering live del CV tailored con il template selezionato. Container con sfondo bianco, aspect ratio A4 (210:297), max-height 500px, overflow-y scroll, border-radius 8px, box-shadow sottile.
- **Cambio template:** la preview si aggiorna live (ri-rendering).
- **Pulsante "Scarica PDF":** bottone primario full-width, sfondo `--color-accent`, testo `#0C0D10`, DM Sans 600 16px. Icona Phosphor `DownloadSimple` a sinistra.
- **Badge qualità in basso:** ATS Score e Confidence in una riga, stile chip piccoli. Verde se > 70, giallo se 40-70, rosso se < 40.
- **Al click "Scarica PDF":** genera PDF, download, upload su Storage, salva URL in `tailored_cvs.pdf_url`. Dopo il download → abilita il pulsante "Continua →" per andare allo step 6.

### Differenze rispetto ad oggi

- Non è una modale, è uno step full-page del wizard con step indicator in alto
- La preview è un rendering live del PDF, non solo i pannelli score
- I badge ATS/Confidence sono un riassunto compatto, non i pannelli espansi
- Dopo il download il wizard prosegue (step 6), non si chiude

### Criteri di accettazione

- [ ] Step 5 è una pagina completa del wizard (non modale)
- [ ] Template selezionabile con bordo accent
- [ ] Preview PDF live che si aggiorna al cambio template
- [ ] Pulsante "Scarica PDF" primario full-width
- [ ] Badge ATS Score e Confidence in basso
- [ ] Dopo download → pulsante "Continua →" abilitato per step 6
- [ ] Step indicator in alto mostra 6 step

---

## Story 16 — Wizard step 6: Prossimi passi (nuovo)

### Contesto

Oggi il wizard finisce dopo l'export. La candidatura viene salvata con status `draft` e l'utente viene rediretto alla home. Non c'è uno step di chiusura che guida l'utente.

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Candidatura pronta!                                 │
│                                                      │
│  CV adattato per:                                    │
│  Senior Frontend Developer presso Acme Corp          │
│  Match: 74/100                                       │
│                                                      │
│  ────────────────────────────────                    │
│                                                      │
│  Cosa vuoi fare ora?                                 │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  ✅  Ho inviato la candidatura               │   │
│  │      Segna come "Inviata" e traccia          │   │
│  │      lo stato in Candidature                  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  📋  La invierò dopo                         │   │
│  │      Salva come bozza.                        │   │
│  │      La trovi in Candidature                  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  ➕  Nuova candidatura                        │   │
│  │      Inizia subito con un altro annuncio      │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Comportamento

- **Titolo:** Syne 700 24px `--color-text-primary`. Icona Phosphor `Target` in accent.
- **Sottotitolo:** ruolo + azienda da `applications` record. Match score con colore (verde/giallo/rosso).
- **3 card azione:** sfondo `--color-surface`, bordo `--color-border`, hover border `--color-accent`, padding 16px, border-radius 12px, cursor pointer. Icone Phosphor: `CheckCircle`, `ClipboardText`, `Plus`.

**Click "Ho inviato la candidatura":**
1. Update `applications` record: `status = 'inviata'`
2. Toast: "Candidatura segnata come inviata"
3. Redirect a `/app/candidature`

**Click "La invierò dopo":**
1. Il record `applications` resta con `status = 'draft'` (già salvato nello step 5)
2. Redirect a `/app/home`

**Click "Nuova candidatura":**
1. Il record `applications` resta con `status = 'draft'`
2. Redirect a `/app/nuova` (nuovo wizard pulito)

### Salvataggio

Il record in `applications` e `tailored_cvs` viene già creato nello step 5 (export). Lo step 6 aggiorna solo lo status se l'utente sceglie "Ho inviato la candidatura".

**Importante:** spostare la creazione dei record da "al click Scarica PDF" a "all'ingresso dello step 5" (o alla fine dello step 4). In questo modo il record esiste già quando l'utente arriva allo step 6, indipendentemente dal fatto che abbia scaricato il PDF o meno.

### Criteri di accettazione

- [ ] Step 6 visibile dopo lo step 5
- [ ] Mostra ruolo, azienda, match score
- [ ] "Ho inviato" → update status a `inviata`, redirect a `/app/candidature`
- [ ] "La invierò dopo" → status resta `draft`, redirect a `/app/home`
- [ ] "Nuova candidatura" → redirect a `/app/nuova`
- [ ] Step indicator mostra 6 step, step 6 evidenziato

---

## Story 17 — Wizard step 2: aggiungere Analisi Retributiva

### Contesto

Lo step 2 del wizard mostra il pre-screening. Con questa story si aggiunge una sezione "Analisi Retributiva" tra il pre-screening e le follow-up questions.

> **Questa story va per ultima** perché dipende dall'aggiornamento della Edge Function `ai-prescreen` (stories 1-9). Se la Edge Function non è ancora aggiornata, la sezione non appare (backward compatible).

### Prerequisito dati

La Edge Function `ai-prescreen` verrà aggiornata per restituire un campo aggiuntivo `salary_analysis` nel response:

```json
{
  "salary_analysis": {
    "candidate_estimate": {
      "min": 35000,
      "max": 42000,
      "source": "user_provided",
      "basis": "Indicata dall'utente"
    },
    "position_estimate": {
      "min": 45000,
      "max": 55000,
      "source": "explicit",
      "basis": "Indicata nell'annuncio: €45-55K"
    },
    "delta": "positive",
    "delta_percentage": "+20-30%",
    "note": "La posizione offre un incremento significativo rispetto alla RAL attuale."
  }
}
```

Valori possibili per `delta`: `"positive"` | `"neutral"` | `"negative"`.
Valori possibili per `source`: `"user_provided"` | `"explicit"` | `"ai_estimated"`.

**Importante:** quando il frontend chiama `ai-prescreen`, deve passare `salary_expectations` dal profilo utente nel body della request (se disponibile):

```json
{
  "job_data": { ... },
  "salary_expectations": { "current_salary": 38000, "desired_minimum": 42000, "currency": "EUR" }
}
```

### Layout

Card con sfondo `--color-surface`, padding 20px, border-radius 12px:

```
┌─────────────────────────────────────────────────┐
│  Analisi Retributiva                            │
│                                                 │
│  La tua RAL          €35-42K   [badge: fonte]   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░                     │
│                                                 │
│  RAL posizione       €45-55K   [badge: fonte]   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░                     │
│                                                 │
│  Delta: +20-30% ↑                               │
│  "La posizione offre un incremento              │
│   significativo rispetto alla tua RAL attuale." │
│                                                 │
│  Le stime sono indicative e basate su dati      │
│  di mercato generali.                           │
└─────────────────────────────────────────────────┘
```

### Comportamento

- Le due barre orizzontali usano lo stesso gradiente `--gradient-score` ma con scala relativa (la barra più grande = 100%)
- Badge fonte:
  - `source: "user_provided"` → chip "Da te" sfondo `rgba(168,255,120,0.12)` testo `#A8FF78`
  - `source: "explicit"` → chip "Dall'annuncio" sfondo `rgba(93,187,255,0.12)` testo `#5DBBFF`
  - `source: "ai_estimated"` → chip "Stimata" sfondo `rgba(139,143,168,0.12)` testo `#8B8FA8`
- Colore delta:
  - `positive` → `#A8FF78` con freccia ↑
  - `neutral` → `#FFD166` con freccia →
  - `negative` → `#FF6B6B` con freccia ↓
- Disclaimer: DM Sans 400 12px `--color-text-muted`, icona Phosphor `Info` 14px

### Se `salary_analysis` non è presente nel response

Non mostrare la sezione. Nessun errore, nessun placeholder. Backward compatible.

### Criteri di accettazione

- [ ] Sezione "Analisi Retributiva" visibile nello step 2 se `salary_analysis` è nel response
- [ ] Badge fonte corretto per candidato e posizione
- [ ] Colore delta corretto (verde/giallo/rosso)
- [ ] Disclaimer sempre visibile
- [ ] Se `salary_analysis` assente → sezione nascosta, nessun errore
- [ ] `salary_expectations` dal profilo inviato nella request a `ai-prescreen`

---

## Riepilogo stories e ordine di esecuzione

### Fase 1 — Moduli shared (prerequisiti)

| # | Story | Cosa | Effort |
|---|-------|------|--------|
| 1 | `_shared/compact-cv.ts` | Unificare compactCV duplicata | Basso |
| 2 | `_shared/ai-fetch.ts` | Retry + backoff + fallback model | Medio |
| 3 | `_shared/validate-output.ts` | Validazione schema output AI | Medio |

### Fase 2 — Miglioramenti Edge Functions

| # | Story | Cosa | Effort |
|---|-------|------|--------|
| 4 | `parse-cv` prompts | Few-shot, sinonimi, regole estrazione | Basso |
| 5 | `scrape-job` upgrade | Modello flash + campi salary/seniority/industry | Basso |
| 6 | Language policy | Esempi concreti in prescreen + tailor | Basso |
| 7 | Score severity | adjustScore basato su critical/moderate/minor | Medio |
| 8 | Patch validation | applyPatches con bounds check + change ratio | Medio |
| 9 | Photo extraction | Rilevamento AI + euristica migliorata | Medio |

### Fase 3 — Frontend + Database

| # | Story | Cosa | Effort |
|---|-------|------|--------|
| 10 | DB migration | Colonna `salary_expectations` | Basso |
| 11 | Onboarding RAL | Sezione RAL opzionale nello step 3 | Basso |
| 12 | Dashboard RAL | Mostrare/editare RAL nella CV card | Basso |
| 13 | Step indicator | Da 5 a 6 step | Basso |
| 14 | Revisione (step 4) | Honest score calcolato + diff view | Alto |
| 15 | Export (step 5) | Full-page con preview PDF live | Medio |
| 16 | Prossimi passi (step 6) | Nuovo step finale con 3 azioni | Medio |
| 17 | Analisi Retributiva | Sezione salary nello step 2 (dipende da backend) | Medio |

### Ordine di esecuzione

```
FASE 1 (shared):     1 → 2 → 3
FASE 2 (backend):    4 → 5 → 6 → 7 → 8 → 9
FASE 3 (frontend):   10 → 11 → 12 → 13 → 14 → 15 → 16 → 17
```

> **Story 17 va per ultima** perché dipende dall'aggiornamento di `ai-prescreen` (fase 2). Tutte le altre stories frontend sono indipendenti dal backend AI.

---

*Verso Improvements v2 — Specifiche Lovable — 2026-03-01*
