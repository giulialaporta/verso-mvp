import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { filePath } = await req.json();
    if (!filePath) {
      return new Response(JSON.stringify({ error: "filePath mancante" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("cv-uploads")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return new Response(
        JSON.stringify({ error: "Impossibile scaricare il file" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract text from PDF bytes using a basic approach
    // We send the raw text content to AI for structuring
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Simple PDF text extraction - extract readable strings
    let rawText = "";
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const fullText = decoder.decode(bytes);

    // Extract text between BT/ET blocks and parentheses (PDF text objects)
    const textMatches = fullText.match(/\(([^)]+)\)/g);
    if (textMatches) {
      rawText = textMatches
        .map((m) => m.slice(1, -1))
        .filter((t) => t.length > 1 && /[a-zA-ZÀ-ú0-9]/.test(t))
        .join(" ");
    }

    // Fallback: try extracting any readable text
    if (rawText.length < 50) {
      rawText = fullText.replace(/[^\x20-\x7EÀ-ú\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
      // Trim to reasonable size
      if (rawText.length > 15000) rawText = rawText.substring(0, 15000);
    }

    if (rawText.length < 20) {
      return new Response(
        JSON.stringify({
          error:
            "Non è stato possibile estrarre testo dal PDF. Assicurati che il file contenga testo selezionabile.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send to Lovable AI for structured extraction
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Sei un esperto parser di CV. Estrai i dati dal testo di un CV e restituisci SOLO un JSON valido con questa struttura esatta:
{
  "personal": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "" },
  "summary": "",
  "experience": [{ "title": "", "company": "", "period": "", "description": "" }],
  "education": [{ "degree": "", "institution": "", "period": "" }],
  "skills": ["skill1", "skill2"],
  "certifications": [{ "name": "", "year": "" }],
  "projects": [{ "name": "", "description": "" }],
  "languages": [{ "language": "", "level": "" }]
}
Riempi solo i campi per cui trovi informazioni. Per array vuoti usa []. Non inventare dati. Rispondi SOLO con il JSON, senza markdown o spiegazioni.`,
            },
            {
              role: "user",
              content: `Ecco il testo estratto dal CV:\n\n${rawText}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_cv_data",
                description: "Extract structured CV data from raw text",
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
                        linkedin: { type: "string" },
                      },
                    },
                    summary: { type: "string" },
                    experience: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          company: { type: "string" },
                          period: { type: "string" },
                          description: { type: "string" },
                        },
                      },
                    },
                    education: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          degree: { type: "string" },
                          institution: { type: "string" },
                          period: { type: "string" },
                        },
                      },
                    },
                    skills: { type: "array", items: { type: "string" } },
                    certifications: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
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
                        },
                      },
                    },
                    languages: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          language: { type: "string" },
                          level: { type: "string" },
                        },
                      },
                    },
                  },
                  required: ["personal", "skills"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_cv_data" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Troppi tentativi. Riprova tra qualche momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti AI esauriti." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Errore durante l'analisi del CV" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();

    // Extract from tool call response
    let parsedCV;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      parsedCV =
        typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
    } else {
      // Fallback: try parsing from content
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedCV = JSON.parse(jsonMatch[0]);
      } else {
        return new Response(
          JSON.stringify({ error: "Impossibile analizzare il CV. Riprova." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(JSON.stringify({ parsed_data: parsedCV }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-cv error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Errore sconosciuto",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
