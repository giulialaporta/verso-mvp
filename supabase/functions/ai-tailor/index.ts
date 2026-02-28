import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
- candidate_level: junior/mid/senior/lead/executive
- role_level: junior/mid/senior/lead/executive
- match: true/false
- note: breve spiegazione

### 5. CV ADATTATO
CV riformulato che enfatizza le esperienze rilevanti, riformula le descrizioni per allinearsi ai requisiti, e riordina le sezioni per massimizzare l'impatto.

### 6. HONEST SCORE
Verifica di onestà delle modifiche apportate. Per ogni categoria, conta le occorrenze:
- experiences_added: esperienze inventate (DEVE essere 0)
- skills_invented: competenze inventate (DEVE essere 0)
- dates_modified: date modificate (DEVE essere 0)
- bullets_repositioned: bullet riordinati per priorità
- bullets_rewritten: bullet riformulati (non inventati)
- sections_removed: sezioni rimosse
- confidence: 0-100, quanto sei sicuro che il CV adattato sia onesto
- flags: lista di eventuali problemi riscontrati

### 7. DIFF
Lista delle modifiche apportate con testo originale, testo suggerito e motivazione.

## REGOLE FONDAMENTALI DI ONESTÀ
- MAI inventare esperienze, competenze o certificazioni che non esistono nel CV originale
- MAI modificare date di inizio/fine di esperienze o formazione
- MAI cambiare nomi di aziende, istituzioni o titoli di studio
- MAI aggiungere certificazioni o qualifiche non presenti
- Puoi riformulare, enfatizzare, riordinare e rimuovere — mai aggiungere informazioni false
- Il CV adattato deve contenere SOLO informazioni presenti nell'originale

## CALIBRAZIONE MERCATO ITALIANO
- Laurea triennale = Bachelor, Laurea magistrale = Master
- Considera albi professionali (ingegneri, avvocati, commercialisti)
- Riconosci certificazioni italiane ed europee (ECDL, Cambridge, DELF, ecc.)
- Il formato europeo (Europass) è diffuso ma non sempre ottimale per ATS

Rispondi SOLO con il tool function call richiesto.`;

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "analyze_and_tailor",
    description: "Analyze CV-job match and produce tailored CV with ATS and honesty checks",
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
          description: "Competenze richieste con indicazione se il candidato le ha",
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
          description: "Competenze mancanti con importanza",
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
          description: "Confronto seniority candidato vs ruolo",
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
          description: "7 check ATS specifici",
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
          description: "Verifica di onestà delle modifiche",
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
          description: "Lista delle modifiche apportate",
        },
      },
      required: [
        "match_score",
        "ats_score",
        "skills_present",
        "skills_missing",
        "seniority_match",
        "ats_checks",
        "tailored_cv",
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
            content: `CV ORIGINALE:\n${JSON.stringify(masterCV.parsed_data)}\n\nANNUNCIO DI LAVORO:\n${JSON.stringify(job_data)}`,
          },
        ],
        tools: [TOOL_SCHEMA],
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
