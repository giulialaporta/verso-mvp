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
    - Each question MUST be a single, direct question — ONE sentence, max 15 words
    - Ask YES/NO-style questions about specific skills or experiences
    - Good: "Hai esperienza con Kubernetes in produzione?"
    - Bad: "Quale esperienza hai avuto con la gestione end-to-end di discovery e validazione di ipotesi?"
    - Do NOT combine multiple questions into one
    - Do NOT ask the candidate to provide examples or elaborate
    - For each question, generate 3-4 CONTEXTUAL answer options as chips. These must be:
      * Specific to the question (NOT generic "Sì/No/Un po'")
      * Short (2-5 words each)
      * Covering the full spectrum from strong match to no match
      * Examples: for "Hai esperienza con Kubernetes?" → ["In produzione, 3+ anni", "Uso base/dev", "Solo teoria", "No"]
      * Examples: for "Conosci Python?" → ["Uso quotidiano", "Progetti personali", "Basi scolastiche", "No"]
      * Examples: for "Hai gestito team?" → ["Team 5+", "Team piccolo", "Co-lead", "No"]
    - The "context" field explains WHY you're asking (for the UI), keep it under 20 words
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

## OUTPUT CLEANLINESS — ABSOLUTE RULE
The feasibility_note field is displayed directly to the user in the UI.
It MUST contain ONLY clean, human-readable Italian text. NEVER include:
- JSON, parameter names, or technical syntax (e.g. "salary_analysis", "candidate_estimate", "delta_percentage")
- Raw data structures, curly braces, square brackets, or key-value pairs
- Tool call syntax, XML tags, or any markup
- URLs or source references (those belong in salary_analysis.sources)
- Numbers formatted as JSON (use natural language: "€30.000-40.000" not {"min": 30000, "max": 40000})
The feasibility_note should read like a brief, professional recruiter assessment paragraph. Nothing more.
CRITICAL: salary_analysis MUST be returned ONLY via the tool call parameters, NEVER embedded in feasibility_note text.

## OVERQUALIFIED CANDIDATES — IMPORTANT
When a candidate has MORE experience/seniority than the role requires:
- This is NOT a dealbreaker. Being overqualified is NEVER a reason to discourage a candidacy.
- Do NOT suggest "non procedere con questa candidatura" — the candidate chose to apply, respect that.
- Frame extra experience as added value: leadership, mentorship, strategic vision.
- Focus feasibility_note on ACTUAL skill gaps (technical mismatches), not seniority mismatch.
- If the candidate lacks specific technical skills for the role, note those gaps honestly, but do NOT frame years of experience as a negative.
- The feasibility assessment should be based ONLY on whether the candidate can DO the job, not on whether the role is "beneath" them.

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
              question: { type: "string", description: "Single direct question, max 15 words" },
              context: { type: "string", description: "Why this matters, max 20 words" },
              field: { type: "string", enum: ["experience", "skills", "education", "other"] },
              options: {
                type: "array",
                description: "3-4 contextual answer chips, specific to the question. Short (2-5 words). From strongest match to weakest. Last option should be negative/no.",
                items: {
                  type: "object",
                  properties: {
                    value: { type: "string", description: "Machine-readable value" },
                    label: { type: "string", description: "Display label, 2-5 words, specific to the question" },
                  },
                  required: ["value", "label"],
                },
              },
            },
            required: ["id", "question", "context", "field", "options"],
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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      console.error("[ai-prescreen] auth failed:", userError?.message || "no user");
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
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

    // Wait for benchmarks with 3s timeout to avoid blocking on slow Firecrawl
    let benchmarks = null;
    try {
      benchmarks = await Promise.race([
        benchmarkPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("benchmark_timeout")), 3000)),
      ]);
    } catch (e) {
      console.warn(`salary-benchmark: ${(e as Error).message === "benchmark_timeout" ? "timed out after 3s, proceeding without" : "failed: " + (e as Error).message}`);
    }
    if (benchmarks) {
      userContent += `\n\nSALARY_BENCHMARKS (from web search — use as primary source for position_estimate):\n${(benchmarks as any).raw_context}`;
      console.log(`salary-benchmark: found ${(benchmarks as any).sources.length} sources`);
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

    // Log warning if salary_analysis ended up in feasibility_note (prompt issue, not a parsing problem)
    if (!result.salary_analysis && typeof result.feasibility_note === "string" && result.feasibility_note.includes("salary_analysis")) {
      console.warn("salary_analysis appears embedded in feasibility_note — prompt enforcement issue, not extracting");
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
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
