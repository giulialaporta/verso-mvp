import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAi } from "../_shared/ai-provider.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkIntegrity } from "../_shared/integrity-check.ts";

const SYSTEM_PROMPT = `You are an elite HR reviewer and CV quality controller.
You receive a tailored CV (JSON) and must return a PERFECTED version following these 10 rules.

You also receive the ORIGINAL CV (before tailoring) as ground truth.

## GROUND TRUTH RULE
For every bullet, description, and skill in the tailored CV:
- If the content cannot be traced back to the original CV, REVERT it to the original wording
- If the tailored version adds metrics (%, numbers, amounts) not in the original, REMOVE them
- If the tailored version adds qualitative outcomes ("con risultati misurabili", "migliorando significativamente") not in the original, REMOVE them
- When in doubt, prefer the original wording over the tailored version

The original CV is the SOURCE OF TRUTH. Your job is to POLISH, not to INVENT.

## 10 RULES — APPLY ALL, NO EXCEPTIONS

### 1. LANGUAGE UNIFORMITY
Every single text field MUST be in the target language (provided as detected_language).
Translate ANY text that is in a different language. Zero mixing allowed.
Exception: proper nouns (company names, product names, technology names like React, AWS, Jira) stay as-is.

### 2. BULLET = ACTION VERB + RESULT
Every bullet point MUST start with a strong action verb (past tense for past roles, present for current).
Bad: "CRM project management" → Good: "Gestito il progetto CRM aziendale"
Bad: "Sales activities" → Good: "Gestito le attivita' commerciali e la relazione con i clienti"

### 3. CAPITALIZATION
First letter of every bullet point, description, and summary sentence MUST be uppercase.

### 4. ARTIFACT REMOVAL
Remove these artifacts:
- Prefixes: "I:", "- ", leading numbers like "1.", "1)"
- Wrapping quotes on skill labels: "React" → React
- Trailing/leading whitespace
- Markdown formatting (**, *, #, etc.)

### 5. ORPHAN TEXT
If a text fragment appears outside its logical section (e.g., a job description appearing inside education), either:
- Move it to the correct section as a bullet point
- Remove it if it's a duplicate or doesn't add value

### 6. CERTIFICATION VALIDATION
Certifications MUST have: name + issuer (at minimum).
Remove any entry that is actually a descriptive sentence, not a real certification.
Keep certification names in their original language (they are proper nouns).

### 7. SKILL DEDUPLICATION & CLEANUP
- Remove duplicate skills (case-insensitive)
- Remove generic clichés: "Comunicazione Efficace", "Problem Solving", "Team Working", "Lavoro di Squadra", "Capacità di Adattamento", "Orientamento al Risultato", "Effective Communication", "Teamwork", "Adaptability", "Results-Oriented", "Self-Motivated", "Detail-Oriented", "Proactive", "Dynamic Professional"
- Remove skills that are just job titles or role descriptions
- Keep technical skills, tools, frameworks, methodologies

### 8. MAX 4-5 BULLETS PER EXPERIENCE
If an experience has more than 5 bullet points, condense to the 4-5 most impactful ones.
Merge similar bullets. Prioritize bullets with measurable results.

### 9. DATE FORMAT CONSISTENCY
All dates must follow ONE format throughout the CV.
Use the format most natural for the target language:
- Italian: "Gen 2021", "Feb 2023"
- English: "Jan 2021", "Feb 2023"
- If only year is available: "2021"
Fix inconsistencies: "01.2021" and "January 2021" → same format.

### 10. SUMMARY QUALITY
The summary MUST be:
- 2-3 sentences maximum
- Specific to the target role (use role_title context)
- No filler phrases ("dynamic professional", "passionate about", "results-driven")
- Mention years of experience and key domain expertise
If the summary is generic or has filler, rewrite it.

### 11. NO INVENTED OUTCOMES
If a bullet in the input contains no metrics or results, do NOT add them.
"Managed CRM project" → "Gestito il progetto CRM" (not "...con risultati eccellenti").
Your job is to POLISH language, not to INVENT results.

## WHAT YOU MUST NOT DO
- Do NOT invent new experiences, skills, or certifications
- Do NOT modify company names, dates, degree titles, grades
- Do NOT remove experiences (that's the tailor's job)
- Do NOT change the structure/order of sections
- Do NOT touch personal data fields (name, email, phone, location, linkedin, website)
- Do NOT touch photo_base64

## OUTPUT
Return the COMPLETE corrected CV in the same JSON structure as the input.
Every field must be present. This is a correction pass, not a generation pass.`;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "reviewed_cv",
    description: "Return the complete corrected CV after applying all review rules",
    parameters: {
      type: "object",
      properties: {
        personal: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            location: { type: "string" },
            date_of_birth: { type: "string" },
            linkedin: { type: "string" },
            website: { type: "string" },
          },
        },
        summary: { type: "string" },
        experience: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string" },
              company: { type: "string" },
              location: { type: "string" },
              start: { type: "string" },
              end: { type: "string" },
              current: { type: "boolean" },
              description: { type: "string" },
              bullets: { type: "array", items: { type: "string" } },
            },
          },
        },
        education: {
          type: "array",
          items: {
            type: "object",
            properties: {
              institution: { type: "string" },
              degree: { type: "string" },
              field: { type: "string" },
              start: { type: "string" },
              end: { type: "string" },
              grade: { type: "string" },
              honors: { type: "string" },
              program: { type: "string" },
              publication: { type: "string" },
            },
          },
        },
        skills: {
          type: "object",
          properties: {
            technical: { type: "array", items: { type: "string" } },
            soft: { type: "array", items: { type: "string" } },
            tools: { type: "array", items: { type: "string" } },
            languages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  language: { type: "string" },
                  level: { type: "string" },
                  descriptor: { type: "string" },
                },
              },
            },
          },
        },
        certifications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              issuer: { type: "string" },
              year: { type: "string" },
            },
          },
        },
        projects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              link: { type: "string" },
            },
          },
        },
        extra_sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              items: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
      required: ["personal", "summary", "experience", "skills"],
    },
  },
};

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { cv, detected_language, role_title, original_cv, job_requirements } = await req.json();

    if (!cv) {
      return new Response(
        JSON.stringify({ error: "Missing cv in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lang = detected_language || "it";
    const role = role_title || "the target role";

    // Strip photo_base64 to save tokens
    const cvForReview = { ...cv };
    delete cvForReview.photo_base64;

    const userMessage = `## CONTEXT
Target language: ${lang}
Target role: ${role}
${job_requirements ? `Job requirements: ${JSON.stringify(job_requirements)}` : ""}

## ORIGINAL CV (GROUND TRUTH — every claim must be traceable to this)
${original_cv ? JSON.stringify(original_cv) : "Not provided"}

## TAILORED CV TO REVIEW
${JSON.stringify(cvForReview)}

Apply all 11 rules. EVERY text field must be in "${lang}". Fix ALL bullets to start with action verbs. Remove all artifacts and clichés.
CRITICAL: if ANY content in the tailored CV is not traceable to the original CV, revert it to the original.`;

    const userId = user.id;

    const aiResult = await callAi({
      task: "cv-review",
      systemPrompt: SYSTEM_PROMPT,
      userMessage,
      tools: [TOOL_SCHEMA],
      toolChoice: { type: "function", function: { name: "reviewed_cv" } },
      temperature: 0.2,
      maxTokens: 8192,
    }, userId);

    const parsed = aiResult.content;
    if (!parsed) {
      console.error("cv-review: failed to parse AI response");
      return new Response(
        JSON.stringify({ reviewed_cv: cv, review_failed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Preserve photo_base64 from original if present
    if (cv.photo_base64) {
      (parsed as any).photo_base64 = cv.photo_base64;
    }

    // Preserve personal data from original (safety net)
    if (cv.personal) {
      const reviewed = parsed as any;
      if (!reviewed.personal) reviewed.personal = {};
      reviewed.personal.name = cv.personal.name;
      reviewed.personal.email = cv.personal.email;
      reviewed.personal.phone = cv.personal.phone;
      reviewed.personal.linkedin = cv.personal.linkedin;
      reviewed.personal.website = cv.personal.website;
      reviewed.personal.date_of_birth = cv.personal.date_of_birth;
    }

    // Integrity check post-review (only if original_cv provided)
    if (original_cv) {
      const integrityResult = checkIntegrity(original_cv, parsed as Record<string, unknown>);
      if (integrityResult.warnings.length > 0) {
        console.warn(`[cv-review] Integrity: ${integrityResult.warnings.length} issues corrected`);
      }
    }

    return new Response(
      JSON.stringify({ reviewed_cv: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("cv-review error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Review failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
