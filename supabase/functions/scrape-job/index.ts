import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch, parseAIResponse } from "../_shared/ai-fetch.ts";
import { validateOutput } from "../_shared/validate-output.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- SSRF Protection ---
function validateUrl(input: string): string {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("URL non valido.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Solo URL HTTPS sono permessi.");
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block internal/private hostnames
  const blocked = [
    "localhost", "127.0.0.1", "0.0.0.0", "[::1]",
    "metadata.google.internal", "169.254.169.254",
  ];
  if (blocked.includes(hostname)) {
    throw new Error("URL non permesso.");
  }

  // Block private IP ranges
  const parts = hostname.split(".");
  if (parts.length === 4 && parts.every(p => /^\d+$/.test(p))) {
    const a = parseInt(parts[0]);
    const b = parseInt(parts[1]);
    if (
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0 || a === 127
    ) {
      throw new Error("URL non permesso.");
    }
  }

  // Block Supabase internal
  if (hostname.endsWith(".internal") || hostname.endsWith(".local")) {
    throw new Error("URL non permesso.");
  }

  return parsed.toString();
}

async function hashUrl(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function cleanHTML(html: string): string {
  return html
    // Remove nav, header, footer, sidebar elements
    .replace(/<(nav|header|footer|aside)[\s\S]*?<\/\1>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

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

    const { url, text } = await req.json();

    // --- Cache lookup (URL only) ---
    if (url && !text) {
      const urlHash = await hashUrl(url.trim().toLowerCase());

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
        jobText = cleanHTML(html);

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

      const jobData = await callAI(jobText);

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
  const { data: aiData } = await aiFetch({
    model: "google/gemini-2.5-flash",
    messages: [
      {
        role: "system",
        content: `Extract key data from a job posting. Respond ONLY via the tool call.

## CRITICAL RULE — LANGUAGE IN = LANGUAGE OUT
Detect the language of the job posting text. ALL extracted fields (role_title, description, key_requirements, required_skills, nice_to_have) MUST be in the SAME language as the job posting.
- English job posting → English output
- Italian job posting → Italian output
- German job posting → German output
This rule is ABSOLUTE. No exceptions. Never translate content.

## IMPLICIT REQUIREMENTS
Beyond explicitly stated requirements, infer implicit ones:
- If the posting mentions "team lead" or "mentor junior developers", infer leadership skills
- If it mentions specific methodologies (Agile, Scrum), infer familiarity with those
- If it mentions client-facing work, infer communication and presentation skills
Add these as nice_to_have unless explicitly required.`,
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
              company_name: { type: "string" },
              role_title: { type: "string" },
              location: { type: "string" },
              job_type: { type: "string" },
              description: { type: "string", description: "Full role description (max 500 words, original language)" },
              key_requirements: { type: "array", items: { type: "string" } },
              required_skills: { type: "array", items: { type: "string" } },
              nice_to_have: { type: "array", items: { type: "string" } },
              seniority_level: { type: "string", description: "junior/mid/senior/lead/executive if detectable" },
              salary_range: { type: "string", description: "Salary range if mentioned" },
              industry: { type: "string", description: "Industry/sector if detectable" },
            },
            required: ["company_name", "role_title", "description", "key_requirements", "required_skills"],
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "extract_job_data" } },
  });

  const result = parseAIResponse(aiData);
  if (!result) throw new Error("Impossibile analizzare l'annuncio. Riprova.");

  validateOutput("scrape-job", result);

  return result;
}
