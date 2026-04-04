import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { callAi } from "../_shared/ai-provider.ts";
import { compactCV } from "../_shared/compact-cv.ts";

const SYSTEM_PROMPT = `Sei un recruiter esperto con 15+ anni di esperienza nella revisione di CV per massimizzare il tasso di passaggio dei sistemi ATS e la prima impressione del hiring manager.

Il tuo compito e' duplice:

## 1. OTTIMIZZAZIONE CV (optimized_cv)
Correggi SOLO la forma del CV ricevuto, senza mai inventare contenuti:
- Riscrivi i bullet point con verbi d'azione forti all'inizio (es. "Gestito" -> "Guidato", "Fatto" -> "Implementato")
- Rimuovi cliche e frasi generiche (es. "team player", "problem solver" usati da soli)
- Uniforma il formato delle date (es. "gen 2021 - dic 2023")
- Migliora il summary se generico o troppo vago, rendendolo specifico al settore/ruolo
- Correggi errori grammaticali evidenti
- NON aggiungere esperienze, skill o contenuti non presenti nell'originale
- NON rimuovere contenuti esistenti
- Mantieni la stessa lingua del CV originale (italiano o inglese)
- Restituisci l'intero oggetto CV con le correzioni applicate

## 2. SUGGERIMENTI (tips)
Genera suggerimenti azionabili per migliorare il CV. Categorie consentite:
- missing_kpi: bullet point senza metriche/numeri (%, euro, volumi). Indica QUALI esperienze specifiche ne beneficerebbero.
- missing_section: sezioni importanti assenti (es. certificazioni, progetti, summary)
- weak_bullets: bullet che iniziano con sostantivi invece che verbi d'azione, o troppo vaghi
- generic_skills: skill troppo generiche per l'ATS (es. "Problem Solving" da solo)
- missing_contact: informazioni di contatto mancanti (LinkedIn, email, telefono)
- summary_quality: summary assente, troppo generico o non specifico al settore

Per ogni tip indica:
- category: una delle categorie sopra
- message: messaggio specifico e azionabile in italiano (max 2 frasi)
- priority: "high" se impatta direttamente il passaggio ATS, "medium" se migliora la qualita, "low" se e' un nice-to-have
- section: la sezione del CV a cui si riferisce (opzionale)

NON includere suggerimenti su gap temporali tra esperienze.
Massimo 8 tips, ordinati per priorita decrescente.`;

const TOOL_SCHEMA = {
  type: "function" as const,
  function: {
    name: "cv_optimization_result",
    description: "Returns the optimized CV and improvement tips",
    parameters: {
      type: "object",
      properties: {
        optimized_cv: {
          type: "object",
          description: "The full CV object with formatting improvements applied",
        },
        tips: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["missing_kpi", "missing_section", "weak_bullets", "generic_skills", "missing_contact", "summary_quality"],
              },
              message: { type: "string" },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              section: { type: "string" },
            },
            required: ["category", "message", "priority"],
          },
        },
      },
      required: ["optimized_cv", "tips"],
    },
  },
};

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { cv_data } = await req.json();
    if (!cv_data || typeof cv_data !== "object") {
      return new Response(JSON.stringify({ error: "cv_data is required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const compacted = compactCV(cv_data);
    const userMessage = "Ecco il CV da ottimizzare:\n\n" + JSON.stringify(compacted, null, 2);

    const aiResult = await callAi(
      {
        task: "cv-optimize",
        systemPrompt: SYSTEM_PROMPT,
        userMessage,
        tools: [TOOL_SCHEMA],
        toolChoice: { type: "function", function: { name: "cv_optimization_result" } },
        temperature: 0.2,
        maxTokens: 8192,
      },
      user.id
    );

    const result = aiResult.content as { optimized_cv?: Record<string, unknown>; tips?: unknown[] };

    return new Response(
      JSON.stringify({
        optimized_cv: result.optimized_cv || cv_data,
        tips: Array.isArray(result.tips) ? result.tips : [],
      }),
      {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  } catch (e: unknown) {
    const status = (e as any)?.status;
    if (status === 429) {
      return new Response(JSON.stringify({ error: "Troppe richieste. Riprova tra qualche secondo." }), {
        status: 429,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (status === 402) {
      return new Response(JSON.stringify({ error: "Crediti AI esauriti." }), {
        status: 402,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    console.error("cv-optimize error:", (e as Error).message);
    return new Response(
      JSON.stringify({ error: (e as Error).message || "Errore durante l'ottimizzazione" }),
      {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }
});
