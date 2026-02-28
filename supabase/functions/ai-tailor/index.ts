import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
          {
            role: "system",
            content: `Sei un esperto career coach. Confronta il CV del candidato con l'annuncio di lavoro e produci:
1. Un punteggio di match (0-100)
2. Lista delle skill che il candidato ha e che matchano
3. Lista delle skill mancanti con livello di importanza (alta/media/bassa)
4. Un CV adattato che enfatizza le esperienze rilevanti, riformula le descrizioni per allinearsi ai requisiti, e riordina le sezioni per massimizzare l'impatto
5. Lista delle modifiche apportate con testo originale e testo suggerito

REGOLE FONDAMENTALI:
- NON inventare esperienze, competenze o certificazioni che non esistono nel CV originale
- Puoi riformulare, enfatizzare e riordinare, mai aggiungere informazioni false
- Il CV adattato deve contenere SOLO informazioni presenti nell'originale, presentate in modo ottimale per questa posizione

Rispondi SOLO con JSON valido.`,
          },
          {
            role: "user",
            content: `CV ORIGINALE:\n${JSON.stringify(masterCV.parsed_data)}\n\nANNUNCIO DI LAVORO:\n${JSON.stringify(job_data)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_and_tailor",
              description: "Analyze CV-job match and produce tailored CV",
              parameters: {
                type: "object",
                properties: {
                  match_score: {
                    type: "number",
                    description: "Punteggio di match 0-100",
                  },
                  matching_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Competenze che il candidato ha e che matchano",
                  },
                  missing_skills: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        skill: { type: "string" },
                        importance: { type: "string", enum: ["alta", "media", "bassa"] },
                      },
                    },
                    description: "Competenze mancanti con importanza",
                  },
                  tailored_cv: {
                    type: "object",
                    description: "CV adattato con stessa struttura dell'originale ma contenuto ottimizzato",
                    properties: {
                      personal: { type: "object" },
                      summary: { type: "string" },
                      experience: { type: "array", items: { type: "object" } },
                      education: { type: "array", items: { type: "object" } },
                      skills: { type: "array", items: { type: "string" } },
                      certifications: { type: "array", items: { type: "object" } },
                      projects: { type: "array", items: { type: "object" } },
                      languages: { type: "array", items: { type: "object" } },
                    },
                  },
                  changes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        section: { type: "string" },
                        original: { type: "string" },
                        suggested: { type: "string" },
                        reason: { type: "string" },
                      },
                    },
                    description: "Lista delle modifiche apportate",
                  },
                  summary_note: {
                    type: "string",
                    description: "Breve nota riassuntiva (max 2 frasi) sulle modifiche principali",
                  },
                },
                required: ["match_score", "matching_skills", "missing_skills", "tailored_cv", "changes"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_and_tailor" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Errore durante l'analisi AI." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    let result;
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

    // Include master_cv_id for later saving
    result.master_cv_id = masterCV.id;

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
