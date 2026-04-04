import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { compactCV } from "../_shared/compact-cv.ts";
import { callAi } from "../_shared/ai-provider.ts";
import { validateOutput } from "../_shared/validate-output.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkIntegrity } from "../_shared/integrity-check.ts";
import { runATSChecks } from "../_shared/ats-checks.ts";

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
          console.warn("applyPatches: skipping patch \"" + path + "\" — array index " + idx + " out of bounds");
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
   
Do NOT generate URLs for learning_suggestions. Only provide the skill name, a descriptive resource name, type, and duration. URLs will be constructed deterministically by the frontend.
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

const SYSTEM_PROMPT_TAILOR = `You are a career coach adapting a CV for a specific job posting.
Your goal: make the candidate's REAL experience shine for this role.
You work with what exists — you NEVER add what doesn't.

## INVIOLABLE RULES (tier 1 — violation = system failure)

1. **ZERO INVENTIONS** — Never invent metrics (%, €, numbers), outcomes ("con risultati misurabili", "migliorando significativamente"), team sizes, user counts. If the original bullet has no numbers, the rewritten bullet MUST NOT have numbers.
2. **IMMUTABLE FIELDS** — Role title, company name, location, dates, education, certifications: copy character-for-character. Never translate, abbreviate, or modify them.
3. **SUBSET ONLY** — Every claim in the tailored CV must be traceable to content in the original CV. You may rephrase, condense, highlight. You CANNOT add.
4. **NEVER REMOVE EXPERIENCES** — Every work experience from the original CV must remain. You may condense bullets, never delete the experience.
5. **SUMMARY = REAL IDENTITY** — The summary describes who the candidate IS (current role, sector, years), not who they want to become. You may highlight transferable skills, never rebrand.

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

## LANGUAGE RULES

### Two-level language policy
1. CV CONTENT (patch values, summary, bullets, skill labels) MUST be in the TARGET LANGUAGE (detected_language from PRIOR ANALYSIS CONTEXT). This is the user's explicit choice.
2. ANALYSIS TEXT (diff reasons, structural_changes reason/item, narrative_thread) MUST ALWAYS be in ITALIAN.

### Language consistency
The ENTIRE tailored CV must be in ONE language: the target language.
- summary, ALL bullets, ALL skill labels, ALL education descriptions — same language.
- Common mistake to AVOID: translating some bullets but leaving others in the original language.
- If detected_language differs from original CV language → generate patches for ALL text fields.

### Skill label rules
- Translate generic/descriptive skills: "Project Management" → "Gestione progetti"
- Keep proper nouns and tech names as-is: React, SQL, Figma, AWS, Python
- NEVER wrap skill names in quotes. Wrong: "React". Correct: React
- When a skill has a well-known acronym, include BOTH the full name and the acronym in parentheses the FIRST time it appears: "Search Engine Optimization (SEO)", "Customer Relationship Management (CRM)", "Key Performance Indicators (KPIs)". For pure tech names (React, AWS, SQL) keep only the short form.

## STEP 0 — READ THE WHOLE PERSON BEFORE WRITING ANYTHING

Before generating any patch, you MUST complete this internal reading phase. This is not optional.

Read the entire CV as a document about a person, not as a JSON to patch. Then form answers to these three questions — write them as the narrative_thread field in your output:

1. **Who is this person?** — Their career arc in one sentence. What pattern repeats across their experiences? What sector, domain, or type of problem have they consistently worked on?
2. **What is their real differentiator for THIS role?** — Not generic strengths. The one thing in their background that makes them specifically interesting for this job posting, based on real content in the CV.
3. **What is the narrative thesis?** — One sentence that every patch must serve. This is your north star. If a patch doesn't reinforce this thesis, ask yourself whether it's necessary.

The narrative_thread is written in Italian and appears in the tool call output. It is your compass — every patch you generate must be consistent with it.

## CROSS-SECTION SYNTHESIS — THIS IS WHERE QUALITY COMES FROM

You may add specificity to any section using information present ANYWHERE in this CV — including other experiences, projects, certifications, education, or the summary.

Connecting dots across sections is NOT inventing. It is surfacing what is already true.

Examples:
- A technology mentioned in experience[2] can be referenced in the summary if it defines the candidate's profile
- A project in the projects section that demonstrates a skill also visible in experience[1] can be used to strengthen that experience's narrative
- A pattern visible across 3 different experiences (e.g. always leading cross-functional teams) can become a theme in the summary even if never stated explicitly

What you CANNOT do: bring in information that is nowhere in the CV. Cross-section synthesis is not invention.

## THE SUMMARY IS THE SPINE — WRITE IT FIRST

The summary is not just another patch. It is the narrative spine of the entire CV.

**Generate the summary patch first.** Every other patch must be consistent with it — they are the supporting evidence for the claim the summary makes about this person.

Write a NARRATIVE, PERSONAL summary in FIRST PERSON, structured as 3-4 SHORT paragraphs separated by \\n\\n:
- Paragraph 1: Who the candidate is — current role, career trajectory, years of experience (specific, grounded in the most recent experience)
- Paragraph 2: What they do today — team scope, current mandate, key responsibilities, using real detail from the CV
- Paragraph 3: Strategic positioning for THIS role — where their background connects to what the job needs (honest, based on real overlap, never inflated)
- Paragraph 4 (optional): Values, approach, or a differentiator that sets them apart — only if genuinely present in the CV

FORBIDDEN: generic buzzword lists like "data-driven mindset with strong communication skills". Each sentence must be specific and grounded in real experience from this CV.
FORBIDDEN: "Sono un professionista con esperienza in..." — too generic.
The summary must feel like a person speaking, not a LinkedIn headline generator.

## VOICE & NARRATIVE (tier 2)

### Preserve the candidate's voice
Study how the candidate writes in the original CV. If they use concise, direct language, keep that register.
Don't replace their vocabulary with generic HR language. If they wrote "built", keep "built". Only improve if genuinely unclear.

### Bullets = evidence, not job descriptions
"Managed the CRM project" → job description (bad)
"Managed CRM rollout across 3 European markets, coordinating analysis, development, and go-live phases" → evidence (good)
The difference: specificity using details ALREADY IN THIS CV — scope, geography, team structure, tech stack, phases involved. These details may come from the same experience OR from elsewhere in the CV if they are verifiably connected to the same context.
Look for these details — they are always there, just not surfaced.

## HOW TO ADAPT (tier 2 — operational instructions)

### Bullets
Rephrase with action verb + what the candidate did. If the original has metrics, keep them. If not, add specificity using information already present in this CV (context, scope, tech, phases involved — from this experience OR from other sections that are factually connected).

### Skill ordering
Order by relevance to the job posting:
1. Exact matches with required_skills
2. Related technical skills
3. Tools
4. Soft skills
Remove generic/irrelevant skills (e.g. "Microsoft Office", "Teamwork" for senior roles).
This applies to skills.technical, skills.soft, and skills.tools.
MUST NOT remove skills present in the original CV that are relevant to the role. You may reorder, never delete relevant skills.

### Experiences
Reverse chronological order (most recent first). Do NOT reorder by relevance.
Condense to max 4-5 bullets per experience. For experiences lasting > 3 years or with senior/lead/executive/director/C-level titles, the limit is 6-7 bullets. Merge similar bullets, remove irrelevant ones.

## DATA INTEGRITY

- Certifications MUST NEVER appear in the experience array. Move misplaced certs to certifications.
- **NEVER REMOVE CERTIFICATIONS.** All certifications from the original CV MUST appear in the tailored CV. You may reorder them by relevance but MUST NOT delete any.
- **NEVER REMOVE PUBLICATIONS, AWARDS, VOLUNTEERING, OR CONFERENCES.** All items from these sections in the original CV MUST appear in the tailored CV.
- An experience entry MUST have: role, company, start date. If missing, it's not an experience.
- You CANNOT invent new experiences, degrees, or certifications.
- You CANNOT touch personal data or photo fields.

## FOLLOW-UP ANSWER RULES
Answers are self-reported, UNVERIFIED claims:
- Level "expert": MAY add skill to skills arrays, MAY rewrite up to 2 existing bullets to highlight it. MUST NOT create new experiences or bullets from scratch.
- Level "some": MAY add skill to arrays, MAY mention in summary. MUST NOT rewrite bullets.
- Level "learning": MAY add to skills.tools with qualifier (e.g. "Kubernetes (in corso)"). Nothing else.
- Level "none": Do NOT use. Confirms a gap.
- Free text only (no Level): Treat as "some".

## OUTPUT FORMAT

Return ONLY modified CV sections as an array of patches.
Each patch: { path: "JSON path", value: "new value" }
Return ONLY fields you actually changed.

CRITICAL: if the CV language differs from detected_language, generate patches for ALL text fields (summary, every experience's bullets/description, skills, education, certifications, projects).

Also return: narrative_thread, structural_changes, honest_score, diff (with reasons in Italian).

Respond ONLY with the required tool function call.`;

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
            note: { type: "string", description: "ALWAYS in Italian. If candidate is more senior than the role, frame extra experience as a strength and added value, never as a penalty." },
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
          description: "For each essential missing skill, suggest 1-2 learning resources. Do NOT generate URLs.",
          items: {
            type: "object",
            properties: {
              skill: { type: "string" },
              resource_name: { type: "string", description: "ALWAYS in Italian" },
              type: { type: "string", enum: ["course", "certification", "tutorial"] },
              duration: { type: "string", description: "ALWAYS in Italian" },
            },
            required: ["skill", "resource_name", "type", "duration"],
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
        narrative_thread: {
          type: "string",
          description: "Internal reading brief written BEFORE any patch: 3-sentence synthesis in Italian — who is this person, what is their real differentiator for this role, what narrative thesis guides all patches.",
        },
        structural_changes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["reordered", "condensed"] },
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
      required: ["narrative_thread", "structural_changes", "tailored_patches", "honest_score", "diff"],
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
    const adjustmentReason = "Punteggio adeguato per: " + parts.join(", ") + ".";
    r.score_note = ((r.score_note as string) || "").trim() + " " + adjustmentReason;
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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData.user) {
      console.error("[ai-tailor] getUser failed:", userError?.message || "no user");
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Client scoped to user for RLS queries
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
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
      let userContent = "CANDIDATE CV:\n" + JSON.stringify(compactedCV, null, 2) + "\n\nJOB POSTING:\n" + JSON.stringify(job_data, null, 2);
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
      contextInfo = "\n\nPRIOR ANALYSIS CONTEXT (structured JSON):\n" + JSON.stringify(analyze_context)
        + "\n\nIMPORTANT: Use \"" + String(analyze_context.detected_language) + "\" as the language for ALL CV content, even if the job posting is in a different language.";
    }

    let userContent = "CANDIDATE CV:\n" + JSON.stringify(compactedCV, null, 2) + "\n\nJOB POSTING:\n" + JSON.stringify(job_data, null, 2);
    userContent += formatFollowUpAnswers(user_answers);
    userContent += contextInfo;

    const aiTailorResult = await callAi({
      task: "ai-tailor",
      systemPrompt: SYSTEM_PROMPT_TAILOR,
      userMessage: userContent,
      tools: [TOOL_SCHEMA_TAILOR],
      toolChoice: { type: "function", function: { name: "tailor_cv" } },
      temperature: 0.2,
      maxTokens: 8192,
    }, userId);

    const result = aiTailorResult.content;
    if (!result) {
      return new Response(JSON.stringify({ error: "Impossibile generare il CV. Riprova." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    validateOutput("ai-tailor-tailor", result);

    // Quality warning if fallback provider was used
    if (aiTailorResult.usedFallback) {
      result.quality_warning = "CV generato con modello AI secondario. Verifica attentamente il risultato.";
    }

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
      console.warn("Change ratio warning: " + (changeRatio * 100).toFixed(0) + "% of fields modified (" + patches.length + "/" + totalFields + ")");
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

    // --- SERVER-SIDE VALIDATION (Story 20.3) ---

    // 1. Remove ghost/placeholder bullets
    if (Array.isArray(cvExperience)) {
      for (const exp of cvExperience) {
        if (Array.isArray(exp.bullets)) {
          const origBullets = [...exp.bullets];
          exp.bullets = exp.bullets
            .map((b: string) => {
              if (typeof b !== "string") return b;
              // Trim trailing "..." that indicate truncation
              return b.replace(/\.\.\.\s*$/, "").trim();
            })
            .filter((b: string) =>
              typeof b === "string" &&
              b.trim().length >= 10 &&
              !/^[•\-…\.·\s]+$/.test(b.trim()) &&
              !/^\.{2,}/.test(b.trim())
            );
          // If all bullets were removed, restore originals
          if (exp.bullets.length === 0 && origBullets.length > 0) {
            exp.bullets = origBullets;
          }
        }
      }
    }

    // 2. Deduplicate skills
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

    // 3. Reorder skills by job relevance
    const jobSkills = (job_data?.required_skills || []).map((s: string) => s.toLowerCase());
    const jobNice = (job_data?.nice_to_have || []).map((s: string) => s.toLowerCase());
    if (cvSkills && typeof cvSkills === "object") {
      for (const key of ["technical", "soft", "tools"]) {
        if (Array.isArray(cvSkills[key]) && cvSkills[key].length > 1) {
          cvSkills[key].sort((a: string, b: string) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();
            const aRequired = jobSkills.some((j: string) => aLower.includes(j) || j.includes(aLower));
            const bRequired = jobSkills.some((j: string) => bLower.includes(j) || j.includes(bLower));
            const aNice = jobNice.some((j: string) => aLower.includes(j) || j.includes(aLower));
            const bNice = jobNice.some((j: string) => bLower.includes(j) || j.includes(bLower));
            if (aRequired && !bRequired) return -1;
            if (!aRequired && bRequired) return 1;
            if (aNice && !bNice) return -1;
            if (!aNice && bNice) return 1;
            return 0;
          });
        }
      }
    }

    if (photoBase64) (tailoredCV as any).photo_base64 = photoBase64;

    // --- Translation coverage warning ---
    if (analyze_context?.detected_language) {
      const patchedPaths = patches.map((p: { path: string }) => p.path);
      const summaryPatched = patchedPaths.some((p: string) => p === "summary");
      const expPatched = patchedPaths.some((p: string) => p.startsWith("experience"));
      if (summaryPatched && !expPatched && originalExperience.length > 0) {
        console.warn("[ai-tailor] Translation coverage: summary patched but no experience patches. Possible incomplete translation.");
      }
    }

    // --- INTEGRITY CHECK: validate tailored CV against original ---
    const integrityResult = checkIntegrity(originalCV, tailoredCV as Record<string, unknown>);
    
    if (integrityResult.warnings.length > 0) {
      console.warn("[ai-tailor] Integrity check: " + integrityResult.warnings.length + " issues corrected");
      result.integrity_warnings = integrityResult.warnings;
    }

    // Replace self-reported honest_score with server-computed values
    result.honest_score = {
      ...((result.honest_score as Record<string, unknown>) || {}),
      dates_modified: integrityResult.computed_honesty.dates_modified,
      roles_changed: integrityResult.computed_honesty.roles_changed,
      companies_changed: integrityResult.computed_honesty.companies_changed,
      degrees_changed: integrityResult.computed_honesty.degrees_changed,
      metrics_fabricated: integrityResult.computed_honesty.metrics_fabricated,
      certs_invented: integrityResult.computed_honesty.certs_invented,
      certs_removed: integrityResult.computed_honesty.certs_removed,
      server_validated: true,
      reverts: integrityResult.reverts,
    };

    // --- DETERMINISTIC ATS CHECKS (Story 20.10) ---
    const jdKeywords = [
      ...(job_data?.required_skills || []),
      ...(job_data?.nice_to_have || []),
    ].map((s: string) => typeof s === "string" ? s.trim() : "").filter(Boolean);
    const atsResult = runATSChecks(tailoredCV as Record<string, unknown>, jdKeywords);
    result.ats_checks = atsResult.checks;
    result.ats_score = atsResult.score;

    // --- CV-REVIEW: formal polish pass with ground truth (replaces cv-formal-review) ---
    const detectedLang = analyze_context?.detected_language || "it";
    if (!detectedLang) console.warn("[ai-tailor] lang not provided for cv-review, defaulting to 'it'");

    const cvForReview = JSON.parse(JSON.stringify(tailoredCV));
    delete cvForReview.photo_base64;
    const originalCvForReview = JSON.parse(JSON.stringify(originalCV));
    delete originalCvForReview.photo_base64;

    const CV_REVIEW_SYSTEM = "You are an elite HR reviewer and CV quality controller.\n" +
      "You receive a tailored CV (JSON) and must return a PERFECTED version following these 13 rules.\n" +
      "You also receive the ORIGINAL CV (before tailoring) as ground truth.\n\n" +
      "## GROUND TRUTH RULE\n" +
      "For every bullet, description, and skill in the tailored CV:\n" +
      "- If the content cannot be traced back to the original CV, REVERT it to the original wording\n" +
      "- If the tailored version adds metrics (%, numbers, amounts) not in the original, REMOVE them\n" +
      "- If the tailored version adds qualitative outcomes not in the original, REMOVE them\n" +
      "- When in doubt, prefer the original wording over the tailored version\n\n" +
      "## 13 RULES\n" +
      "1. LANGUAGE UNIFORMITY: Every text field MUST be in the target language. Exception: proper nouns, tech terms.\n" +
      "2. BULLET = ACTION VERB + RESULT: Every bullet starts with a strong action verb.\n" +
      "3. CAPITALIZATION: First letter of every bullet/description/summary sentence uppercase.\n" +
      "4. ARTIFACT REMOVAL: Remove prefixes (I:, -, 1.), wrapping quotes, trailing whitespace, markdown.\n" +
      "5. ORPHAN TEXT: Move misplaced text to correct section or remove if duplicate.\n" +
      "6. CERTIFICATION VALIDATION: Certs need name + issuer minimum. Keep cert names in original language.\n" +
      "7. SKILL DEDUP & CLEANUP: Remove duplicates and generic cliches.\n" +
      "8. MAX 4-5 BULLETS PER EXPERIENCE: Condense if more than 5. For experiences lasting > 3 years or senior/lead/executive/director/C-level roles, limit is 6-7 bullets.\n" +
      "9. DATE FORMAT: Use 'Mmm YYYY' consistently. Separator: ONLY ASCII hyphen (-), NEVER en dash or em dash.\n" +
      "10. SUMMARY QUALITY: 2-3 sentences, specific to role, no filler.\n" +
      "11. NO INVENTED OUTCOMES: If no metrics in original, do not add them.\n" +
      "12. ATS-SAFE CHARACTERS: Use ONLY standard ASCII. No em dash, en dash, smart quotes. Replace with hyphen (-) and straight quotes.\n" +
      "13. NO TRUNCATION: Do NOT remove, shorten, or merge existing bullets. Correct ONLY form, never content or length.\n\n" +
      "## WHAT YOU MUST NOT DO\n" +
      "- Do NOT invent new experiences, skills, or certifications\n" +
      "- Do NOT modify company names, dates, degree titles, grades\n" +
      "- Do NOT remove experiences\n" +
      "- Do NOT change the structure/order of sections\n" +
      "- Do NOT touch personal data fields or photo_base64\n\n" +
      "## OUTPUT\n" +
      "Return the COMPLETE corrected CV in the same JSON structure as the input.";

    const CV_REVIEW_TOOL = {
      type: "function",
      function: {
        name: "reviewed_cv",
        description: "Return the complete corrected CV after applying all review rules",
        parameters: {
          type: "object",
          properties: {
            personal: { type: "object" },
            summary: { type: "string" },
            experience: { type: "array", items: { type: "object" } },
            education: { type: "array", items: { type: "object" } },
            skills: { type: "object" },
            certifications: { type: "array", items: { type: "object" } },
            projects: { type: "array", items: { type: "object" } },
            extra_sections: { type: "array", items: { type: "object" } },
          },
          required: ["personal", "summary", "experience", "skills"],
        },
      },
    };

    const reviewUserMessage = "## CONTEXT\nTarget language: " + detectedLang +
      "\n\n## ORIGINAL CV (GROUND TRUTH)\n" + JSON.stringify(originalCvForReview) +
      "\n\n## TAILORED CV TO REVIEW\n" + JSON.stringify(cvForReview) +
      "\n\n## TAILOR PHASE NOTE\nThe tailored CV was intentionally modified by the tailor phase. " +
      "Do NOT revert language translations or keyword adaptations to the target language — those are intentional. " +
      "Do NOT revert skill reordering or keyword insertions that match the job posting requirements." +
      "\n\nApply all 13 rules. Do NOT shorten or remove bullets. Use ONLY ASCII characters.";

    try {
      const reviewResult = await callAi({
        task: "cv-review",
        systemPrompt: CV_REVIEW_SYSTEM,
        userMessage: reviewUserMessage,
        tools: [CV_REVIEW_TOOL],
        toolChoice: { type: "function", function: { name: "reviewed_cv" } },
        temperature: 0.2,
        maxTokens: 8192,
      }, userId);

      const reviewed = reviewResult.content;
      if (reviewed && typeof reviewed === "object") {
        // Preserve photo_base64 and personal data from tailoredCV
        if (photoBase64) (reviewed as any).photo_base64 = photoBase64;
        if ((tailoredCV as any).personal) {
          const rp = (reviewed as any).personal || {};
          const op = (tailoredCV as any).personal;
          rp.name = op.name;
          rp.email = op.email;
          rp.phone = op.phone;
          rp.linkedin = op.linkedin;
          rp.website = op.website;
          rp.date_of_birth = op.date_of_birth;
          rp.location = op.location;
          (reviewed as any).personal = rp;
        }

        // Post-review integrity check
        const postReviewIntegrity = checkIntegrity(originalCV, reviewed as Record<string, unknown>);
        if (postReviewIntegrity.warnings.length > 0) {
          console.warn("[ai-tailor] Post-review integrity: " + postReviewIntegrity.warnings.length + " issues corrected");
        }

        result.tailored_cv = reviewed;
        result.cv_review_applied = true;
        console.log("[ai-tailor] cv-review applied successfully");
      } else {
        console.warn("[ai-tailor] cv-review returned empty result, using tailored CV as-is");
        result.tailored_cv = tailoredCV;
      }
    } catch (reviewErr) {
      console.error("[ai-tailor] cv-review failed, using tailored CV as-is:", reviewErr);
      result.tailored_cv = tailoredCV;
    }

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
