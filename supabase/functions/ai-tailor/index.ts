import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Utility: compact CV by removing nulls, empty strings, empty arrays, photo_base64 ---
function compactCV(data: Record<string, unknown>): Record<string, unknown> {
  if (Array.isArray(data)) {
    const filtered = data
      .map((item) => (typeof item === "object" && item !== null ? compactCV(item as Record<string, unknown>) : item))
      .filter((item) => item !== null && item !== undefined && item !== "");
    return filtered.length > 0 ? (filtered as unknown as Record<string, unknown>) : (undefined as unknown as Record<string, unknown>);
  }
  if (typeof data === "object" && data !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === "photo_base64") continue; // strip photo
      if (value === null || value === undefined || value === "") continue;
      if (Array.isArray(value) && value.length === 0) continue;
      const compacted = typeof value === "object" && value !== null
        ? compactCV(value as Record<string, unknown>)
        : value;
      if (compacted !== undefined && compacted !== null) {
        result[key] = compacted;
      }
    }
    return Object.keys(result).length > 0 ? result : (undefined as unknown as Record<string, unknown>);
  }
  return data;
}

// --- Utility: apply patches to original CV ---
function applyPatches(
  original: Record<string, unknown>,
  patches: Array<{ path: string; value: unknown }>
): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(original));

  for (const patch of patches) {
    const { path, value } = patch;
    // Parse path like "experience[0].bullets" or "skills.technical" or "summary"
    const segments = path.replace(/\[(\d+)\]/g, ".$1").split(".");
    let target = result;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const idx = Number(seg);
      if (!isNaN(idx)) {
        target = target[idx];
      } else {
        if (target[seg] === undefined || target[seg] === null) {
          // Auto-create intermediate objects
          const nextSeg = segments[i + 1];
          target[seg] = !isNaN(Number(nextSeg)) ? [] : {};
        }
        target = target[seg];
      }
    }
    const lastSeg = segments[segments.length - 1];
    const lastIdx = Number(lastSeg);
    if (!isNaN(lastIdx)) {
      target[lastIdx] = value;
    } else {
      target[lastSeg] = value;
    }
  }

  return result;
}

const SYSTEM_PROMPT = `Sei un esperto career coach e specialista ATS per il mercato italiano ed europeo.

Confronta il CV del candidato con l'annuncio di lavoro e produci un'analisi completa.

## OUTPUT RICHIESTO

### 1. MATCH SCORE (0-100)
Percentuale di compatibilità complessiva tra CV e annuncio.

### 2. ATS SCORE (0-100)
Punteggio di compatibilità con sistemi ATS. Valuta 7 check specifici:
- **keywords**: Le keyword dell'annuncio sono presenti nel CV?
- **format**: Il formato è ATS-friendly (no tabelle, colonne, header/footer)?
- **dates**: Le date sono in formato standard e consistente?
- **measurable**: I risultati sono quantificati con numeri/percentuali?
- **cliches**: Assenza di frasi vuote ("team player", "problem solver" senza contesto)?
- **sections**: Tutte le sezioni standard sono presenti (summary, experience, education, skills)?
- **action_verbs**: I bullet point iniziano con verbi d'azione forti?

### 3. SKILLS ANALYSIS
- skills_present: lista di competenze richieste dall'annuncio con indicazione se il candidato le ha
- skills_missing: competenze mancanti con livello di importanza (essenziale/importante/utile)

### 4. SENIORITY MATCH
Confronta il livello di seniority del candidato con quello richiesto dal ruolo.

### 5. TAILORED PATCHES
Restituisci SOLO le sezioni del CV che hai modificato, come array di patch.
Ogni patch ha:
- path: percorso nel JSON del CV (es. "summary", "experience[0].bullets", "skills.technical")
- value: il nuovo valore per quel campo

NON restituire l'intero CV. Restituisci SOLO i campi che hai effettivamente cambiato.
Percorsi validi: "summary", "experience[N].description", "experience[N].bullets", "skills.technical", "skills.soft", "skills.tools"

### 6. HONEST SCORE
Verifica di onestà delle modifiche apportate.

### 7. DIFF
Lista delle modifiche apportate.

## REGOLE FONDAMENTALI
- **LANGUAGE IN = LANGUAGE OUT**: Rileva la lingua dell'annuncio di lavoro. TUTTE le modifiche al CV (summary, bullets, description, skill labels, suggerimenti, note, diff) DEVONO essere nella STESSA LINGUA dell'annuncio. Se l'annuncio è in inglese, il CV generato deve essere in inglese. Se è in italiano, in italiano. Se è in tedesco, in tedesco. Questa regola è ASSOLUTA e non ammette eccezioni.
- MAI inventare esperienze, competenze o certificazioni
- MAI modificare date, nomi aziende, titoli di studio, gradi, foto
- MAI toccare extra_sections, dati personali, photo_base64
- Puoi SOLO modificare: summary, description/bullets delle esperienze, ordine delle skill
- Ogni patch path DEVE corrispondere a un campo esistente nel CV originale (eccetto nuove skill)

## CALIBRAZIONE MERCATO ITALIANO
- Laurea triennale = Bachelor, Laurea magistrale = Master
- Considera albi professionali (ingegneri, avvocati, commercialisti)
- Riconosci certificazioni italiane ed europee (ECDL, Cambridge, DELF, ecc.)

Rispondi SOLO con il tool function call richiesto.`;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "analyze_and_tailor",
    description: "Analyze CV-job match and produce tailored patches with ATS and honesty checks",
    parameters: {
      type: "object",
      properties: {
        match_score: {
          type: "number",
          description: "Punteggio di match 0-100",
        },
        ats_score: {
          type: "number",
          description: "Punteggio ATS 0-100",
        },
        skills_present: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              has: { type: "boolean" },
            },
            required: ["label", "has"],
          },
        },
        skills_missing: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              importance: { type: "string", enum: ["essenziale", "importante", "utile"] },
            },
            required: ["label", "importance"],
          },
        },
        seniority_match: {
          type: "object",
          properties: {
            candidate_level: { type: "string", enum: ["junior", "mid", "senior", "lead", "executive"] },
            role_level: { type: "string", enum: ["junior", "mid", "senior", "lead", "executive"] },
            match: { type: "boolean" },
            note: { type: "string" },
          },
          required: ["candidate_level", "role_level", "match", "note"],
        },
        ats_checks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              check: { type: "string", enum: ["keywords", "format", "dates", "measurable", "cliches", "sections", "action_verbs"] },
              label: { type: "string" },
              status: { type: "string", enum: ["pass", "warning", "fail"] },
              detail: { type: "string" },
            },
            required: ["check", "label", "status"],
          },
        },
        tailored_patches: {
          type: "array",
          description: "Array di modifiche da applicare al CV originale. Solo i campi effettivamente cambiati.",
          items: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Percorso nel JSON del CV (es. 'summary', 'experience[0].bullets', 'skills.technical')",
              },
              value: {
                description: "Nuovo valore per il campo (stringa, array, oggetto)",
              },
            },
            required: ["path", "value"],
          },
        },
        honest_score: {
          type: "object",
          properties: {
            confidence: { type: "number" },
            experiences_added: { type: "number" },
            skills_invented: { type: "number" },
            dates_modified: { type: "number" },
            bullets_repositioned: { type: "number" },
            bullets_rewritten: { type: "number" },
            sections_removed: { type: "number" },
            flags: { type: "array", items: { type: "string" } },
          },
          required: ["confidence", "experiences_added", "skills_invented", "dates_modified", "bullets_repositioned", "bullets_rewritten", "sections_removed", "flags"],
        },
        diff: {
          type: "array",
          items: {
            type: "object",
            properties: {
              section: { type: "string" },
              index: { type: "number" },
              original: { type: "string" },
              suggested: { type: "string" },
              reason: { type: "string" },
            },
            required: ["section", "original", "suggested", "reason"],
          },
        },
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
      required: [
        "match_score",
        "ats_score",
        "skills_present",
        "skills_missing",
        "seniority_match",
        "ats_checks",
        "tailored_patches",
        "honest_score",
        "diff",
      ],
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

    const originalCV = masterCV.parsed_data as Record<string, unknown>;

    // Save photo_base64 before compacting (will be reinserted after patches)
    const photoBase64 = (originalCV as any)?.photo_base64 || null;

    // Compact CV for AI input (removes nulls, empties, photo_base64)
    const compactedCV = compactCV(originalCV);

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
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `CV ORIGINALE:\n${JSON.stringify(compactedCV)}\n\nANNUNCIO DI LAVORO:\n${JSON.stringify(job_data)}`,
          },
        ],
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "analyze_and_tailor" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Troppi tentativi. Riprova tra qualche momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti AI esauriti." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Errore durante l'analisi AI." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    let result: Record<string, unknown>;
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

    // Apply patches to original CV to produce tailored_cv
    const patches = (result.tailored_patches as Array<{ path: string; value: unknown }>) || [];
    const tailoredCV = applyPatches(originalCV, patches);

    // Reinsert photo_base64 if it existed
    if (photoBase64) {
      (tailoredCV as any).photo_base64 = photoBase64;
    }

    // Replace tailored_patches with tailored_cv for frontend compatibility
    delete result.tailored_patches;
    result.tailored_cv = tailoredCV;
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
