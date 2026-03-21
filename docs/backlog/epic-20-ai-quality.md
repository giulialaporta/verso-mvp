# Epic 20 — Qualita' AI: CV onesti, coerenti e ben scritti

## Obiettivo

Irrobustire l'intera catena AI (scrape-job → prescreen → tailor → review) per produrre CV adattati di alta qualita': fedeli al CV originale, senza invenzioni, con skill ordinate per rilevanza, bullet informativi, e una narrativa coerente. Il CV finale deve sembrare scritto da un career coach esperto, non generato da una macchina.

> **Principio guida:** il tuo CV, alla sua versione migliore — senza bugie.

---

## Problemi attuali

| # | Problema | Effetto |
|---|----------|---------|
| 1 | L'AI inventa KPI, metriche, outcome mai presenti nel CV originale | CV disonesto, candidato in difficolta' al colloquio |
| 2 | Bullet vuoti ("...", "• ", testo troncato) nell'output | CV visivamente rotto |
| 3 | Competenze non riordinate per rilevanza al ruolo | CV non targetizzato |
| 4 | Prompt tailor troppo lungo (290 righe), contraddittorio, senza esempi | Comportamento AI inconsistente |
| 5 | cv-review non riceve CV originale ne' annuncio — puo' peggiorare le cose | Secondo layer di invenzioni |
| 6 | Nessun integrity check dopo cv-review | Cambiamenti non autorizzati passano inosservati |
| 7 | max_tokens 4096 insufficiente per CV lunghi | Troncamento, errori, fallback silenzioso a Gemini |
| 8 | Nessuna temperatura → output variabile tra run | Qualita' imprevedibile |
| 9 | CV passato come blob JSON illeggibile | Modello perde contesto su CV lunghi |
| 10 | Patch parziali → CV bilingue involontario | Sezioni miste italiano/inglese |
| 11 | scrape-job inventa "requisiti impliciti" | Matching inquinato da skill fantasma |
| 12 | Score note AI sovrascritta con testo meccanico | Utente perde insight utili |
| 13 | Nessuna coerenza narrativa (summary ↔ experience ↔ skills) | CV senza filo logico |
| 14 | Nessuna validazione lunghezza/qualita' bullet finali | Bullet di 2 parole o wall of text |
| 15 | Fallback Gemini silenzioso | Qualita' drasticamente peggiore senza avviso |
| 16 | Job data non normalizzati dopo scrape | Duplicati e artefatti inquinano analisi |
| 17 | cv-review suggerisce "risultati misurabili" nel prompt esempio | Istruzione stessa invita ad inventare |

---

## Architettura target

```
scrape-job (normalizzazione server-side post-AI)
    |
ai-prescreen (invariato, miglioramento domande follow-up)
    |
ai-tailor ANALYZE (invariato, fix score_note)
    |
ai-tailor TAILOR (prompt ristrutturato + few-shot + temp 0.2 + 8192 tokens)
    |
integrity-check v2 (claim qualitativi + bullet validation)
    |
cv-review (riceve CV originale + job, ruolo validatore, integrity-check v2 post)
    |
[cv-formal-review — opzionale, solo pre-download]
```

Cambiamenti chiave rispetto all'as-is:
- **Un solo prompt tailor** ristrutturato con gerarchia di regole + esempi concreti
- **cv-review trasformato** da riscrittore cieco a validatore con contesto completo
- **Integrity check** rinforzato e applicato dopo OGNI passaggio AI
- **Validazioni server-side** per bullet vuoti, skill duplicate, coerenza lingua

---

## Stories

| ID | Story | Priorita' | Effort |
|----|-------|-----------|--------|
| 20.1 | Ristrutturare SYSTEM_PROMPT_TAILOR: gerarchia regole + few-shot examples | Must | M |
| 20.2 | Parametri AI: temperatura 0.2 per tailor/review, maxTokens 8192 per tailor | Must | S |
| 20.3 | Validazione server-side post-patch: bullet vuoti, skill deduplica, skill ordering | Must | M |
| 20.4 | Rimuovere "requisiti impliciti" da scrape-job + normalizzazione job data | Must | S |
| 20.5 | Passare CV originale e job requirements a cv-review + integrity check post-review | Must | M |
| 20.6 | Irrobustire integrity-check: claim qualitativi, validazione lunghezza bullet | Must | M |
| 20.7 | CV formattato leggibile per l'AI + verifica copertura patch per traduzione completa | Should | S |
| 20.8 | Preservare score_note AI + warning fallback Gemini | Should | S |
| 20.9 | Fix prompt cv-review: rimuovere esempio che invita a inventare, aggiungere ruolo validatore | Should | S |
| 20.10 | Riscrivere ats_checks in ai-tailor con i controlli ATS reali (11 check completi) | Must | M |

> **Ordine di implementazione:** 20.1 → 20.2 → 20.4 → 20.3 → 20.6 → 20.5 → 20.9 → 20.7 → 20.8 → 20.10

---

## Story 20.1 — Ristrutturare il prompt di ai-tailor

**Priorita':** Must
**File:** `supabase/functions/ai-tailor/index.ts` (SYSTEM_PROMPT_TAILOR, righe 140-293)

### Problema

Il prompt attuale e' 290 righe con regole che competono tra loro, nessun esempio concreto, e istruzioni ambigue che spingono l'AI ad inventare ("action verb + impact"). Il modello non sa come bilanciare "migliora il CV" con "non inventare nulla".

### Cosa fare

Riscrivere `SYSTEM_PROMPT_TAILOR` con questa struttura:

**Sezione 1 — IDENTITA' (3 righe)**
```
You are a career coach adapting a CV for a specific job posting.
Your goal: make the candidate's REAL experience shine for this role.
You work with what exists — you NEVER add what doesn't.
```

**Sezione 2 — REGOLE INVIOLABILI (tier 1, in cima al prompt)**
Le regole anti-hallucination devono essere le PRIME che il modello legge. Condensare le 11 regole attuali in 5 regole chiare:

1. **ZERO INVENZIONI** — Mai inventare metriche (%, €, numeri), outcome ("con risultati misurabili", "migliorando significativamente"), team size, user count. Se il bullet originale non ha numeri, quello riscritto non deve averne.
2. **CAMPI IMMUTABILI** — Role title, company name, location, date, education, certifications: copia carattere per carattere. Mai tradurli, mai abbreviarli, mai modificarli.
3. **SOTTOINSIEME** — Ogni claim nel CV tailorato deve essere tracciabile a un contenuto nel CV originale. Puoi riformulare, condensare, evidenziare. Non puoi aggiungere.
4. **MAI RIMUOVERE ESPERIENZE** — Ogni esperienza lavorativa del CV originale deve restare. Puoi condensare i bullet, non eliminare l'esperienza.
5. **SUMMARY = IDENTITA' REALE** — Il summary descrive chi e' il candidato (ruolo attuale, settore, anni), non chi vorrebbe diventare. Puoi evidenziare skill trasferibili, non ribrandizzare.

**Sezione 3 — ESEMPI CONCRETI (few-shot, subito dopo le regole)**
Aggiungere 4 esempi before/after:

```
## EXAMPLES — CORRECT vs WRONG rewrites

ORIGINAL: "Gestito progetto CRM aziendale"
CORRECT:  "Gestito il progetto CRM aziendale, coordinando le fasi di analisi, sviluppo e rilascio"
WRONG:    "Gestito il progetto CRM aziendale, aumentando la customer retention del 25%"
WHY WRONG: "25%" is invented — the original has no metrics.

ORIGINAL: "Coordinated frontend development team"
CORRECT:  "Coordinated the frontend development team across multiple product releases"
WRONG:    "Led a team of 8 frontend developers, delivering 3 major releases"
WHY WRONG: "8 developers" and "3 releases" are invented specifics.

ORIGINAL: "Supporto clienti e gestione reclami"
CORRECT:  "Gestito il supporto clienti e la risoluzione dei reclami"
WRONG:    "Gestito il supporto clienti, risolvendo il 95% dei reclami entro 24 ore"
WHY WRONG: "95%" and "24 ore" are invented metrics.

ORIGINAL: (no bullet exists for this topic)
CORRECT:  (do not create a bullet)
WRONG:    "Implementato sistema di tracking KPI per il team sales"
WHY WRONG: This experience/bullet doesn't exist in the original CV.
```

**Sezione 4 — LINGUA**
Mantenere le regole lingua attuali ma condensate:
- CV content nella target language (detected_language)
- Analysis text (diff reasons, structural_changes) sempre in italiano
- Se la lingua del CV originale differisce da detected_language → generare patch per TUTTI i campi testuali

**Sezione 5 — COME ADATTARE (tier 2)**
Istruzioni operative, dopo le regole e gli esempi:
- **Bullet:** riformula con verbo d'azione + cosa ha fatto il candidato. Se l'originale ha metriche, mantienile. Se non ne ha, descrivi l'impatto qualitativamente usando SOLO informazioni gia' presenti.
- **Summary:** 2-3 frasi. Chi e' il candidato + cosa lo rende rilevante per questo ruolo specifico. Basati su experience e skill reali.
- **Skill ordering:** ordina per rilevanza al job posting. Prima: match esatti con required_skills. Poi: skill tecniche correlate. Poi: tools. Ultimo: soft skills. Rimuovi skill generiche irrilevanti.
- **Esperienze:** ordine cronologico inverso (piu' recente prima). Condensa a max 4-5 bullet per esperienza. Unisci bullet simili, taglia quelli irrilevanti per il ruolo.

**Sezione 6 — DATA INTEGRITY**
Le regole su certifications not in experience, experience order, etc. Condensate.

**Sezione 7 — FOLLOW-UP ANSWERS**
Le regole attuali sui livelli (expert/some/learning/none). Invariate.

**Sezione 8 — OUTPUT FORMAT**
Patches, diff, structural_changes, honest_score. Invariato.

### Regola RIMOSSA

Rimuovere completamente:
- "CONCISENESS RULE: A well-targeted 1-page CV beats a generic 3-page CV" — questa regola spinge il modello a tagliare troppo aggressivamente
- Le "CV QUALITY RULES" duplicate (sono gia' nelle regole operative)
- "Experience order MUST be reverse chronological... You may reorder by relevance ONLY if dates are roughly equivalent" — contraddizione. Sostituire con: "Ordine cronologico inverso (piu' recente prima). Non riordinare per rilevanza."

### Criteri di accettazione

- [ ] SYSTEM_PROMPT_TAILOR ristrutturato con gerarchia: identita' → regole inviolabili → esempi → lingua → come adattare → data integrity → follow-up → output
- [ ] Almeno 4 esempi concreti before/after (correct vs wrong) nel prompt
- [ ] Regole anti-hallucination nei primi 30 righe del prompt (non a riga 223)
- [ ] Nessuna istruzione ambigua tipo "action verb + impact" — sostituita con "action verb + cosa ha fatto il candidato"
- [ ] Rimossa la CONCISENESS RULE e la contraddizione sul riordinamento esperienze
- [ ] Prompt totale < 180 righe (attualmente 290)

---

## Story 20.2 — Parametri AI: temperatura e max tokens

**Priorita':** Must
**File:** `supabase/functions/_shared/ai-provider.ts`, `supabase/functions/ai-tailor/index.ts`

### Problema

1. Nessuna temperatura impostata → default del modello, output variabile tra run
2. `max_tokens: 4096` (default in ai-provider) insufficiente per CV lunghi. ai-tailor genera patches + diff + honest_score + structural_changes — con CV di 8+ esperienze e traduzione, 4096 token non bastano. La risposta viene troncata → tool call non parsabile → errore o fallback Gemini.

### Cosa fare

1. In `ai-provider.ts`, aggiungere supporto per `temperature` nel body della request Anthropic (riga ~209):
   - Aggiungere `temperature` come campo opzionale in `AiRequest`
   - Se presente, includerlo nel body: `if (request.temperature !== undefined) body.temperature = request.temperature;`
   - Fare lo stesso per Google AI e Lovable gateway

2. In `ai-tailor/index.ts`, passare `temperature: 0.2` e `maxTokens: 8192` nella chiamata tailor (riga ~679):
   ```
   const aiTailorResult = await callAi({
     task: "ai-tailor",
     ...
     temperature: 0.2,
     maxTokens: 8192,
   }, userId);
   ```

3. Nella chiamata cv-review (`cv-review/index.ts`, riga ~246), passare `temperature: 0.2` e `maxTokens: 8192`

4. Nella chiamata ai-tailor-analyze, lasciare i default (temperatura piu' alta va bene per l'analisi)

### Criteri di accettazione

- [ ] `AiRequest` type include campo opzionale `temperature: number`
- [ ] `callAnthropic` passa temperature nel body se presente
- [ ] `callGoogleAI` passa temperature nel body se presente
- [ ] `ai-tailor` mode "tailor" usa `temperature: 0.2` e `maxTokens: 8192`
- [ ] `cv-review` usa `temperature: 0.2` e `maxTokens: 8192`
- [ ] Le altre funzioni (prescreen, analyze, scrape-job) non specificano temperatura (usano default)

---

## Story 20.4 — Rimuovere requisiti impliciti da scrape-job + normalizzazione

**Priorita':** Must
**File:** `supabase/functions/scrape-job/index.ts`

### Problema

Il prompt di scrape-job (righe 220-225) dice: "Infer implicit ones: If the posting mentions team lead, infer leadership skills... Add these as nice_to_have". Gemini 2.5 Flash interpreta questa istruzione in modo aggressivo, aggiungendo skill fantasma che poi inquinano il matching in prescreen e il tailoring.

Inoltre, il job data non viene normalizzato dopo l'estrazione AI: possibili duplicati in required_skills e nice_to_have, artefatti HTML nella description.

### Cosa fare

1. Nel system prompt della funzione `callAI` (riga 211), **rimuovere completamente** le righe 220-225 (sezione "IMPLICIT REQUIREMENTS")

2. Sostituire con:
   ```
   ## EXTRACTION RULES
   - Extract ONLY requirements EXPLICITLY stated in the job posting text
   - Do NOT infer, assume, or add requirements not written in the text
   - nice_to_have: ONLY if the posting uses explicit words like "nice to have", "preferred", "bonus", "plus", "ideale", "gradito", "preferibile"
   - If a requirement is ambiguous (not clearly mandatory or optional), classify as "preferred" in key_requirements, do NOT add to required_skills
   ```

3. Dopo la chiamata AI (dopo riga 264, `validateOutput`), aggiungere normalizzazione server-side:
   ```
   // Deduplicate skills
   if (Array.isArray(result.required_skills)) {
     result.required_skills = [...new Set(result.required_skills.map(s => s.trim()))];
   }
   if (Array.isArray(result.nice_to_have)) {
     result.nice_to_have = [...new Set(
       result.nice_to_have
         .map(s => s.trim())
         .filter(s => !result.required_skills?.some(r => r.toLowerCase() === s.toLowerCase()))
     )];
   }
   // Clean HTML artifacts from description
   if (typeof result.description === "string") {
     result.description = result.description
       .replace(/<[^>]+>/g, "")
       .replace(/&[a-z]+;/gi, " ")
       .replace(/\s{2,}/g, " ")
       .trim();
   }
   ```

### Criteri di accettazione

- [ ] Sezione "IMPLICIT REQUIREMENTS" rimossa dal prompt di scrape-job
- [ ] Nuova sezione "EXTRACTION RULES" che vieta inferenze
- [ ] required_skills deduplicato dopo AI call
- [ ] nice_to_have deduplicato e senza overlap con required_skills
- [ ] Artefatti HTML rimossi dalla description
- [ ] L'annuncio viene estratto correttamente (testare con 2-3 URL reali)

---

## Story 20.3 — Validazione server-side post-patch

**Priorita':** Must
**File:** `supabase/functions/ai-tailor/index.ts` (dopo applyPatches, prima di checkIntegrity)

### Problema

Dopo che le patch vengono applicate al CV (riga 717), il codice fa solo:
- Strip quote dalle skill (righe 722-734)
- Converte bullet stringa in array (righe 736-744)

Mancano validazioni critiche: bullet vuoti/placeholder, skill duplicate, skill ordinate, stringhe vuote.

### Cosa fare

Dopo `applyPatches` e dopo il blocco di skill quote-stripping (riga 734), aggiungere un blocco di validazione:

**1. Rimuovere bullet fantasma:**
```
// Remove ghost/placeholder bullets
if (Array.isArray(cvExperience)) {
  for (const exp of cvExperience) {
    if (Array.isArray(exp.bullets)) {
      exp.bullets = exp.bullets.filter((b: string) =>
        typeof b === "string" &&
        b.trim().length >= 10 &&
        !/^[•\-…\.·\s]+$/.test(b.trim()) &&
        !/^\.{2,}/.test(b.trim())
      );
    }
  }
}
```

**2. Deduplicare skill:**
```
if (cvSkills && typeof cvSkills === "object") {
  for (const key of ["technical", "soft", "tools"]) {
    if (Array.isArray(cvSkills[key])) {
      const seen = new Set<string>();
      cvSkills[key] = cvSkills[key].filter((s: string) => {
        if (typeof s !== "string") return false;
        const normalized = s.trim().toLowerCase();
        if (!normalized || normalized === "..." || seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });
    }
  }
}
```

**3. Ordinare skill per rilevanza al job posting:**
```
// Reorder skills by job relevance (server-side guarantee)
const jobSkills = (job_data?.required_skills || []).map((s: string) => s.toLowerCase());
const jobNice = (job_data?.nice_to_have || []).map((s: string) => s.toLowerCase());

if (cvSkills && typeof cvSkills === "object") {
  for (const key of ["technical", "soft", "tools"]) {
    if (Array.isArray(cvSkills[key]) && cvSkills[key].length > 1) {
      cvSkills[key].sort((a: string, b: string) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const aRequired = jobSkills.some(j => aLower.includes(j) || j.includes(aLower));
        const bRequired = jobSkills.some(j => bLower.includes(j) || j.includes(bLower));
        const aNice = jobNice.some(j => aLower.includes(j) || j.includes(aLower));
        const bNice = jobNice.some(j => bLower.includes(j) || j.includes(bLower));
        if (aRequired && !bRequired) return -1;
        if (!aRequired && bRequired) return 1;
        if (aNice && !bNice) return -1;
        if (!aNice && bNice) return 1;
        return 0; // preserve AI order for non-matching skills
      });
    }
  }
}
```

**4. Rimuovere bullet troppo lunghi o truncati:**
```
if (Array.isArray(cvExperience)) {
  for (const exp of cvExperience) {
    if (Array.isArray(exp.bullets)) {
      exp.bullets = exp.bullets.map((b: string) => {
        if (typeof b !== "string") return b;
        // Trim trailing "..." that indicate truncation
        return b.replace(/\.\.\.\s*$/, "").trim();
      }).filter((b: string) => typeof b === "string" && b.trim().length >= 10);
    }
  }
}
```

### Nota

Il `job_data` deve essere accessibile nel punto dove avviene la validazione. Attualmente e' nel body della request (riga 585). Verificare che sia in scope.

### Criteri di accettazione

- [ ] Bullet con meno di 10 caratteri rimossi dopo patch
- [ ] Bullet placeholder ("...", "•", "- ") rimossi dopo patch
- [ ] Skill duplicate rimosse (case-insensitive)
- [ ] Skill vuote e placeholder rimossi
- [ ] Skill ordinate per rilevanza al job posting (required first, poi nice_to_have, poi resto)
- [ ] Trailing "..." rimosso dai bullet troncati
- [ ] Nessun array vuoto risultante (se tutti i bullet vengono rimossi, mantenere l'originale)

---

## Story 20.6 — Irrobustire integrity-check

**Priorita':** Must
**File:** `supabase/functions/_shared/integrity-check.ts`

### Problema

L'integrity check attuale cattura solo metriche quantitative inventate (numeri, percentuali, importi). Non cattura:
- Claim qualitativi inventati ("con risultati eccellenti", "migliorando significativamente", "ottimizzando i processi")
- Bullet con contenuto completamente diverso dall'originale (riscrittura totale)
- Bullet che aggiungono outcome/risultati non presenti nell'originale

### Cosa fare

**1. Aggiungere pattern per claim qualitativi inventati:**

Dopo `METRIC_PATTERNS` (riga 66), aggiungere:

```
// Qualitative claim patterns that signal invented outcomes
const QUALITATIVE_CLAIM_PATTERNS = [
  /risultat[io]\s+(eccellent|misurabili|significativ|straordinari|ottim)/i,
  /migliorand[eo]\s+(significativamente|notevolmente|drasticamente|sensibilmente)/i,
  /ottimizzand[eo]\s+(i\s+processi|le\s+performance|l['']efficienza)/i,
  /leading\s+to\s+(significant|measurable|substantial)/i,
  /resulting\s+in\s+(improved|increased|decreased|reduced)/i,
  /achieving\s+(significant|outstanding|exceptional)/i,
  /con\s+successo\b/i,
  /with\s+outstanding\s+results/i,
  /driving\s+(significant|substantial)\s+(growth|improvement|results)/i,
  /contribu[a-z]+\s+(significativamente|in\s+modo\s+determinante)/i,
];
```

**2. Nella sezione "Fabricated metrics in bullets" (riga 144), aggiungere check per claim qualitativi:**

Dopo il check delle metriche fabricate, aggiungere:

```
// Check for qualitative claims not in original
const qualClaims = QUALITATIVE_CLAIM_PATTERNS.filter(p => p.test(bullet));
if (qualClaims.length > 0) {
  // Only flag if the qualitative claim phrase is NOT in the original text
  const hasInOriginal = qualClaims.some(p => p.test(origBulletsJoined));
  if (!hasInOriginal && origBullet) {
    warnings.push(
      `Experience[${i}].bullets[${b}]: qualitative claim detected not in original, reverted`
    );
    tailBullets[b] = origBullet;
    reverts.bullets_reverted++;
  }
}
```

**3. Aggiungere check per bullet completamente riscritti:**

Se un bullet tailorato non condivide NESSUNA parola significativa (>4 caratteri) con il bullet originale corrispondente, probabilmente e' stato inventato:

```
// Check for completely rewritten bullets (no shared significant words)
if (origBullet && typeof origBullet === "string" && origBullet.length > 10) {
  const origWords = new Set(
    origBullet.toLowerCase().split(/\s+/).filter(w => w.length > 4)
  );
  const tailWords = bullet.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  const shared = tailWords.filter(w => origWords.has(w));

  // If less than 20% of significant words are shared, the bullet was likely fabricated
  if (origWords.size > 3 && shared.length / Math.max(tailWords.length, 1) < 0.15) {
    warnings.push(
      `Experience[${i}].bullets[${b}]: completely rewritten with no connection to original, reverted`
    );
    tailBullets[b] = origBullet;
    reverts.bullets_reverted++;
  }
}
```

**4. Aggiungere validazione lunghezza bullet:**

Dopo tutti i check per esperienza, aggiungere:
```
// Remove bullets that are too short (< 10 chars) or just ellipsis
if (Array.isArray(tExp.bullets)) {
  tExp.bullets = tExp.bullets.filter((b: string) =>
    typeof b === "string" && b.trim().length >= 10 && !/^[•\-…\.·\s]+$/.test(b.trim())
  );
  // If all bullets were removed, restore originals
  if (tExp.bullets.length === 0 && origBullets.length > 0) {
    tExp.bullets = [...origBullets];
    warnings.push(`Experience[${i}]: all bullets invalid, restored originals`);
  }
}
```

### Criteri di accettazione

- [ ] Claim qualitativi inventati ("risultati misurabili", "migliorando significativamente") vengono revertati se non presenti nell'originale
- [ ] Bullet completamente riscritti (nessuna parola in comune con l'originale) vengono revertati
- [ ] Bullet troppo corti (< 10 caratteri) vengono rimossi
- [ ] Bullet placeholder ("...", "•") vengono rimossi
- [ ] Se tutti i bullet vengono invalidati, l'originale viene ripristinato
- [ ] I pattern funzionano sia in italiano che in inglese

---

## Story 20.5 — cv-review con CV originale + integrity check post-review

**Priorita':** Must
**File:** `supabase/functions/cv-review/index.ts`, `supabase/functions/ai-tailor/index.ts` (chiamata a cv-review)

### Problema

cv-review riceve SOLO il CV tailorato + lingua + ruolo. Non ha il CV originale come riferimento e non ha l'annuncio. Dopo cv-review, non c'e' nessun integrity check — qualsiasi invenzione di Haiku 4.5 passa al PDF finale.

### Cosa fare

**1. Modificare l'input di cv-review:**

La request body deve accettare anche `original_cv` e `job_requirements`:
```
const { cv, detected_language, role_title, original_cv, job_requirements } = await req.json();
```

**2. Modificare il prompt di cv-review (SYSTEM_PROMPT):**

Aggiungere dopo "You receive a tailored CV (JSON) and must return a PERFECTED version following these 10 rules.":

```
You also receive the ORIGINAL CV (before tailoring) as ground truth.

## GROUND TRUTH RULE
For every bullet, description, and skill in the tailored CV:
- If the content cannot be traced back to the original CV, REVERT it to the original wording
- If the tailored version adds metrics (%, numbers, amounts) not in the original, REMOVE them
- If the tailored version adds qualitative outcomes ("con risultati misurabili", "migliorando significativamente") not in the original, REMOVE them
- When in doubt, prefer the original wording over the tailored version

The original CV is the SOURCE OF TRUTH. Your job is to POLISH, not to INVENT.
```

**3. Aggiungere job context nel user message (riga 235):**
```
const userMessage = `## CONTEXT
Target language: ${lang}
Target role: ${role}
${jobReqs ? `Job requirements: ${JSON.stringify(jobReqs)}` : ""}

## ORIGINAL CV (GROUND TRUTH — every claim must be traceable to this)
${original_cv ? JSON.stringify(original_cv) : "Not provided"}

## TAILORED CV TO REVIEW
${JSON.stringify(cvForReview)}

Apply all 10 rules. EVERY text field must be in "${lang}". Fix ALL bullets to start with action verbs. Remove all artifacts and clichés.
CRITICAL: if ANY content in the tailored CV is not traceable to the original CV, revert it to the original.`;
```

**4. Aggiungere integrity check DOPO cv-review (nel file cv-review/index.ts):**

Dopo la riga che ripristina personal data (riga 279), aggiungere:

```
// Integrity check: validate reviewed CV against original
if (original_cv) {
  const { checkIntegrity } = await import("../_shared/integrity-check.ts");
  const integrityResult = checkIntegrity(original_cv, parsed as Record<string, unknown>);
  if (integrityResult.warnings.length > 0) {
    console.warn(`[cv-review] Integrity: ${integrityResult.warnings.length} issues corrected`);
  }
}
```

**5. Aggiornare la chiamata a cv-review nel frontend** (o in qualunque punto venga chiamata):

Passare `original_cv` e `job_requirements` nel body della request.

### Criteri di accettazione

- [ ] cv-review accetta `original_cv` e `job_requirements` nel body (opzionali per retrocompatibilita')
- [ ] Il prompt di cv-review include la regola GROUND TRUTH
- [ ] Il user message include il CV originale se presente
- [ ] `checkIntegrity` viene eseguito dopo cv-review (solo se original_cv presente)
- [ ] I dati personali vengono ripristinati dall'originale (gia' implementato, verificare che non sia stato rimosso)
- [ ] Se `original_cv` non viene passato, il comportamento resta identico all'attuale (retrocompatibilita')

---

## Story 20.9 — Fix prompt cv-review

**Priorita':** Should
**File:** `supabase/functions/cv-review/index.ts` (SYSTEM_PROMPT)

### Problema

La regola 2 del prompt attuale ha un esempio che INVITA ad aggiungere claim:
```
Bad: "CRM project management" → Good: "Gestito il progetto CRM aziendale con risultati misurabili"
```
"con risultati misurabili" e' un'invenzione — se il bullet originale dice solo "CRM project management", i "risultati misurabili" non esistono.

Inoltre, la lista di cliche' italiane (regola 7, riga 42) non include equivalenti inglesi.

### Cosa fare

1. Sostituire l'esempio nella regola 2:
   ```
   Bad: "CRM project management" → Good: "Gestito il progetto CRM aziendale"
   ```
   (Rimuovere "con risultati misurabili")

2. Aggiungere un secondo esempio:
   ```
   Bad: "Sales activities" → Good: "Gestito le attivita' commerciali e la relazione con i clienti"
   ```

3. Nella regola 7, estendere la lista cliche' con equivalenti inglesi:
   ```
   Remove generic clichés: "Comunicazione Efficace", "Problem Solving", "Team Working",
   "Lavoro di Squadra", "Capacità di Adattamento", "Orientamento al Risultato",
   "Effective Communication", "Teamwork", "Adaptability", "Results-Oriented",
   "Self-Motivated", "Detail-Oriented", "Proactive", "Dynamic Professional"
   ```

4. Aggiungere una regola 11:
   ```
   ### 11. NO INVENTED OUTCOMES
   If a bullet in the input contains no metrics or results, do NOT add them.
   "Managed CRM project" → "Gestito il progetto CRM" (not "...con risultati eccellenti").
   Your job is to POLISH language, not to INVENT results.
   ```

### Criteri di accettazione

- [ ] Esempio regola 2 non contiene piu' "con risultati misurabili"
- [ ] Lista cliche' include equivalenti inglesi
- [ ] Nuova regola 11 "NO INVENTED OUTCOMES" presente
- [ ] Prompt non supera le 90 righe

---

## Story 20.7 — CV leggibile per l'AI + copertura patch traduzione

**Priorita':** Should
**File:** `supabase/functions/ai-tailor/index.ts`

### Problema

1. Il CV viene passato all'AI come `JSON.stringify(compactedCV)` — un muro di testo senza formattazione. Su CV lunghi, il modello perde il contesto delle esperienze piu' vecchie.

2. Quando la lingua del CV originale differisce dalla target language, il prompt dice di generare patch per tutti i campi testuali. Ma nessun check server-side verifica che questa copertura sia completa. Se il modello dimentica di tradurre education o certifications, il CV esce bilingue.

### Cosa fare

**1. Formattare il CV per l'AI (riga 675):**
```
// Format CV for readability (costs ~200 extra tokens, greatly improves comprehension)
const cvForAi = JSON.stringify(compactedCV, null, 2);
let userContent = "CANDIDATE CV:\n" + cvForAi + "\n\nJOB POSTING:\n" + JSON.stringify(job_data, null, 2);
```

**2. Dopo apply patches, verificare copertura traduzione:**

Quando `analyze_context.detected_language` differisce dalla lingua prevalente del CV originale, verificare che tutte le sezioni testuali abbiano un patch:

```
// Verify translation coverage when language differs
if (analyze_context?.detected_language) {
  const targetLang = analyze_context.detected_language;
  const sectionsToCheck = ["summary"];

  // Check if experience bullets are in target language (sample first experience)
  const firstExp = (tailoredCV as any)?.experience?.[0];
  if (firstExp?.bullets?.[0]) {
    // Simple heuristic: if summary was patched but first experience bullet
    // contains common words from wrong language, flag it
    // This is a safety net, not a perfect detector
    const patchedPaths = patches.map(p => p.path);
    const expPatched = patchedPaths.some(p => p.startsWith("experience"));
    const summaryPatched = patchedPaths.some(p => p === "summary");

    if (summaryPatched && !expPatched && originalCV.experience?.length > 0) {
      console.warn("[ai-tailor] Translation coverage: summary patched but no experience patches. Possible incomplete translation.");
    }
  }
}
```

### Criteri di accettazione

- [ ] CV e job posting passati all'AI con `JSON.stringify(data, null, 2)` (indentato)
- [ ] Warning in console se la traduzione sembra incompleta (summary patchato ma experience no)
- [ ] L'app funziona correttamente con il formato indentato (nessuna regressione)

---

## Story 20.8 — Preservare score_note AI + warning fallback

**Priorita':** Should
**File:** `supabase/functions/ai-tailor/index.ts` (funzione adjustScore), `supabase/functions/_shared/ai-provider.ts`

### Problema

1. `adjustScore` (riga 513) sovrascrive completamente la `score_note` dell'AI con un testo meccanico ("Punteggio adeguato: 2 gap critici"). L'AI aveva generato un'analisi piu' ricca e informativa.

2. Se la chiamata primaria (Anthropic) fallisce e viene usato il fallback (Gemini), l'utente non ne viene informato. La qualita' potrebbe essere significativamente peggiore.

### Cosa fare

**1. In adjustScore, appendere invece di sovrascrivere:**

Sostituire riga 513:
```
// OLD: r.score_note = "Punteggio adeguato: " + parts.join(", ") + ".";
// NEW: preserve AI insight, append adjustment reason
const adjustmentReason = "Punteggio adeguato per: " + parts.join(", ") + ".";
r.score_note = ((r.score_note as string) || "").trim() + " " + adjustmentReason;
```

**2. In ai-provider.ts, restituire il flag usedFallback (gia' presente):**

Verificare che `usedFallback: true` venga propagato nella risposta. E' gia' nel codice (riga 514, riga 539). Verificare che venga usato.

**3. In ai-tailor/index.ts, aggiungere quality_warning se fallback:**

Dopo la chiamata AI (riga 685), controllare se e' stato usato il fallback:
```
if (aiTailorResult.usedFallback) {
  result.quality_warning = "CV generato con modello AI secondario. Verifica attentamente il risultato.";
}
```

**4. Nel frontend, mostrare il warning se presente:**

Se `result.quality_warning` e' presente, mostrare un toast/banner giallo nella pagina di revisione.

### Criteri di accettazione

- [ ] score_note dell'AI preservata, con ragione dell'aggiustamento appendata
- [ ] `quality_warning` presente nella risposta se usato fallback
- [ ] Frontend mostra warning visibile se `quality_warning` presente (toast o banner)

---

## Story 20.10 — Riscrivere ats_checks in ai-tailor con i controlli ATS reali

**Priorita':** Must
**File:** `supabase/functions/ai-tailor/index.ts`

### Problema

L'attuale `ats_checks` restituito da `ai-tailor` contiene un solo check generico ("keywords") che non riflette i criteri reali con cui i sistemi ATS analizzano un CV. Il punteggio `ats_score` e' quindi una stima poco informativa — non segnala i problemi concreti che causano il rigetto automatico.

### Cosa fare

Sostituire il check generico con **11 controlli specifici**, derivati dalle regole ATS definite per `CV_ATS`. Ogni check e':
- Verificabile sul CV JSON (non richiede AI — e' logica deterministica)
- Mappato a un peso per il calcolo dello score finale
- Presentato all'utente con label leggibile + dettaglio + suggerimento di fix

### I 11 check (con peso)

| ID | Check | Cosa verifica | Peso |
|----|-------|---------------|------|
| `single_column` | Layout singola colonna | Il CV non ha strutture a 2 colonne (sidebar, layout affiancato) | 15 |
| `no_tables` | Nessuna tabella | Nessun campo contiene struttura tabulare o skill in grid | 10 |
| `contacts_in_body` | Contatti nel corpo | `personal.email`, `personal.phone`, `personal.location` presenti e non vuoti | 10 |
| `standard_sections` | Titoli sezione standard | Le sezioni usano nomi standard: Profilo, Esperienze, Formazione, Competenze, Certificazioni, Lingue | 10 |
| `no_special_chars` | Nessun carattere problematico | Nessun em dash `—`, en dash `–`, virgolette tipografiche `"` `"`, emoji nei campi testo | 10 |
| `date_format` | Date consistenti | Tutte le date nel formato MM/YYYY, nessuna data senza mese, nessun formato misto | 10 |
| `acronyms_expanded` | Acronimi espansi | Gli acronimi comuni (AI, ML, RPA, CRM, ERP, KPI, ecc.) hanno la forma estesa alla prima occorrenza | 5 |
| `keyword_rate` | Keyword match rate 65-75% | Match rate tra keyword del CV e keyword del JD. Pass se 65-75%, warning se <65%, fail se >75% | 15 |
| `no_photos` | Nessuna foto | `photo_url` assente o rimossa dal CV ATS (la foto e' nel CV visual, non nell'ATS) | 5 |
| `bullet_quality` | Bullet non vuoti | Nessun bullet vuoto, nessun placeholder ("...", "•", trattino solo) | 5 |
| `plain_text_order` | Ordine plain text | L'ordine delle sezioni nel JSON corrisponde all'ordine standard atteso dall'ATS | 5 |

**Score totale:** somma dei pesi dei check `pass`. Max 100.

### Logica di calcolo (deterministica, non AI)

I check vengono eseguiti **sul CV JSON dopo le patch**, prima di restituire la risposta. Non richiedono una chiamata AI aggiuntiva.

```typescript
interface ATSCheck {
  check: string;         // ID del check
  label: string;         // Label leggibile per l'utente
  status: "pass" | "warning" | "fail";
  detail: string;        // Cosa e' stato trovato
  suggestion?: string;   // Come risolvere (solo se warning/fail)
  weight: number;        // Peso nel calcolo score
}

function runATSChecks(cv: TailoredCV, jdKeywords: string[]): { checks: ATSCheck[], score: number } {
  const checks: ATSCheck[] = [];

  // single_column — sempre pass per CV generato da Verso (struttura JSON non ha sidebar)
  // Controlla che non ci siano hint di layout a colonne nei bullet o nel summary
  checks.push(checkSingleColumn(cv));

  // no_tables — controlla pattern tabulari nei testi (tab multipli, pipe separatori)
  checks.push(checkNoTables(cv));

  // contacts_in_body
  checks.push(checkContactsInBody(cv));

  // standard_sections — verifica che le chiavi JSON mappino a sezioni standard
  checks.push(checkStandardSections(cv));

  // no_special_chars — regex su tutti i campi testo
  checks.push(checkNoSpecialChars(cv));

  // date_format — regex MM/YYYY su tutte le date
  checks.push(checkDateFormat(cv));

  // acronyms_expanded — lista di acronimi comuni, verifica prima occorrenza
  checks.push(checkAcronymsExpanded(cv));

  // keyword_rate — conta keyword JD presenti nel testo del CV
  checks.push(checkKeywordRate(cv, jdKeywords));

  // no_photos
  checks.push(checkNoPhotos(cv));

  // bullet_quality
  checks.push(checkBulletQuality(cv));

  // plain_text_order
  checks.push(checkPlainTextOrder(cv));

  // Score: somma pesi dei check pass + meta' peso dei warning
  const score = checks.reduce((acc, c) => {
    if (c.status === "pass") return acc + c.weight;
    if (c.status === "warning") return acc + Math.floor(c.weight / 2);
    return acc;
  }, 0);

  return { checks, score };
}
```

### Dettaglio check `no_special_chars`

```typescript
function checkNoSpecialChars(cv: TailoredCV): ATSCheck {
  const allText = extractAllText(cv); // concat tutti i campi stringa
  const problems: string[] = [];

  if (/—/.test(allText)) problems.push("em dash (—)");
  if (/–/.test(allText)) problems.push("en dash (–)");
  if (/[""'']/.test(allText)) problems.push("virgolette tipografiche");
  if (/[\u{1F300}-\u{1FFFF}]/u.test(allText)) problems.push("emoji");

  return {
    check: "no_special_chars",
    label: "Caratteri compatibili ATS",
    status: problems.length === 0 ? "pass" : "fail",
    detail: problems.length === 0
      ? "Nessun carattere problematico trovato"
      : `Trovati: ${problems.join(", ")}`,
    suggestion: problems.length > 0
      ? "Sostituire em dash e en dash con trattino (-), rimuovere emoji"
      : undefined,
    weight: 10,
  };
}
```

### Dettaglio check `keyword_rate`

```typescript
function checkKeywordRate(cv: TailoredCV, jdKeywords: string[]): ATSCheck {
  const cvText = extractAllText(cv).toLowerCase();
  const matched = jdKeywords.filter(kw => cvText.includes(kw.toLowerCase()));
  const rate = jdKeywords.length > 0 ? matched.length / jdKeywords.length : 0;
  const percentage = Math.round(rate * 100);

  let status: "pass" | "warning" | "fail";
  let detail: string;
  let suggestion: string | undefined;

  if (percentage >= 65 && percentage <= 75) {
    status = "pass";
    detail = `${percentage}% match rate — nella fascia ottimale (65-75%)`;
  } else if (percentage < 65) {
    status = "warning";
    detail = `${percentage}% match rate — sotto il minimo consigliato (65%)`;
    suggestion = "Inserire nel testo le keyword mancanti in modo naturale";
  } else {
    status = "fail";
    detail = `${percentage}% match rate — sopra il 75%, rischio keyword stuffing`;
    suggestion = "Ridurre le ripetizioni di keyword, riscrivere in modo piu' naturale";
  }

  return { check: "keyword_rate", label: "Keyword match rate", status, detail, suggestion, weight: 15 };
}
```

### Aggiornamento output ai-tailor

L'output `ats_checks` passa da:
```json
[{ "check": "keywords", "label": "Parole chiave presenti", "status": "pass", "detail": "..." }]
```

A:
```json
[
  { "check": "single_column",    "label": "Layout singola colonna",        "status": "pass",    "detail": "Struttura lineare rilevata",                "weight": 15 },
  { "check": "no_tables",        "label": "Nessuna tabella",               "status": "pass",    "detail": "Nessuna struttura tabulare trovata",        "weight": 10 },
  { "check": "contacts_in_body", "label": "Contatti nel corpo",            "status": "pass",    "detail": "Email, telefono, luogo presenti",           "weight": 10 },
  { "check": "standard_sections","label": "Titoli sezione standard",       "status": "pass",    "detail": "Tutte le sezioni hanno nomi standard",      "weight": 10 },
  { "check": "no_special_chars", "label": "Caratteri compatibili ATS",     "status": "warning", "detail": "Trovati: em dash (—)",                      "suggestion": "Sostituire con trattino (-)", "weight": 10 },
  { "check": "date_format",      "label": "Date in formato MM/YYYY",       "status": "pass",    "detail": "Tutte le date nel formato corretto",        "weight": 10 },
  { "check": "acronyms_expanded","label": "Acronimi espansi",              "status": "warning", "detail": "AI non espanso alla prima occorrenza",      "suggestion": "Scrivere 'Intelligenza Artificiale (AI)'", "weight": 5 },
  { "check": "keyword_rate",     "label": "Keyword match rate",            "status": "pass",    "detail": "71% match rate — nella fascia ottimale",    "weight": 15 },
  { "check": "no_photos",        "label": "Nessuna foto nel CV ATS",       "status": "pass",    "detail": "Foto assente",                              "weight": 5 },
  { "check": "bullet_quality",   "label": "Bullet non vuoti",              "status": "pass",    "detail": "Tutti i bullet hanno contenuto",            "weight": 5 },
  { "check": "plain_text_order", "label": "Ordine sezioni corretto",       "status": "pass",    "detail": "Sezioni in ordine standard",                "weight": 5 }
]
```

`ats_score` = somma pesi check `pass` + meta' peso check `warning` = numero 0-100.

### Impatto sul frontend

Lo step revisione (StepRevisione) mostra gia' `ats_checks` come lista. Con i nuovi 11 check la lista diventa piu' informativa: ogni `warning` o `fail` mostra anche `suggestion`.

La card ATS Score in StepExport mostra il numero. Nessuna modifica necessaria al layout — solo il contenuto dei check cambia.

### Criteri di accettazione

- [ ] 11 check implementati come funzioni pure (no AI, logica deterministica)
- [ ] `ats_score` calcolato dalla somma dei pesi (pass = peso pieno, warning = meta', fail = 0)
- [ ] Check `no_special_chars` rileva em dash, en dash, virgolette tipografiche, emoji
- [ ] Check `keyword_rate` calcola il match rate e distingue <65% / 65-75% / >75%
- [ ] Check `date_format` valida pattern MM/YYYY su tutti i campi data del CV
- [ ] Check `contacts_in_body` verifica email + telefono + location non vuoti
- [ ] Ogni check warning/fail include un campo `suggestion` con il fix concreto
- [ ] Output `ats_checks` compatibile con il frontend esistente (stessa struttura, campi aggiuntivi opzionali)
- [ ] `jdKeywords` passati come parametro (estratti dal job posting gia' disponibile in ai-tailor)

---

## Criteri di accettazione globali

- [ ] L'AI non inventa metriche, KPI, percentuali, team size non presenti nel CV originale
- [ ] Nessun bullet vuoto, placeholder ("..."), o troncato nel CV finale
- [ ] Le competenze sono ordinate per rilevanza al ruolo target
- [ ] Il CV finale e' in una sola lingua (niente mix involontario)
- [ ] Il summary descrive il candidato reale, non il ruolo target
- [ ] Ogni claim nel CV tailorato e' tracciabile al CV originale
- [ ] cv-review non introduce nuove invenzioni
- [ ] L'utente viene avvisato se viene usato il modello fallback
- [ ] CV lunghi (8+ esperienze) non causano troncamento o errori
