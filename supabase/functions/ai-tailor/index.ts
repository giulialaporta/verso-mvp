import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Utility: compact CV by removing nulls, empty strings, empty arrays, photo_base64 ---
function compactCV(data: Record<string, unknown>): Record<string, unknown> {
  if (Array.isArray(data)) {
    const filtered = data
      .map((item) => (typeof item === "object" && item !== null ? compactCV(item as Record<string, unknown>) : item))
      .filter((item) => item !== null && item !== undefined && item !== "");
    return filtered.length > 0 ? (filtered as unknown as Record<string, unknown>) : (undefined as unknown as Record<string, unknown>);
  }
  if (typeof data === "object" && data !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === "photo_base64") continue; // strip photo
      if (value === null || value === undefined || value === "") continue;
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

// --- Utility: apply patches to original CV ---
function applyPatches(
  original: Record<string, unknown>,
  patches: Array<{ path: string; value: unknown }>
): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(original));

  for (const patch of patches) {
    const { path, value } = patch;
    // Parse path like "experience[0].bullets" or "skills.technical" or "summary"
    const segments = path.replace(/\[(\d+)\]/g, ".$1").split(".");
    let target: unknown = result;
    let valid = true;
    for (let i = 0; i < segments.length - 1; i++) {
      if (target === null || target === undefined || typeof target !== "object") {
        console.warn(`applyPatches: skipping patch "${path}" — intermediate segment "${segments[i]}" is not an object (got ${typeof target})`);
        valid = false;
        break;
      }
      const seg = segments[i];
      const idx = Number(seg);
      if (!isNaN(idx)) {
        target = (target as Record<string, unknown>)[idx as unknown as string];
      } else {
        const obj = target as Record<string, unknown>;
        if (obj[seg] === undefined || obj[seg] === null) {
          // Auto-create intermediate objects
          const nextSeg = segments[i + 1];
          obj[seg] = !isNaN(Number(nextSeg)) ? [] : {};
        }
        target = obj[seg];
      }
    }
    if (!valid || target === null || target === undefined || typeof target !== "object") {
      if (valid) console.warn(`applyPatches: skipping patch "${path}" — target is not an object (got ${typeof target})`);
      continue;
    }
    const lastSeg = segments[segments.length - 1];
    const lastIdx = Number(lastSeg);
    if (!isNaN(lastIdx)) {
      (target as Record<string, unknown>)[lastIdx as unknown as string] = value;
    } else {
      (target as Record<string, unknown>)[lastSeg] = value;
    }
  }

  return result;
}

const SYSTEM_PROMPT = `You are an expert career coach and ATS specialist for the European job market.

## CRITICAL RULE — LANGUAGE IN = LANGUAGE OUT
Before generating ANY content, detect the language of the JOB POSTING.
ALL CV modifications (summary, bullets, descriptions, skill labels, suggestions, notes, diff reasons) MUST be written in the SAME LANGUAGE as the job posting.
- English job posting → English CV output
- Italian job posting → Italian CV output
- German job posting → German CV output
This rule is ABSOLUTE. No exceptions. Report the detected language in the detected_language field.

Compare the candidate's CV with the job posting and produce a comprehensive analysis.

## TWO-LEVEL TAILORING

### Level 1 — STRUCTURAL (what to keep/remove/reorder)
- REMOVE experiences completely irrelevant to the target role (e.g. waiter job for a software engineering position)
- REORDER experiences by relevance to the job (most relevant first)
- CONDENSE verbose bullet lists (max 4-5 bullets per experience, keep only impactful ones)
- REMOVE irrelevant projects, certifications, or extra sections
- If education is not the candidate's strength for this role, keep it minimal

### Level 2 — CONTENT (how to rewrite what remains)
- Summary: 2-3 sentences maximum, specific to this role
- Bullets: action verb + measurable result, one line each
- Skills: ordered by relevance, remove generic/obvious ones

## CONCISENESS RULE
Be as concise and effective as possible.
A well-targeted 1-page CV beats a generic 3-page CV.
Every word must earn its place. Remove filler, cliches, and redundancy.
If a section adds no value for THIS specific role, remove it entirely.

## SCORE PENALIZATION FOR MANDATORY GAPS
If the candidate is missing MANDATORY requirements (especially years of experience, required certifications, required degree):
- If there are UNBRIDGEABLE mandatory gaps: match_score MUST NOT exceed 40%
- Each mandatory gap reduces the max achievable score significantly
- Be honest: a candidate missing critical requirements should see a low score
- Preferred/nice-to-have gaps should have minor impact

## ADDITIONAL CONTEXT FROM CANDIDATE
If the user section contains "CANDIDATE FOLLOW-UP ANSWERS", use those answers to:
- Discover implicit skills or experience not explicit in the CV
- Improve the match analysis with verified candidate information
- These answers are VERIFIED by the candidate and can be used to enrich the CV tailoring
- Adjust the score upward if answers reveal relevant hidden experience

## REQUIRED OUTPUT

### 1. MATCH SCORE (0-100)
Overall compatibility percentage between CV and job posting.

### 2. ATS SCORE (0-100)
ATS compatibility score. Evaluate 7 specific checks:
- **keywords**: Are the job posting keywords present in the CV?
- **format**: Is the format ATS-friendly (no tables, columns, headers/footers)?
- **dates**: Are dates in a standard, consistent format?
- **measurable**: Are results quantified with numbers/percentages?
- **cliches**: No empty phrases ("team player", "problem solver" without context)?
- **sections**: Are all standard sections present (summary, experience, education, skills)?
- **action_verbs**: Do bullet points start with strong action verbs?

### 3. SKILLS ANALYSIS
- skills_present: list of skills required by the job with indication whether the candidate has them
- skills_missing: missing skills with importance level (essential/important/nice_to_have)

### 4. SENIORITY MATCH
Compare the candidate's seniority level with what the role requires.

### 5. STRUCTURAL CHANGES
List all structural modifications made (removals, reorders, condensations).
For each change, specify the action, affected section, item description, and reason.

### 6. TAILORED PATCHES
Return ONLY the CV sections you modified, as an array of patches.
Each patch has:
- path: JSON path in the CV (e.g. "summary", "experience[0].bullets", "skills.technical", "experience", "education")
- value: the new value for that field

Do NOT return the entire CV. Return ONLY the fields you actually changed.
Valid paths include full arrays: "experience", "education", "certifications", "projects", "extra_sections"
As well as individual fields: "summary", "experience[N].description", "experience[N].bullets", "skills.technical", "skills.soft", "skills.tools"
When removing or reordering entries, return the entire array with entries removed/reordered.

### 7. DIFF
List of changes made. Each entry MUST include a patch_path that corresponds to the matching entry in tailored_patches.

### 8. HONEST SCORE
Honesty verification of the modifications made.

## FUNDAMENTAL RULES
- You CAN remove entire experience/education/project entries if irrelevant to the target role
- You CAN reorder entries by relevance
- You CAN reduce the number of bullets per experience
- You CAN remove entire extra_sections if not relevant
- You CANNOT invent new experiences, degrees, or certifications
- You CANNOT modify dates, company names, degree titles, grades
- You CANNOT touch personal data or photo_base64
- Every patch path MUST correspond to an existing field in the original CV (except new skills)

## EUROPEAN MARKET CALIBRATION
- Laurea triennale = Bachelor's degree, Laurea magistrale = Master's degree
- Consider professional registers (engineers, lawyers, accountants)
- Recognize Italian and European certifications (ECDL, Cambridge, DELF, etc.)

Respond ONLY with the required tool function call.`;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "analyze_and_tailor",
    description: "Analyze CV-job match and produce tailored patches with ATS and honesty checks",
    parameters: {
      type: "object",
      properties: {
        detected_language: {
          type: "string",
          description: "ISO 639-1 language code detected from the job posting (e.g. 'en', 'it', 'de')",
        },
        match_score: {
          type: "number",
          description: "Overall match score 0-100",
        },
        ats_score: {
          type: "number",
          description: "ATS compatibility score 0-100",
        },
        skills_present: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              has: { type: "boolean" },
            },
            required: ["label", "has"],
          },
        },
        skills_missing: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              importance: { type: "string", enum: ["essential", "important", "nice_to_have"], description: "Priority of the missing skill for this job" },
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
            note: { type: "string" },
          },
          required: ["candidate_level", "role_level", "match", "note"],
        },
        ats_checks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              check: { type: "string", enum: ["keywords", "format", "dates", "measurable", "cliches", "sections", "action_verbs"] },
              label: { type: "string" },
              status: { type: "string", enum: ["pass", "warning", "fail"] },
              detail: { type: "string" },
            },
            required: ["check", "label", "status"],
          },
        },
        structural_changes: {
          type: "array",
          description: "List of structural changes made (removals, reorders, condensations)",
          items: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["removed", "reordered", "condensed"] },
              section: { type: "string" },
              item: { type: "string", description: "What was affected" },
              reason: { type: "string" },
            },
            required: ["action", "section", "item", "reason"],
          },
        },
        tailored_patches: {
          type: "array",
          description: "Array of patches to apply to the original CV. Only fields that were actually changed. Valid paths include full arrays and individual fields.",
          items: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "JSON path in the CV (e.g. 'summary', 'experience[0].bullets', 'skills.technical', 'experience', 'education')",
              },
              value: {
                description: "New value for the field (string, array, or object)",
              },
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
              reason: { type: "string" },
              patch_path: { type: "string", description: "Corresponding path in tailored_patches for this change" },
            },
            required: ["section", "original", "suggested", "reason", "patch_path"],
          },
        },
        score_note: {
          type: "string",
          description: "1-2 sentence explanation of the match score IN THE SAME LANGUAGE as the job posting. Explain key factors affecting the score.",
        },
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              message: { type: "string" },
            },
          },
        },
        learning_suggestions: {
          type: "array",
          description: "For each essential missing skill, suggest 1-2 learning resources (courses, certifications)",
          items: {
            type: "object",
            properties: {
              skill: { type: "string" },
              resource_name: { type: "string" },
              url: { type: "string" },
              type: { type: "string", enum: ["course", "certification", "tutorial"] },
              duration: { type: "string", description: "Estimated duration (e.g. '4 weeks', '2 hours')" },
            },
            required: ["skill", "resource_name", "url", "type"],
          },
        },
      },
      required: [
        "detected_language",
        "match_score",
        "ats_score",
        "score_note",
        "skills_present",
        "skills_missing",
        "seniority_match",
        "ats_checks",
        "structural_changes",
        "tailored_patches",
        "honest_score",
        "diff",
      ],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { job_data, user_answers } = await req.json();

    if (!job_data) {
      return new Response(JSON.stringify({ error: "Dati annuncio mancanti" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // Save photo_base64 before compacting (will be reinserted after patches)
    const photoBase64 = (originalCV as any)?.photo_base64 || null;

    // Compact CV for AI input (removes nulls, empties, photo_base64)
    const compactedCV = compactCV(originalCV);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `CANDIDATE CV:\n${JSON.stringify(compactedCV)}\n\nJOB POSTING:\n${JSON.stringify(job_data)}${
              user_answers && Array.isArray(user_answers) && user_answers.length > 0
                ? `\n\nCANDIDATE FOLLOW-UP ANSWERS:\n${user_answers.map((a: { question: string; answer: string }) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n")}`
                : ""
            }`,
          },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "analyze_and_tailor" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Troppi tentativi. Riprova tra qualche momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti AI esauriti." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Errore durante l'analisi AI." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    let result: Record<string, unknown>;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      result =
        typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        return new Response(
          JSON.stringify({ error: "Impossibile completare l'analisi. Riprova." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // --- Deterministic score adjustment ---
    function adjustScore(r: Record<string, unknown>): void {
      const skillsMissing = Array.isArray(r.skills_missing) ? r.skills_missing as Array<{ label: string; importance: string }> : [];
      const essentialMissing = skillsMissing.filter(s => s.importance === "essential").length;

      const caps: Record<number, number> = { 0: 100, 1: 55, 2: 40 };
      const cap = caps[Math.min(essentialMissing, 2)] ?? 30;

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

      const lang = (r.detected_language as string || "it").toLowerCase();
      const isIt = lang.startsWith("it");

      if (finalScore !== aiScore) {
        // Generate synthetic note
        const parts: string[] = [];
        if (essentialMissing > 0) {
          parts.push(isIt
            ? `${essentialMissing} competenz${essentialMissing === 1 ? "a essenziale mancante" : "e essenziali mancanti"}`
            : `${essentialMissing} essential skill${essentialMissing === 1 ? "" : "s"} missing`);
        }
        if (seniorityPenalty > 0) {
          parts.push(isIt ? "disallineamento seniority" : "seniority mismatch");
        }
        if (atsPenalty > 0) {
          parts.push(isIt ? `${atsFails} check ATS non superati` : `${atsFails} ATS check${atsFails === 1 ? "" : "s"} failed`);
        }
        r.score_note = isIt
          ? `Punteggio adeguato: ${parts.join(", ")}.`
          : `Score adjusted: ${parts.join(", ")}.`;
        r.match_score = finalScore;
      }
      // If score unchanged, keep AI's score_note as-is
    }

    adjustScore(result);

    // Apply patches to original CV to produce tailored_cv
    const patches = (result.tailored_patches as Array<{ path: string; value: unknown }>) || [];
    const tailoredCV = applyPatches(originalCV, patches);

    // Ensure skills fields are arrays (AI sometimes returns comma-separated strings)
    const cvSkills = (tailoredCV as any)?.skills;
    if (cvSkills && typeof cvSkills === "object") {
      for (const key of ["technical", "soft", "tools"]) {
        if (typeof cvSkills[key] === "string") {
          cvSkills[key] = cvSkills[key].split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      }
    }

    // Reinsert photo_base64 if it existed
    if (photoBase64) {
      (tailoredCV as any).photo_base64 = photoBase64;
    }

    // Keep tailored_patches in the response for selective approval
    // Also add tailored_cv and original_cv (without photo_base64)
    result.tailored_cv = tailoredCV;
    result.master_cv_id = masterCV.id;
    const originalCvClean = JSON.parse(JSON.stringify(originalCV));
    delete originalCvClean.photo_base64;
    result.original_cv = originalCvClean;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-tailor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
