import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { role, company } = await req.json();
    if (!role) {
      return new Response(JSON.stringify({ headline: company || "" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Missing API key");

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
      console.error("AI gateway error:", response.status);
      const fallback = (role.length > 35 ? role.slice(0, 32) + "..." : role) + (company ? " @" + company : "");
      return new Response(JSON.stringify({ headline: fallback }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const headline = (data.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");

    return new Response(JSON.stringify({ headline: headline || role + " @" + company }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compact-headline error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
