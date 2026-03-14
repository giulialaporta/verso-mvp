import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { compactCV } from "../_shared/compact-cv.ts";
import { callAi } from "../_shared/ai-provider.ts";
import { validateOutput } from "../_shared/validate-output.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { fetchSalaryBenchmarks } from "../_shared/salary-benchmark.ts";

const SYSTEM_PROMPT = `You are an expert, honest recruiter performing a pre-screening analysis.

## CRITICAL RULE — LANGUAGE
ALL analysis output (explanations, questions, notes, context, messages, feasibility_note) MUST be in ITALIAN, 
regardless of the job posting language. The site is in Italian; the user expects Italian text.

## LANGUAGE EXAMPLES
- CV in Italian + Job posting in English → ALL output in Italian (dealbreakers, questions, notes)
- CV in English + Job posting in Italian → ALL output in Italian
- CV in German + Job posting in German → ALL output in Italian
The rule is simple: this is an Italian product. Analysis is ALWAYS in Italian. No exceptions.

## YOUR TASK
1. Extract ALL requirements from the job posting
2. Classify each as: mandatory, preferred, or nice_to_have
   - Keywords for mandatory: "required", "must have", "X+ years", "essential", "obbligatorio", "indispensabile", "necessario"
   - Keywords for preferred: "preferred", "nice to have", "a plus", "gradito", "preferibile", "ideale"
   - If unclear, default to "preferred"
3. Check the candidate's CV against each requirement
4. Identify DEALBREAKERS: mandatory requirements the candidate clearly cannot meet
   - Years of experience gaps (e.g. requires 5+, candidate has 1)
   - Missing mandatory certifications/licenses
   - Missing required degree type
   - These are UNBRIDGEABLE gaps — no amount of rewording fixes them
5. Generate 3-5 FOLLOW-UP QUESTIONS for bridgeable gaps only
   - Ask about implicit skills the candidate might have but didn't list
   - Ask about transferable experience
   - Do NOT ask about unbridgeable gaps (don't ask "do you have 5 years experience?" if the CV shows 1)
6. Assess overall feasibility: low / medium / high

## SALARY ANALYSIS
If the user message includes SALARY_EXPECTATIONS or the job posting explicitly mentions a salary range/RAL:
- Produce a "salary_analysis" object in your response

For candidate_estimate:
- Use the provided salary_expectations if available; source = "user_profile"

For position_estimate:
- If the job posting states an explicit salary/RAL range → use it, source = "job_posting"
- Otherwise ESTIMATE using ALL available context, source = "estimated":
  - **Company name**: use your knowledge of the company's typical compensation
  - **Industry/sector**: tech vs manufacturing vs finance have different pay bands
  - **Company size**: startups vs enterprise pay differently; larger companies often offer higher base
  - **Seniority level**: junior/mid/senior/lead/executive dramatically affects range
  - **Location**: adjust for cost of living (Milan vs remote vs smaller cities)
  - **Role type**: IC vs management, niche vs common roles
  - In the "basis" field, explicitly list which factors you used (e.g. "Stima basata su: ruolo Senior in fintech a Milano, azienda mid-size")

Calculate delta: "positive" if candidate expects less than position offers (good for candidate), "negative" if candidate expects more, "neutral" if overlapping
- delta_percentage: approximate percentage difference between midpoints (e.g. "+12%", "-8%", "~0%")
- note: brief Italian explanation of the comparison
- If SALARY_BENCHMARKS data is provided, use it as PRIMARY source for position_estimate. Set source = "benchmark".
- Cross-reference benchmark data with your own knowledge for validation.
- In "basis", cite the benchmark sources used (e.g. "Da benchmark: Glassdoor, Indeed — ruolo Senior a Milano").
- If NEITHER salary_expectations NOR a salary range in the posting NOR benchmark data is available, do NOT include salary_analysis

## HONESTY RULES
- Be direct and honest. Don't sugarcoat dealbreakers.
- A candidate with critical dealbreakers should get "low" feasibility
- Questions should help discover hidden strengths, not false hope

Respond ONLY with the required tool function call.`;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "prescreen_analysis",
    description: "Analyze job requirements against candidate CV, identify dealbreakers, generate follow-up questions",
    parameters: {
      type: "object",
      properties: {
        detected_language: {
          type: "string",
          description: "ISO 639-1 language code from job posting (e.g. 'it', 'en')",
        },
        requirements_analysis: {
          type: "array",
          items: {
            type: "object",
            properties: {
              requirement: { type: "string" },
              priority: { type: "string", enum: ["mandatory", "preferred", "nice_to_have"] },
              candidate_has: { type: "boolean" },
              gap_type: { type: "string", enum: ["none", "bridgeable", "unbridgeable"] },
              explanation: { type: "string" },
            },
            required: ["requirement", "priority", "candidate_has", "gap_type", "explanation"],
          },
        },
        dealbreakers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              requirement: { type: "string" },
              severity: { type: "string", enum: ["critical", "significant"] },
              message: { type: "string" },
            },
            required: ["requirement", "severity", "message"],
          },
        },
        follow_up_questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              question: { type: "string" },
              context: { type: "string" },
              field: { type: "string", enum: ["experience", "skills", "education", "other"] },
            },
            required: ["id", "question", "context", "field"],
          },
        },
        overall_feasibility: {
          type: "string",
          enum: ["low", "medium", "high"],
        },
        feasibility_note: {
          type: "string",
        },
        salary_analysis: {
          type: "object",
          description: "Optional salary comparison. Include only if salary data is available from candidate profile or job posting.",
          properties: {
            candidate_estimate: {
              type: "object",
              properties: {
                min: { type: "number", description: "Minimum annual salary in euros" },
                max: { type: "number", description: "Maximum annual salary in euros" },
                source: { type: "string", enum: ["user_profile", "estimated"] },
                basis: { type: "string", description: "Brief explanation of source" },
              },
              required: ["min", "max", "source", "basis"],
            },
            position_estimate: {
              type: "object",
              properties: {
                min: { type: "number", description: "Minimum annual salary in euros" },
                max: { type: "number", description: "Maximum annual salary in euros" },
                source: { type: "string", enum: ["job_posting", "estimated", "benchmark"] },
                basis: { type: "string", description: "Brief explanation of source — when estimated, list all factors used" },
                estimation_factors: { type: "array", items: { type: "string" }, description: "Factors used for estimation when source is 'estimated' (e.g. 'industry: fintech', 'seniority: senior', 'location: Milano', 'company_size: enterprise')" },
              },
              required: ["min", "max", "source", "basis"],
            },
            delta: { type: "string", enum: ["positive", "neutral", "negative"] },
            delta_percentage: { type: "string", description: "e.g. '+12%', '-8%', '~0%'" },
            note: { type: "string", description: "Brief Italian explanation" },
            sources: {
              type: "array",
              description: "Optional: benchmark source URLs used for estimation",
              items: {
                type: "object",
                properties: {
                  url: { type: "string" },
                  title: { type: "string" },
                },
                required: ["url", "title"],
              },
            },
          },
          required: ["candidate_estimate", "position_estimate", "delta", "delta_percentage", "note"],
        },
      },
      required: ["detected_language", "requirements_analysis", "dealbreakers", "follow_up_questions", "overall_feasibility", "feasibility_note"],
    },
  },
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

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
    const { job_data, salary_expectations } = await req.json();

    if (!job_data) {
      return new Response(JSON.stringify({ error: "Dati annuncio mancanti" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const compactedCV = compactCV(masterCV.parsed_data as Record<string, unknown>);

    // Fetch salary benchmarks via Firecrawl (non-blocking)
    const benchmarkPromise = fetchSalaryBenchmarks({
      role_title: job_data.role_title || job_data.title || "",
      company_name: job_data.company_name || job_data.company || undefined,
      location: job_data.location || undefined,
      industry: job_data.industry || job_data.sector || undefined,
    });

    // Build user message with optional salary expectations
    let userContent = `CANDIDATE CV:\n${JSON.stringify(compactedCV)}\n\nJOB POSTING:\n${JSON.stringify(job_data)}`;
    if (salary_expectations) {
      userContent += `\n\nSALARY_EXPECTATIONS:\n${JSON.stringify(salary_expectations)}`;
    }

    // Wait for benchmarks and append if available
    const benchmarks = await benchmarkPromise;
    if (benchmarks) {
      userContent += `\n\nSALARY_BENCHMARKS (from web search — use as primary source for position_estimate):\n${benchmarks.raw_context}`;
      console.log(`salary-benchmark: found ${benchmarks.sources.length} sources`);
    }

    const aiResult = await callAi({
      task: "ai-prescreen",
      systemPrompt: SYSTEM_PROMPT,
      userMessage: userContent,
      tools: [TOOL_SCHEMA],
      toolChoice: { type: "function", function: { name: "prescreen_analysis" } },
    }, userId);

    const result = aiResult.content;
    if (!result) {
      return new Response(
        JSON.stringify({ error: "Impossibile completare l'analisi. Riprova." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    validateOutput("ai-prescreen", result);

    // Fallback: if salary_analysis was embedded in feasibility_note as JSON, extract it
    if (!result.salary_analysis && typeof result.feasibility_note === "string") {
      const jsonMatch = result.feasibility_note.match(/"salary_analysis"\s*:\s*(\{[\s\S]*?\})\s*[,}]/);
      if (jsonMatch) {
        try {
          // Try to extract the full salary_analysis JSON from the note
          const noteText = result.feasibility_note;
          const saStart = noteText.indexOf('"salary_analysis"');
          if (saStart !== -1) {
            // Find the JSON object after "salary_analysis":
            const colonIdx = noteText.indexOf(':', saStart);
            const objStart = noteText.indexOf('{', colonIdx);
            if (objStart !== -1) {
              let depth = 0;
              let objEnd = objStart;
              for (let i = objStart; i < noteText.length; i++) {
                if (noteText[i] === '{') depth++;
                if (noteText[i] === '}') depth--;
                if (depth === 0) { objEnd = i + 1; break; }
              }
              const extracted = JSON.parse(noteText.slice(objStart, objEnd));
              if (extracted.candidate_estimate && extracted.position_estimate) {
                result.salary_analysis = extracted;
                // Clean the feasibility_note
                result.feasibility_note = noteText.slice(0, saStart).replace(/[,."]\s*$/, '').trim();
                console.log("salary_analysis extracted from feasibility_note (fallback)");
              }
            }
          }
        } catch {
          console.warn("Failed to extract salary_analysis from feasibility_note");
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    console.error("ai-prescreen error:", e);
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
