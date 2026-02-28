import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashUrl(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
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

    const { url, text } = await req.json();

    // --- Cache lookup (URL only) ---
    if (url && !text) {
      const urlHash = await hashUrl(url.trim().toLowerCase());

      // Service role client for cache operations
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: cached } = await serviceClient
        .from("job_cache")
        .select("job_data")
        .eq("url_hash", urlHash)
        .gte("created_at", sevenDaysAgo)
        .limit(1)
        .maybeSingle();

      if (cached?.job_data) {
        console.log("Cache hit for URL:", url);
        return new Response(JSON.stringify({ job_data: cached.job_data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch page content
      let jobText = "";
      try {
        const pageResponse = await fetch(url, {
          signal: AbortSignal.timeout(10000),
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; VersoBot/1.0)",
            Accept: "text/html,application/xhtml+xml",
          },
        });

        if (!pageResponse.ok) {
          return new Response(
            JSON.stringify({ error: "Impossibile accedere all'URL. Prova a incollare il testo dell'annuncio." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const html = await pageResponse.text();
        jobText = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/\s+/g, " ")
          .trim();

        if (jobText.length > 15000) jobText = jobText.substring(0, 15000);
      } catch (fetchErr) {
        console.error("Fetch error:", fetchErr);
        return new Response(
          JSON.stringify({ error: "Errore durante il recupero dell'URL. Prova a incollare il testo." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!jobText || jobText.length < 20) {
        return new Response(
          JSON.stringify({ error: "Testo dell'annuncio troppo corto o non trovato." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // AI call
      const jobData = await callAI(jobText);

      // Cache insert (fire-and-forget)
      serviceClient
        .from("job_cache")
        .insert({ url_hash: urlHash, job_data: jobData })
        .then(({ error }) => {
          if (error) console.error("Cache insert error:", error.message);
          else console.log("Cached result for URL:", url);
        });

      return new Response(JSON.stringify({ job_data: jobData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Text-based (no cache) ---
    let jobText = text || "";

    if (!jobText || jobText.length < 20) {
      return new Response(
        JSON.stringify({ error: "Testo dell'annuncio troppo corto o non trovato." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jobData = await callAI(jobText);
    return new Response(JSON.stringify({ job_data: jobData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-job error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function callAI(jobText: string) {
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
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "system",
          content: `Extract key data from a job posting. Respond ONLY via the tool call.

## CRITICAL RULE — LANGUAGE IN = LANGUAGE OUT
Detect the language of the job posting text. ALL extracted fields (role_title, description, key_requirements, required_skills, nice_to_have) MUST be in the SAME language as the job posting.
- English job posting → English output
- Italian job posting → Italian output
- German job posting → German output
This rule is ABSOLUTE. No exceptions. Never translate content.`,
        },
        {
          role: "user",
          content: `Here is the job posting text:\n\n${jobText}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_job_data",
            description: "Extract structured job posting data preserving the original language",
            parameters: {
              type: "object",
              properties: {
                company_name: { type: "string", description: "Company name" },
                role_title: { type: "string", description: "Job title (in the original language of the posting)" },
                location: { type: "string", description: "Work location" },
                job_type: { type: "string", description: "Contract type (full-time, part-time, internship, etc.)" },
                description: { type: "string", description: "Full role description (max 500 words, in the original language)" },
                key_requirements: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-7 key requirements for the ideal candidate (in the original language)",
                },
                required_skills: {
                  type: "array",
                  items: { type: "string" },
                  description: "Required technical and soft skills (in the original language)",
                },
                nice_to_have: {
                  type: "array",
                  items: { type: "string" },
                  description: "Optional or preferred skills (in the original language)",
                },
              },
              required: ["company_name", "role_title", "description", "key_requirements", "required_skills"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_job_data" } },
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error("AI error:", aiResponse.status, errText);
    throw new Error("Errore durante l'analisi dell'annuncio.");
  }

  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    return typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;
  }

  const content = aiData.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error("Impossibile analizzare l'annuncio. Riprova.");
}
