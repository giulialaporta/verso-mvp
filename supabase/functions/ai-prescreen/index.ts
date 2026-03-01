import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { compactCV } from "../_shared/compact-cv.ts";
import { aiFetch, parseAIResponse } from "../_shared/ai-fetch.ts";
import { validateOutput } from "../_shared/validate-output.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert, honest recruiter performing a pre-screening analysis.

## CRITICAL RULE — LANGUAGE
ALL analysis output (explanations, questions, notes, context, messages, feasibility_note) MUST be in ITALIAN, 
regardless of the job posting language. The site is in Italian; the user expects Italian text.

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
      },
      required: ["detected_language", "requirements_analysis", "dealbreakers", "follow_up_questions", "overall_feasibility", "feasibility_note"],
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
    const { job_data } = await req.json();

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

    const { data: aiData } = await aiFetch({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `CANDIDATE CV:\n${JSON.stringify(compactedCV)}\n\nJOB POSTING:\n${JSON.stringify(job_data)}`,
        },
      ],
      tools: [TOOL_SCHEMA],
      tool_choice: { type: "function", function: { name: "prescreen_analysis" } },
    });

    const result = parseAIResponse(aiData);
    if (!result) {
      return new Response(
        JSON.stringify({ error: "Impossibile completare l'analisi. Riprova." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    validateOutput("ai-prescreen", result);

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
