import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { role, company } = await req.json();
    if (!role) {
      return new Response(JSON.stringify({ headline: company || "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = "You are a concise headline formatter for a professional profile card on mobile (max ~40 characters for the role part). " +
      "Given a job title and company, produce a compact headline in the format: 'Short Role @Company'. " +
      "Rules: " +
      "- Use standard abbreviations (AI, ML, IT, HR, R&D, UX, UI, CX, BD, DS, SWE, VP, SVP, EVP, CTO, CEO, CFO, COO, CMO, CPO). " +
      "- NEVER invent or change the meaning. Just shorten. " +
      "- If the title has multiple 'and' clauses, keep only the most important one or two. " +
      "- Remove redundant words like 'of the', 'for the' when possible without losing meaning. " +
      "- The result must be truthful and recognizable to the person. " +
      "- Return ONLY the headline string, nothing else.";

    const userPrompt = "Role: " + role + "\nCompany: " + company;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + LOVABLE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 60,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      // Fallback: simple truncation
      console.error("AI gateway error:", response.status);
      const fallback = (role.length > 35 ? role.slice(0, 32) + "..." : role) + (company ? " @" + company : "");
      return new Response(JSON.stringify({ headline: fallback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const headline = (data.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");

    return new Response(JSON.stringify({ headline: headline || role + " @" + company }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compact-headline error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
