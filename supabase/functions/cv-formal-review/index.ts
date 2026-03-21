import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAi } from "../_shared/ai-provider.ts";
import { compactCV } from "../_shared/compact-cv.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT =
  "Revisore finale della forma di un CV. Controlla SOLO la forma, non i contenuti.\n\n" +
  "CHECKLIST:\n" +
  "1. Date: formato unico (es. tutte 'Mmm YYYY' o tutte 'MM/YYYY')\n" +
  "2. Separatore date: unico ovunque (- o –)\n" +
  "3. Maiuscole: convenzione costante per ruoli e aziende\n" +
  "4. Lingua: niente mix involontario it/en (nomi propri e tech OK)\n" +
  "5. Bullet: struttura uniforme, verbo d'azione, no troppo corti (<5 parole) o lunghi (>3 righe)\n" +
  "6. Punteggiatura: consistente (tutti con o senza punto finale), no ripetizioni ravvicinate\n" +
  "7. Fluidita': ritocco minimo per frasi meccaniche o spezzate\n\n" +
  "OUTPUT: JSON con 'fixes' (array di correzioni) e 'revised_cv' (CV corretto, stessa struttura input).\n" +
  "Se nulla da correggere: fixes vuoto, revised_cv identico.";

const TOOL_SCHEMA = {
  type: "function" as const,
  function: {
    name: "formal_review_result",
    description: "Risultato revisione formale CV",
    parameters: {
      type: "object",
      properties: {
        fixes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              section: { type: "string" },
              field: { type: "string" },
              problem: { type: "string" },
              correction: { type: "string" },
            },
            required: ["section", "field", "problem", "correction"],
            additionalProperties: false,
          },
        },
        revised_cv: {
          type: "object",
        },
      },
      required: ["fixes", "revised_cv"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cv, template_id } = await req.json();

    if (!cv || typeof cv !== "object") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'cv' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compact CV: remove nulls, empty strings, photo_base64
    const compacted = compactCV(cv);

    const userMessage =
      "Template: " + (template_id || "classico") +
      "\n\nCV:\n" + JSON.stringify(compacted);

    const result = await callAi({
      task: "cv-formal-review",
      systemPrompt: SYSTEM_PROMPT,
      userMessage,
      tools: [TOOL_SCHEMA],
      toolChoice: { type: "function", function: { name: "formal_review_result" } },
      maxTokens: 4096,
    });

    const output = result.content as { fixes?: unknown[]; revised_cv?: Record<string, unknown> };

    return new Response(
      JSON.stringify({
        fixes: output.fixes || [],
        revised_cv: output.revised_cv || cv,
        provider: result.provider,
        model: result.model,
        tokens_in: result.tokensIn,
        tokens_out: result.tokensOut,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("cv-formal-review error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
