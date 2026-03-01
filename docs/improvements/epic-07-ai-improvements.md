# Epic 07 — AI Engine Improvements (9 interventi)

---

## Obiettivo

Migliorare la qualità dell'output AI di Verso su tutte e 4 le Edge Functions: parsing CV più accurato, scoring più affidabile, tailoring più robusto, e infrastruttura più resiliente.

---

## IMP-1 — Few-shot examples e sinonimi in `parse-cv`

### Problema

Il system prompt di `parse-cv` elenca i campi da estrarre ma non dà guidance su situazioni ambigue. Il modello perde campi quando:
- Il CV usa formattazione non standard (tabelle, colonne affiancate, infografiche)
- I titoli di sezione non sono standard ("Percorso professionale" vs "Experience")
- Bullets e testo narrativo sono mescolati → tutto finisce in `description` o tutto in `bullets`
- Le lingue sono scritte in formati eterogenei ("Inglese C1", "English: fluent", "Anglais — courant")

### Cosa fare

**1. Aggiungere sinonimi per ogni sezione nel system prompt**

Dopo la riga `RULES:` nel system prompt, aggiungere un blocco di section mapping:

```
## SECTION MAPPING — Recognize these section titles in ANY language:
- Experience = "Esperienze", "Esperienze professionali", "Percorso professionale", "Work Experience", "Employment History", "Professional Experience", "Berufserfahrung", "Expérience professionnelle", "Experiencia laboral"
- Education = "Istruzione", "Formazione", "Titoli di studio", "Percorso formativo", "Education", "Academic Background", "Ausbildung", "Formation", "Educación"
- Skills = "Competenze", "Competenze tecniche", "Skills", "Core Competencies", "Fähigkeiten", "Compétences", "Habilidades"
- Languages = "Lingue", "Conoscenze linguistiche", "Languages", "Sprachen", "Langues", "Idiomas"
- Certifications = "Certificazioni", "Attestati", "Abilitazioni", "Certifications", "Licenses", "Zertifikate"
- Projects = "Progetti", "Projects", "Portfolio", "Projekte"
```

**2. Aggiungere regola esplicita per layout a colonne**

```
## MULTI-COLUMN LAYOUT
If the CV has a two-column or multi-column layout:
- Read the MAIN column first (usually the wider one, typically on the right)
- Then read the SIDEBAR column (usually narrower, typically on the left)
- The sidebar often contains: personal info, skills, languages, certifications
- The main column often contains: experience, education, projects
- Do NOT skip sidebar content — it often contains skills and languages
```

**3. Aggiungere regole per separazione description/bullets**

```
## DESCRIPTION vs BULLETS separation rules:
- If text uses bullet markers (•, -, *, ▸, ▹, ◦, ►) → extract as "bullets"
- If text is continuous paragraph(s) with NO bullet markers → extract as "description"
- If text MIXES paragraphs and bullets → put paragraphs in "description" and bulleted items in "bullets"
- NEVER duplicate: the same text must NOT appear in both fields
```

**4. Aggiungere regola per normalizzazione lingue/CEFR**

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

**5. Aggiungere un few-shot example**

Nel system prompt, aggiungere un esempio concreto di CV ambiguo con output atteso. Inserirlo dopo le regole:

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

**6. Aggiungere regola null vs stringa vuota**

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
- [ ] Testato con almeno 3 CV problematici (colonne, lingue non standard, sezioni non standard)

---

## IMP-2 — `_shared/compactCV` unificata

### Problema

`compactCV` è duplicata in `ai-prescreen` e `ai-tailor` con logiche diverse:
- `ai-tailor` (riga 22) filtra anche stringhe "None", "N/A", "n/d", "undefined"
- `ai-prescreen` (riga 117) non filtra queste stringhe

Il CV che arriva a `ai-prescreen` contiene rumore che `ai-tailor` non vedrebbe, portando a risultati incoerenti tra pre-screening e tailoring.

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

## IMP-3 — Upgrade `scrape-job` a flash + campi extra

### Problema

`scrape-job` usa `google/gemini-2.5-flash-lite`, un modello troppo debole per annunci complessi:
- Annunci lunghi con requisiti sparsi nel testo → requisiti persi
- Annunci in formato "muro di testo" senza bullet points → estrazione parziale
- Requisiti impliciti ignorati (es. "team internazionale" → inglese richiesto)
- Mancano campi utili per il seniority match: `seniority_level`, `salary_range`, `industry`

### Cosa fare

**1. Cambiare modello**

In `scrape-job/index.ts`, riga 175:
```
// PRIMA
model: "google/gemini-2.5-flash-lite"

// DOPO
model: "google/gemini-2.5-flash"
```

La cache a 7 giorni ammortizza l'aumento di costo — ogni URL viene processato una sola volta.

**2. Aggiungere regola per requisiti impliciti nel system prompt**

Aggiungere al system prompt (dopo la regola sulla lingua):

```
## IMPLICIT REQUIREMENTS
Deduce implicit requirements from context when clearly inferable:
- International team / global company / foreign HQ → language requirement (specify which)
- "Travel required" / multiple office locations → willingness to travel
- Startup / fast-paced environment → adaptability, autonomy
- "X+ years" in any form → extract as key requirement with the exact number
Do NOT invent requirements — only extract what is clearly implied by the text.
```

**3. Aggiungere campi allo schema tool**

Aggiungere 3 nuove properties nell'oggetto `parameters.properties` di `extract_job_data`:

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

Non aggiungere questi campi ai `required` — sono opzionali.

**4. Migliorare la pulizia HTML**

L'attuale pulizia HTML (righe 94-103) è basica. Aggiungere la rimozione di:
- `<nav>`, `<header>`, `<footer>` → navigazione del sito, non contenuto dell'annuncio
- Cookie banner e popup

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
- [ ] Schema include `seniority_level`, `salary_range`, `industry`
- [ ] Pulizia HTML migliorata (rimozione nav/header/footer)
- [ ] Testato con almeno 3 annunci complessi (LinkedIn, Indeed, sito aziendale)

---

## IMP-4 — Score adjustment basato su severity AI

### Problema

La funzione `adjustScore` in `ai-tailor` (righe 349-382) applica cap deterministici basati solo sul conteggio delle skill essenziali mancanti, senza considerare la loro gravità:
- 1 skill essenziale mancante → cap 55 (troppo punitivo se è una skill minore)
- Non distingue "Python mancante per un ruolo Python" da "Excel mancante per un ruolo developer"
- La penalità seniority è fissa (-15 per gap >= 2, -5 per gap 1), ignora il contesto

### Cosa fare

**1. Aggiungere `severity` allo schema `skills_missing` in `TOOL_SCHEMA_ANALYZE`**

Modificare l'item di `skills_missing` (riga 216-222):

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

**2. Aggiungere istruzione nel system prompt `SYSTEM_PROMPT_ANALYZE`**

Dopo la sezione `## SCORE PENALIZATION FOR MANDATORY GAPS`, aggiungere:

```
## SKILL GAP SEVERITY CLASSIFICATION
For each missing skill, assess severity honestly:
- **critical**: The role CANNOT be performed without this skill. Example: "React" for a "React Developer" role, "5+ years experience" when candidate has 1.
- **moderate**: Significant gap but the skill can be learned within 6-12 months, OR the candidate has transferable skills. Example: "Docker" for a backend role where candidate knows other containerization.
- **minor**: Nice-to-have skill, or the candidate likely has it implicitly. Example: "Git" for any developer, "Microsoft Office" for an office role.
```

**3. Riscrivere `adjustScore` per usare severity**

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
- [ ] Testato: candidato con 1 skill "critical" mancante → score < 45; candidato con 1 skill "minor" mancante → score non penalizzato

---

## IMP-5 — Validazione schema output AI

### Problema

Nessuna delle 4 funzioni valida lo schema dell'output AI. Se il modello restituisce un JSON con campi mancanti, tipi sbagliati, o struttura corrotta, viene passato al frontend senza controlli. Questo causa errori silenziosi nell'UI.

### Cosa fare

**1. Creare `supabase/functions/_shared/validate-output.ts`**

Implementare validazione leggera (senza dipendenze esterne come Zod — Deno edge functions hanno vincoli di bundle):

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
  // Il frontend gestirà i campi mancanti gracefully
}
```

> **Nota:** La validazione logga ma **non blocca**. Un output parziale è meglio di nessun output. Il frontend deve già gestire campi mancanti.

### Criteri di accettazione

- [ ] File `_shared/validate-output.ts` creato con `validateOutput()` e regole per tutte e 4 le funzioni
- [ ] Ogni funzione importa e chiama `validateOutput` dopo il parsing AI
- [ ] Campi mancanti vengono loggati come warning (non bloccano la response)
- [ ] Se `match_score` o `ats_score` sono undefined → default a 0 anziché passare undefined al frontend

---

## IMP-6 — Miglioramento estrazione foto

### Problema

L'estrazione foto in `parse-cv` (funzione `extractFirstImage`, righe 10-39) cerca magic bytes JPEG/PNG nel binario del PDF. Problemi:
- PDF con immagini in stream compressi (Flate, DCT) → non trovate
- PDF con più immagini grandi (loghi aziendali, decorazioni grafiche) → prende la prima, non la foto profilo
- Nessuna euristica per distinguere "foto persona" da "logo" o "icona"

### Cosa fare

**1. Delegare il rilevamento foto all'AI**

Il modello riceve già il PDF come input multimodale. Aggiungere al system prompt di `parse-cv`:

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

**2. Migliorare l'euristica di estrazione binaria**

Mantenere `extractFirstImage` come fallback ma migliorarla:

```typescript
function extractFirstImage(bytes: Uint8Array): { data: Uint8Array; ext: string } | null {
  const candidates: Array<{ data: Uint8Array; ext: string; size: number }> = [];

  // Search for JPEG markers
  for (let i = 0; i < bytes.length - 3; i++) {
    if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8 && bytes[i + 2] === 0xFF) {
      for (let j = i + 3; j < bytes.length - 1; j++) {
        if (bytes[j] === 0xFF && bytes[j + 1] === 0xD9) {
          const imgBytes = bytes.slice(i, j + 2);
          // Profile photos are typically 5KB-500KB
          // Skip tiny images (<5KB = icons) and huge images (>500KB = likely full-page graphics)
          if (imgBytes.length > 5000 && imgBytes.length < 500000) {
            candidates.push({ data: imgBytes, ext: "jpg", size: imgBytes.length });
          }
          break; // Move to next JPEG start marker
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

  // Heuristic: profile photos tend to be 10KB-200KB
  // Sort by distance from "ideal" profile photo size (50KB)
  const idealSize = 50000;
  candidates.sort((a, b) => Math.abs(a.size - idealSize) - Math.abs(b.size - idealSize));

  return candidates[0];
}
```

**3. Condizionare l'upload alla conferma AI**

Oggi l'estrazione foto avviene PRIMA della chiamata AI. Invertire il flusso:

```
1. Chiama AI con il PDF
2. Se AI dice has_photo: true → prova a estrarre foto dal binario
3. Se estrazione fallisce → non caricare nulla (foto visivamente presente ma non estraibile)
```

Questo evita di caricare su Storage loghi o icone scambiati per foto.

### Criteri di accettazione

- [ ] Il system prompt include la regola PHOTO DETECTION con distinzione foto/logo
- [ ] Lo schema include `photo_position`
- [ ] L'euristica di estrazione usa range 5KB-500KB e seleziona la foto più "plausibile"
- [ ] L'upload avviene solo se l'AI conferma `has_photo: true`

---

## IMP-7 — Validazione patches e protezione integrità CV

### Problema

Il sistema di patches in `ai-tailor` (funzione `applyPatches`, righe 37-76) è fragile:
- Path con indice fuori range (es. `experience[5]` con solo 3 esperienze) → crea nodi undefined
- `applyPatches` crea nodi intermedi se non esistono (riga 61) → può creare strutture fantasma
- Nessun limite sulla quantità di modifiche — il CV può essere stravolto silenziosamente
- La experience protection (righe 547-561) interviene dopo e solo per il path `experience`

### Cosa fare

**1. Aggiungere validazione path in `applyPatches`**

Prima di applicare ogni patch, verificare che il path target esista:

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

    // Validate: check that parent path exists (don't create intermediate nodes)
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
        // Allow creating new keys only at the last segment, not intermediate
        if (obj[seg] === undefined && i < segments.length - 2) {
          console.warn(`applyPatches: intermediate path "${seg}" does not exist in "${path}"`);
          skipped.push(path);
          valid = false;
          break;
        }
        if (obj[seg] === undefined) {
          // Create only the direct parent if it's the second-to-last segment
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

**2. Aggiungere change-ratio check**

Dopo aver applicato le patches, calcolare quanto è cambiato:

```typescript
function calculateChangeRatio(original: string, patched: string): number {
  // Simple heuristic: compare JSON string length difference
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
  // Non bloccare, ma loggare per monitoring
}
```

**3. Loggare le patches skipped nella response**

Aggiungere `skipped_patches` alla response del tailor mode:

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

## IMP-8 — Chiarimento language policy nei prompt

### Problema

La policy linguistica è definita diversamente in ogni funzione:
- `parse-cv`: "preserve the EXACT original language" (inglese nel prompt)
- `scrape-job`: "LANGUAGE IN = LANGUAGE OUT" (inglese nel prompt)
- `ai-prescreen`: "ALL analysis output MUST be in ITALIAN" (inglese nel prompt)
- `ai-tailor analyze`: "TWO-LEVEL LANGUAGE POLICY" (inglese nel prompt)
- `ai-tailor tailor`: "TWO-LEVEL LANGUAGE POLICY" (inglese nel prompt)

Quando un utente ha un CV in italiano e si candida per un annuncio in inglese, il comportamento atteso è:
- Pre-screening → in italiano
- CV tailored → in inglese (lingua dell'annuncio)
- Suggerimenti/analisi → in italiano

Ma il prompt non dà esempi concreti, e il modello a volte sbaglia (specie con annunci bilingui o CV in lingua mista).

### Cosa fare

**1. Aggiungere esempi espliciti in `ai-prescreen`**

Dopo la regola lingua, aggiungere:

```
## LANGUAGE EXAMPLES
- CV in Italian + Job posting in English → ALL output in Italian (dealbreakers, questions, notes)
- CV in English + Job posting in Italian → ALL output in Italian
- CV in German + Job posting in German → ALL output in Italian
The rule is simple: this is an Italian product. Analysis is ALWAYS in Italian. No exceptions.
```

**2. Aggiungere esempi espliciti in `ai-tailor` (analyze)**

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

**3. Aggiungere esempi espliciti in `ai-tailor` (tailor)**

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
- [ ] Testato con combinazione: CV italiano + annuncio inglese → CV tailored in inglese, analisi in italiano
- [ ] Testato con combinazione: CV inglese + annuncio italiano → CV tailored in italiano, analisi in italiano

---

## IMP-9 — Retry con backoff e fallback model

### Problema

Se l'AI gateway restituisce un errore 500 o timeout, la funzione fallisce immediatamente. Non c'è:
- Retry con backoff per errori transitori
- Fallback su modello alternativo

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

Sostituire le chiamate `fetch` dirette con `aiFetch`. Esempio per `parse-cv`:

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

### Criteri di accettazione

- [ ] File `_shared/ai-fetch.ts` creato con retry (max 2, backoff 1s/3s) e fallback model
- [ ] Errori 401/402/429 non vengono retried (non-retryable)
- [ ] Errori 500/502/503/504 vengono retried fino a 2 volte
- [ ] Se il modello primario fallisce dopo i retry → tentativo con `google/gemini-2.0-flash`
- [ ] Tutte e 4 le funzioni usano `aiFetch` al posto di `fetch` diretto
- [ ] Log del modello effettivamente usato nella response

---

## Stories

| ID | Story | Priorità | Effort |
|----|-------|----------|--------|
| 07.1 | IMP-1: Few-shot + sinonimi in parse-cv | Must | Basso |
| 07.2 | IMP-2: _shared/compactCV unificata | Must | Basso |
| 07.3 | IMP-3: Upgrade scrape-job + campi extra | Must | Basso |
| 07.4 | IMP-4: Score adjustment con severity | Must | Medio |
| 07.5 | IMP-5: Validazione schema output | Must | Medio |
| 07.6 | IMP-6: Miglioramento estrazione foto | Should | Medio |
| 07.7 | IMP-7: Validazione patches + protezione CV | Should | Medio |
| 07.8 | IMP-8: Chiarimento language policy | Must | Basso |
| 07.9 | IMP-9: Retry + fallback model | Should | Medio |

---

## Ordine di implementazione consigliato

```
1. IMP-2 (_shared/compactCV)      → prerequisito per tutto
2. IMP-9 (_shared/ai-fetch)       → prerequisito per tutto
3. IMP-5 (_shared/validate)       → prerequisito per tutto
4. IMP-1 (parse-cv prompts)       → impatto alto, effort basso
5. IMP-3 (scrape-job upgrade)     → impatto alto, effort basso
6. IMP-8 (language policy)        → impatto medio, effort basso
7. IMP-4 (score severity)         → impatto alto, effort medio
8. IMP-7 (validazione patches)    → impatto medio, effort medio
9. IMP-6 (foto)                   → impatto basso, effort medio
```

---

*Epic 07 — AI Engine Improvements — Verso*
