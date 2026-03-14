import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { compactCV } from "../_shared/compact-cv.ts";
import { callAi } from "../_shared/ai-provider.ts";
import { validateOutput } from "../_shared/validate-output.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// --- Utility: apply patches to original CV with validation ---
function applyPatches(
  original: Record<string, unknown>,
  patches: Array<{ path: string; value: unknown }>
): { result: Record<string, unknown>; skipped_patches: string[] } {
  const result = JSON.parse(JSON.stringify(original));
  const skipped: string[] = [];

  for (const patch of patches) {
    const { path, value } = patch;

    // Validate path format
    if (!path || typeof path !== "string") {
      skipped.push("Invalid path: " + String(path));
      continue;
    }

    const segments = path.replace(/\[(\d+)\]/g, ".$1").split(".");
    let target: unknown = result;
    let valid = true;

    for (let i = 0; i < segments.length - 1; i++) {
      if (target === null || target === undefined || typeof target !== "object") {
        console.warn("applyPatches: skipping patch \"" + path + "\" — invalid traversal at segment " + i);
        skipped.push(path);
        valid = false;
        break;
      }
      const seg = segments[i];
      const idx = Number(seg);
      if (!isNaN(idx)) {
        // Bounds check for array access
        if (Array.isArray(target) && (idx < 0 || idx >= (target as unknown[]).length)) {
          console.warn(`applyPatches: skipping patch "${path}" — array index ${idx} out of bounds`);
          skipped.push(path);
          valid = false;
          break;
        }
        target = (target as Record<string, unknown>)[idx as unknown as string];
      } else {
        const obj = target as Record<string, unknown>;
        if (obj[seg] === undefined || obj[seg] === null) {
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

  return { result, skipped_patches: skipped };
}

// ==================== SYSTEM PROMPTS ====================

const SYSTEM_PROMPT_ANALYZE = `You are an expert career coach and ATS specialist for the European job market.

## CRITICAL RULE — TWO-LEVEL LANGUAGE POLICY
1. Detect the language of the JOB POSTING. Report it in detected_language.
2. ANALYSIS & UI TEXT (score_note, seniority_match.note, ats_checks label/detail, suggestions messages, learning_suggestions resource_name/duration) 
   MUST ALWAYS be in ITALIAN, regardless of the job posting language.
This rule is ABSOLUTE. No exceptions.

## LANGUAGE POLICY EXAMPLES
- Job posting in English → detected_language: "en", but score_note in Italian: "Il candidato ha un buon match..."
- Job posting in German → detected_language: "de", but ats_checks detail in Italian: "Le keyword principali sono presenti..."

Compare the candidate's CV with the job posting and produce an analysis. Do NOT generate any CV modifications or patches — only analyze.

## SCORE PENALIZATION FOR MANDATORY GAPS
If the candidate is missing MANDATORY requirements (especially years of experience, required certifications, required degree):
- If there are UNBRIDGEABLE mandatory gaps: match_score MUST NOT exceed 40%
- Each mandatory gap reduces the max achievable score significantly
- Be honest: a candidate missing critical requirements should see a low score

## ADDITIONAL CONTEXT FROM CANDIDATE
If the user section contains "CANDIDATE FOLLOW-UP ANSWERS", use those answers to:
- Discover implicit skills or experience not explicit in the CV
- Adjust the score upward if answers reveal relevant hidden experience

## STRUCTURED FOLLOW-UP ANSWER RULES
When answers include a "Level" field, apply these constraints:
- Level "expert": The skill counts as "has" in skills_present. May increase match_score up to +8 points per skill.
- Level "some": The skill stays in skills_missing but with severity reduced to "minor". May increase match_score up to +3 points.
- Level "learning": No effect on score. Skill stays in skills_missing. May appear in learning_suggestions as "partially in progress".
- Level "none": Confirms the gap. No changes.
- If only free text is present (no Level — legacy format): Treat as "some" level.

## SKILL GAP SEVERITY
For each missing skill, assess severity:
- critical: Mandatory requirement, clearly missing, would take 1+ years to acquire (e.g., "5 years Java experience" when candidate has 0)
- moderate: Important requirement, partially present or acquirable in 3-12 months
- minor: Nice-to-have or easily learnable in < 3 months

## REQUIRED OUTPUT

### 1. MATCH SCORE (0-100)
Overall compatibility percentage between CV and job posting.

### 2. ATS SCORE (0-100)
ATS compatibility score. Evaluate 7 specific checks:
- **keywords**: Are the job posting keywords present in the CV?
- **format**: Is the format ATS-friendly?
- **dates**: Are dates in a standard, consistent format?
- **measurable**: Are results quantified with numbers/percentages?
- **cliches**: No empty phrases without context?
- **sections**: Are all standard sections present?
- **action_verbs**: Do bullet points start with strong action verbs?

### 3. SKILLS ANALYSIS
- skills_present: list of skills required by the job with indication whether the candidate has them
- skills_missing: missing skills with importance level and severity

### 4. SENIORITY MATCH
Compare the candidate's seniority level with what the role requires.

## EUROPEAN MARKET CALIBRATION
- Laurea triennale = Bachelor's degree, Laurea magistrale = Master's degree
- Consider professional registers and European certifications

Respond ONLY with the required tool function call.`;

const SYSTEM_PROMPT_TAILOR = `You are an expert career coach and ATS specialist for the European job market.

## CRITICAL RULE — TWO-LEVEL LANGUAGE POLICY
1. CV CONTENT (tailored_patches values, summary, bullets, skill labels, descriptions) 
   MUST be in the TARGET LANGUAGE chosen by the user (provided as detected_language in the PRIOR ANALYSIS CONTEXT).
   This is the user's explicit choice — it may differ from the job posting language. ALWAYS respect it.
2. ANALYSIS & UI TEXT (diff reasons, structural_changes reason/item) 
   MUST ALWAYS be in ITALIAN, regardless of the job posting language.
This rule is ABSOLUTE. No exceptions.

## LANGUAGE CONSISTENCY — ABSOLUTE RULE
The ENTIRE tailored CV content MUST be in ONE single language: the TARGET language specified in detected_language.
This means ALL of the following must be in the SAME language:
- summary
- ALL experience descriptions and bullets (every single one)
- ALL skill labels (technical, soft, tools)
- ALL education descriptions
- ALL certification names (keep original if proper nouns)
- ALL project descriptions

NEVER mix languages within the CV. If detected_language is "en", the ENTIRE CV must be in English.
If detected_language is "it", the ENTIRE CV must be in Italian. The user's choice overrides the job posting language.

Common mistake to AVOID: translating some bullets but leaving others in the original language.
Check EVERY bullet and EVERY section before finalizing.

## SKILL LABEL RULES
- Translate generic/descriptive skills to detected_language ("Project Management" → "Gestione progetti", "Team Leadership" → "Leadership del team", "Cross-functional Collaboration" → "Collaborazione interfunzionale").
- Keep proper nouns and technology names as-is: React, SQL, Figma, AWS, Jira, Python, etc.
- NEVER wrap skill names in quotes. Wrong: "React". Correct: React.

## LANGUAGE POLICY EXAMPLES
- Job posting in English → ALL patches values in English, but diff reasons in Italian: "Aggiunto keyword rilevante..."
- Job posting in Italian → ALL patches values in Italian, but diff reasons still in Italian

You receive the candidate's CV, the job posting, and a prior analysis with skills_missing, match_score, etc.
Your ONLY job is to generate CV modifications (patches).

## ABSOLUTE RULE — EXPERIENCE PROTECTION
You MUST NEVER remove ALL experiences from the CV. The experience section is the core of any CV.
You CAN:
- Remove 1-2 irrelevant experiences (e.g. waiter job for a software role)
- Reorder experiences by relevance
- Condense bullet points
You CANNOT:
- Remove the entire experience array
- Leave the candidate with zero experiences
- Remove more than 50% of the total experiences
The tailored CV MUST always have at least 2 experiences, or all original ones if there are 2 or fewer.

## TWO-LEVEL TAILORING

### Level 1 — STRUCTURAL (what to keep/remove/reorder)
- REMOVE experiences completely irrelevant to the target role
- REORDER experiences by relevance to the job
- CONDENSE verbose bullet lists (max 4-5 bullets per experience)
- REMOVE irrelevant projects, certifications, or extra sections

### Level 2 — CONTENT (how to rewrite what remains)
- Summary: 2-3 sentences maximum, specific to this role
- Bullets: action verb + measurable result, one line each
- Skills: ordered by relevance, remove generic/obvious ones

## CONCISENESS RULE
A well-targeted 1-page CV beats a generic 3-page CV.
Every word must earn its place.

## TAILORED PATCHES
Return ONLY the CV sections you modified, as an array of patches.
Each patch has:
- path: JSON path in the CV (e.g. "summary", "experience[0].bullets", "skills.technical", "experience")
- value: the new value for that field

Return ONLY the fields you actually changed.
CRITICAL EXCEPTION: if the CV language differs from detected_language, you MUST generate patches for ALL text fields to translate them completely. This includes: summary, every experience's description and bullets, skills.technical, skills.soft, skills.tools, all education fields, certifications, and projects. In this case, translation IS tailoring — every text field needs a patch.

## FUNDAMENTAL RULES
- You CANNOT invent new experiences, degrees, or certifications
- You CANNOT modify dates, company names, degree titles, grades
- You CANNOT touch personal data or photo_base64

## CV QUALITY RULES — APPLY TO ALL GENERATED PATCHES
Apply these quality rules to EVERY patch value you generate. The output must be publication-ready.

1. **LANGUAGE UNIFORMITY**: Every text field MUST be in detected_language. Zero mixing. Exception: proper nouns (React, AWS, Jira).
2. **BULLET = ACTION VERB + RESULT**: Every bullet MUST start with a strong action verb (past tense for past roles, present for current). Bad: "CRM project management" → Good: "Gestito il progetto CRM con risultati misurabili"
3. **CAPITALIZATION**: First letter of every bullet, description, summary sentence MUST be uppercase.
4. **ARTIFACT REMOVAL**: Remove prefixes ("I:", "- ", "1.", "1)"), wrapping quotes on skills ("React" → React), trailing whitespace, markdown formatting.
5. **SKILL DEDUPLICATION**: Remove duplicates (case-insensitive), generic clichés ("Problem Solving", "Team Working", "Comunicazione Efficace"), and skills that are just job titles.
6. **MAX 4-5 BULLETS**: Per experience. Merge similar bullets. Prioritize measurable results.
7. **DATE FORMAT CONSISTENCY**: All dates in ONE format natural for detected_language (IT: "Gen 2021", EN: "Jan 2021").
8. **SUMMARY QUALITY**: 2-3 sentences max, specific to target role, no filler phrases ("dynamic professional", "passionate about").
9. **CERTIFICATION VALIDATION**: Must have name + issuer. Remove descriptive sentences posing as certifications.
10. **ORPHAN TEXT**: Move misplaced text to correct section or remove if duplicate.

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
- If only free text is present (no Level — legacy format):
  - Treat as "some" level. Use detail for context only, never as source for new content.

Respond ONLY with the required tool function call.

// ==================== TOOL SCHEMAS ====================

const TOOL_SCHEMA_ANALYZE = {
  type: "function",
  function: {
    name: "analyze_cv",
    description: "Analyze CV-job match — scores, skills, seniority, ATS checks only. No patches.",
    parameters: {
      type: "object",
      properties: {
        detected_language: {
          type: "string",
          description: "ISO 639-1 language code detected from the job posting",
        },
        match_score: { type: "number", description: "Overall match score 0-100" },
        ats_score: { type: "number", description: "ATS compatibility score 0-100" },
        score_note: {
          type: "string",
          description: "1-2 sentence explanation of the match score ALWAYS in ITALIAN",
        },
        skills_present: {
          type: "array",
          items: {
            type: "object",
            properties: { label: { type: "string" }, has: { type: "boolean" } },
            required: ["label", "has"],
          },
        },
        skills_missing: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              importance: { type: "string", enum: ["essential", "important", "nice_to_have"] },
              severity: { type: "string", enum: ["critical", "moderate", "minor"], description: "How severe the gap is" },
              years_to_bridge: { type: "number", description: "Estimated years to acquire this skill" },
            },
            required: ["label", "importance"],
          },
        },
        seniority_match: {
          type: "object",
          properties: {
            candidate_level: { type: "string", enum: ["junior", "mid", "senior", "lead", "executive"] },
            role_level: { type: "string", enum: ["junior", "mid", "senior", "lead", "executive"] },
            match: { type: "boolean" },
            note: { type: "string", description: "ALWAYS in Italian" },
          },
          required: ["candidate_level", "role_level", "match", "note"],
        },
        ats_checks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              check: { type: "string", enum: ["keywords", "format", "dates", "measurable", "cliches", "sections", "action_verbs"] },
              label: { type: "string", description: "ALWAYS in Italian" },
              status: { type: "string", enum: ["pass", "warning", "fail"] },
              detail: { type: "string", description: "ALWAYS in Italian" },
            },
            required: ["check", "label", "status"],
          },
        },
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              message: { type: "string", description: "ALWAYS in Italian" },
            },
          },
        },
        learning_suggestions: {
          type: "array",
          description: "For each essential missing skill, suggest 1-2 learning resources",
          items: {
            type: "object",
            properties: {
              skill: { type: "string" },
              resource_name: { type: "string", description: "ALWAYS in Italian" },
              url: { type: "string" },
              type: { type: "string", enum: ["course", "certification", "tutorial"] },
              duration: { type: "string", description: "ALWAYS in Italian" },
            },
            required: ["skill", "resource_name", "url", "type"],
          },
        },
      },
      required: [
        "detected_language", "match_score", "ats_score", "score_note",
        "skills_present", "skills_missing", "seniority_match", "ats_checks",
      ],
    },
  },
};

const TOOL_SCHEMA_TAILOR = {
  type: "function",
  function: {
    name: "tailor_cv",
    description: "Generate CV patches, diff, structural changes, and honesty check",
    parameters: {
      type: "object",
      properties: {
        structural_changes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["removed", "reordered", "condensed"] },
              section: { type: "string" },
              item: { type: "string", description: "ALWAYS in Italian" },
              reason: { type: "string", description: "ALWAYS in Italian" },
            },
            required: ["action", "section", "item", "reason"],
          },
        },
        tailored_patches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              path: { type: "string", description: "JSON path in the CV" },
              value: { description: "New value for the field" },
            },
            required: ["path", "value"],
          },
        },
        honest_score: {
          type: "object",
          properties: {
            confidence: { type: "number" },
            experiences_added: { type: "number" },
            skills_invented: { type: "number" },
            dates_modified: { type: "number" },
            bullets_repositioned: { type: "number" },
            bullets_rewritten: { type: "number" },
            sections_removed: { type: "number" },
            flags: { type: "array", items: { type: "string" } },
          },
          required: ["confidence", "experiences_added", "skills_invented", "dates_modified", "bullets_repositioned", "bullets_rewritten", "sections_removed", "flags"],
        },
        diff: {
          type: "array",
          items: {
            type: "object",
            properties: {
              section: { type: "string" },
              index: { type: "number" },
              original: { type: "string" },
              suggested: { type: "string" },
              reason: { type: "string", description: "ALWAYS in Italian" },
              patch_path: { type: "string" },
            },
            required: ["section", "original", "suggested", "reason", "patch_path"],
          },
        },
      },
      required: ["structural_changes", "tailored_patches", "honest_score", "diff"],
    },
  },
};

// --- Deterministic score adjustment with severity ---
function adjustScore(r: Record<string, unknown>): void {
  const skillsMissing = Array.isArray(r.skills_missing) ? r.skills_missing as Array<{ label: string; importance: string; severity?: string }> : [];

  // Severity-based caps
  const criticalCount = skillsMissing.filter(s => s.severity === "critical").length;
  const moderateCount = skillsMissing.filter(s => s.severity === "moderate").length;
  const essentialMissing = skillsMissing.filter(s => s.importance === "essential").length;

  // Use severity if available, fallback to importance-based
  let cap = 100;
  if (criticalCount > 0) {
    cap = Math.min(cap, criticalCount >= 3 ? 25 : criticalCount >= 2 ? 35 : 45);
  } else if (essentialMissing > 0) {
    const caps: Record<number, number> = { 1: 55, 2: 40 };
    cap = caps[Math.min(essentialMissing, 2)] ?? 30;
  }
  if (moderateCount >= 3) cap = Math.min(cap, 60);

  const seniority = r.seniority_match as { candidate_level?: string; role_level?: string; match?: boolean } | undefined;
  const levels = ["junior", "mid", "senior", "lead", "executive"];
  let seniorityPenalty = 0;
  if (seniority && seniority.match === false) {
    const cIdx = levels.indexOf(seniority.candidate_level || "");
    const rIdx = levels.indexOf(seniority.role_level || "");
    seniorityPenalty = (cIdx >= 0 && rIdx >= 0 && Math.abs(cIdx - rIdx) >= 2) ? 15 : 5;
  }

  const atsChecks = Array.isArray(r.ats_checks) ? r.ats_checks as Array<{ status: string }> : [];
  const atsFails = atsChecks.filter(c => c.status === "fail").length;
  const atsPenalty = atsFails * 3;

  const aiScore = typeof r.match_score === "number" ? r.match_score : 50;
  const finalScore = Math.max(5, Math.min(98, Math.min(aiScore, cap) - seniorityPenalty - atsPenalty));

  if (finalScore !== aiScore) {
    const parts: string[] = [];
    if (criticalCount > 0) {
      const cSuffix = criticalCount === 1 ? "o" : "i";
      parts.push(criticalCount + " gap critic" + cSuffix);
    } else if (essentialMissing > 0) {
      const eSuffix = essentialMissing === 1 ? "a essenziale mancante" : "e essenziali mancanti";
      parts.push(essentialMissing + " competenz" + eSuffix);
    }
    if (moderateCount > 0) {
      const mSuffix = moderateCount === 1 ? "o" : "i";
      parts.push(moderateCount + " gap moderat" + mSuffix);
    }
    if (seniorityPenalty > 0) parts.push("disallineamento seniority");
    if (atsPenalty > 0) {
      const aSuffix = atsFails === 1 ? "o" : "i";
      parts.push(atsFails + " check ATS non superat" + aSuffix);
    }
    r.score_note = "Punteggio adeguato: " + parts.join(", ") + ".";
    r.match_score = finalScore;
  }
}

type FollowUpAnswer = {
  question?: string;
  answer?: string;
  level?: string;
  detail?: string;
};

function formatFollowUpAnswers(userAnswers: unknown): string {
  if (!Array.isArray(userAnswers) || userAnswers.length === 0) return "";

  const lines: string[] = [];
  for (const item of userAnswers as FollowUpAnswer[]) {
    const question = typeof item.question === "string" ? item.question.trim() : "";
    if (!question) continue;

    lines.push("Q: " + question);

    const level = typeof item.level === "string" ? item.level.trim() : "";
    const detail = typeof item.detail === "string" ? item.detail.trim() : "";
    const answer = typeof item.answer === "string" ? item.answer.trim() : "";

    if (level) {
      lines.push("Level: " + level);
      if (detail) lines.push('Detail: "' + detail + '"');
    } else {
      lines.push("A: " + answer);
    }

    lines.push("");
  }

  if (lines.length === 0) return "";

  return "\n\nCANDIDATE FOLLOW-UP ANSWERS (STRUCTURED):\n" + lines.join("\n").trim();
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const body = await req.json();
    const { job_data, user_answers, mode: requestMode, analyze_context } = body;
    const mode = requestMode || "analyze";

    if (!job_data) {
      return new Response(JSON.stringify({ error: "Dati annuncio mancanti" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user's master CV
    const { data: masterCV, error: cvError } = await supabase
      .from("master_cvs")
      .select("id, parsed_data")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (cvError || !masterCV?.parsed_data) {
      return new Response(
        JSON.stringify({ error: "CV non trovato. Carica prima il tuo CV." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const originalCV = masterCV.parsed_data as Record<string, unknown>;
    const photoBase64 = (originalCV as any)?.photo_base64 || null;
    const compactedCV = compactCV(originalCV);

    // Server-side Pro gate: Free users limited to 1 application
    if (mode === "tailor") {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { persistSession: false } }
      );

      const { data: profile } = await adminClient
        .from("profiles")
        .select("is_pro, free_apps_used")
        .eq("user_id", userId)
        .single();

      if (!profile?.is_pro) {
        if ((profile?.free_apps_used ?? 0) >= 1) {
          return new Response(
            JSON.stringify({ error: "UPGRADE_REQUIRED" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // ==================== MODE: ANALYZE ====================
    if (mode === "analyze") {
      let userContent = "CANDIDATE CV:\n" + JSON.stringify(compactedCV) + "\n\nJOB POSTING:\n" + JSON.stringify(job_data);
      userContent += formatFollowUpAnswers(user_answers);

      const aiResult = await callAi({
        task: "ai-tailor-analyze",
        systemPrompt: SYSTEM_PROMPT_ANALYZE,
        userMessage: userContent,
        tools: [TOOL_SCHEMA_ANALYZE],
        toolChoice: { type: "function", function: { name: "analyze_cv" } },
      }, userId);

      const result = aiResult.content;
      if (!result) {
        return new Response(JSON.stringify({ error: "Impossibile completare l'analisi. Riprova." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      validateOutput("ai-tailor-analyze", result);
      adjustScore(result);
      result.master_cv_id = masterCV.id;

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==================== MODE: TAILOR ====================
    let contextInfo = "";
    if (analyze_context) {
      contextInfo = "\n\nPRIOR ANALYSIS CONTEXT:\n"
        + "- Match score: " + String(analyze_context.match_score)
        + "\n- Skills missing: " + JSON.stringify(analyze_context.skills_missing)
        + "\n- Target CV language (user's explicit choice): " + String(analyze_context.detected_language)
        + "\n- IMPORTANT: Use \"" + String(analyze_context.detected_language) + "\" as the language for ALL CV content, even if the job posting is in a different language.";
    }

    let userContent = "CANDIDATE CV:\n" + JSON.stringify(compactedCV) + "\n\nJOB POSTING:\n" + JSON.stringify(job_data);
    userContent += formatFollowUpAnswers(user_answers);
    userContent += contextInfo;

    const aiTailorResult = await callAi({
      task: "ai-tailor",
      systemPrompt: SYSTEM_PROMPT_TAILOR,
      userMessage: userContent,
      tools: [TOOL_SCHEMA_TAILOR],
      toolChoice: { type: "function", function: { name: "tailor_cv" } },
    }, userId);

    const result = aiTailorResult.content;
    if (!result) {
      return new Response(JSON.stringify({ error: "Impossibile generare il CV. Riprova." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    validateOutput("ai-tailor-tailor", result);

    // Experience protection
    const patches = (result.tailored_patches as Array<{ path: string; value: unknown }>) || [];
    const originalExperience = Array.isArray((originalCV as any).experience) ? (originalCV as any).experience : [];
    const expPatchIdx = patches.findIndex(p => p.path === "experience");
    if (expPatchIdx >= 0 && originalExperience.length > 0) {
      const patchedExp = patches[expPatchIdx].value;
      if (!Array.isArray(patchedExp) || patchedExp.length === 0) {
        console.warn("Experience protection: AI removed all experiences, reverting.");
        patches[expPatchIdx].value = originalExperience;
      } else if (patchedExp.length < Math.ceil(originalExperience.length * 0.5) && originalExperience.length > 2) {
        console.warn("Experience protection: AI removed >50% experiences, reverting.");
        patches[expPatchIdx].value = originalExperience;
      }
    }

    // Change-ratio check
    const totalFields = Object.keys(originalCV).length;
    const changeRatio = patches.length / Math.max(totalFields, 1);
    if (changeRatio > 0.6) {
      console.warn(`Change ratio warning: ${(changeRatio * 100).toFixed(0)}% of fields modified (${patches.length}/${totalFields})`);
    }

    // Apply patches with validation
    const { result: tailoredCV, skipped_patches } = applyPatches(originalCV, patches);
    if (skipped_patches.length > 0) {
      result.skipped_patches = skipped_patches;
    }

    // Ensure skills arrays + strip quotes from skill names
    const cvSkills = (tailoredCV as any)?.skills;
    if (cvSkills && typeof cvSkills === "object") {
      for (const key of ["technical", "soft", "tools"]) {
        if (typeof cvSkills[key] === "string") {
          cvSkills[key] = cvSkills[key].split(",").map((s: string) => s.replace(/^["']+|["']+$/g, "").trim()).filter(Boolean);
        } else if (Array.isArray(cvSkills[key])) {
          cvSkills[key] = cvSkills[key].map((s: string) =>
            typeof s === "string" ? s.replace(/^["']+|["']+$/g, "").trim() : s
          );
        }
      }
    }

    // Ensure experience bullets are arrays
    const cvExperience = (tailoredCV as any)?.experience;
    if (Array.isArray(cvExperience)) {
      for (const exp of cvExperience) {
        if (exp.bullets && typeof exp.bullets === "string") {
          exp.bullets = exp.bullets.split("\n").map((s: string) => s.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
        }
      }
    }

    if (photoBase64) (tailoredCV as any).photo_base64 = photoBase64;

    result.tailored_cv = tailoredCV;
    result.master_cv_id = masterCV.id;
    const originalCvClean = JSON.parse(JSON.stringify(originalCV));
    delete originalCvClean.photo_base64;
    result.original_cv = originalCvClean;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    console.error("ai-tailor error:", e);
    const status = (e as any)?.status;
    if (status === 429) {
      return new Response(JSON.stringify({ error: "Troppi tentativi. Riprova tra qualche momento." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (status === 402) {
      return new Response(JSON.stringify({ error: "Crediti AI esauriti." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
