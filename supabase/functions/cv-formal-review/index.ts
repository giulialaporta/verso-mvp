import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAi } from "../_shared/ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT =
  "Sei il revisore finale della forma dei CV generati da Verso. " +
  "Ricevi in input un CV strutturato in JSON e il tuo unico compito e' controllare che sia formalmente impeccabile prima che l'utente lo scarichi.\n\n" +
  "Non valutare i contenuti, non riscrivere i testi, non giudicare le scelte di carriera. Intervieni solo sulla forma.\n\n" +
  "CONTROLLI DA ESEGUIRE:\n\n" +
  "1. COERENZA FORMATO DATE\n" +
  "   - Tutte le date devono seguire un formato unico in tutto il documento\n" +
  "   - Es. se una esperienza usa 'Gen 2020', tutte devono usare 'Mmm YYYY'\n" +
  "   - Se trovi '01/2020' accanto a 'Gen 2020', uniforma\n\n" +
  "2. SEPARATORE DATE\n" +
  "   - Il separatore tra date di inizio e fine deve essere lo stesso ovunque\n" +
  "   - Scegli uno tra '–' (en dash), '-' (hyphen), '—' (em dash) e applicalo ovunque\n\n" +
  "3. MAIUSCOLE CONSISTENTI\n" +
  "   - I titoli di ruolo devono seguire la stessa convenzione (Title Case o minuscolo)\n" +
  "   - I nomi aziendali devono essere scritti come il nome ufficiale dell'azienda\n\n" +
  "4. LINGUA UNICA\n" +
  "   - Nessun mix involontario italiano/inglese\n" +
  "   - Se il CV e' in italiano, tutto deve essere in italiano (tranne nomi propri, tecnologie, job title internazionali standard)\n\n" +
  "5. BULLET POINT UNIFORMI\n" +
  "   - I bullet devono essere uniformi per struttura\n" +
  "   - Mai troppo corti (meno di 5 parole) ne' troppo lunghi (piu' di 3 righe)\n" +
  "   - Ogni bullet inizia con un verbo d'azione o una struttura coerente\n\n" +
  "6. PUNTEGGIATURA E RIPETIZIONI\n" +
  "   - Punteggiatura consistente (tutti i bullet con o senza punto finale)\n" +
  "   - Nessuna ripetizione di parole ravvicinate nella stessa frase o in bullet consecutivi\n\n" +
  "7. FLUIDITA' DELLA LETTURA\n" +
  "   - Fai una lettura dall'inizio alla fine come farebbe un recruiter\n" +
  "   - Se trovi frasi spezzate male, costruzioni meccaniche, punteggiatura inconsistente: ritocca con il tocco minimo necessario\n" +
  "   - Una parola, un segno di punteggiatura, l'ordine di una frase. Non riscrivere, ritocca.\n" +
  "   - L'obiettivo e' che il documento suoni scritto da una persona, non generato da una macchina.\n\n" +
  "OUTPUT: usa la funzione 'formal_review_result' per restituire i risultati.\n" +
  "Se non trovi nulla da correggere, restituisci fixes vuoto e revised_cv identico all'input.";

const TOOL_SCHEMA = {
  type: "function" as const,
  function: {
    name: "formal_review_result",
    description: "Restituisce il risultato della revisione formale del CV",
    parameters: {
      type: "object",
      properties: {
        fixes: {
          type: "array",
          description: "Lista delle correzioni applicate. Vuoto se nessuna correzione.",
          items: {
            type: "object",
            properties: {
              section: {
                type: "string",
                description: "Sezione del CV (es. 'experience[0]', 'summary', 'education[1]')",
              },
              field: {
                type: "string",
                description: "Campo specifico (es. 'start', 'bullets[2]', 'role')",
              },
              problem: {
                type: "string",
                description: "Descrizione del problema trovato",
              },
              correction: {
                type: "string",
                description: "Descrizione della correzione applicata",
              },
            },
            required: ["section", "field", "problem", "correction"],
            additionalProperties: false,
          },
        },
        revised_cv: {
          type: "object",
          description: "Il CV con le correzioni applicate, nella stessa struttura ricevuta in input",
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

    const userMessage =
      "Revisiona formalmente questo CV.\n\nTemplate selezionato: " +
      (template_id || "classico") +
      "\n\nCV strutturato:\n" +
      JSON.stringify(cv, null, 2);

    const result = await callAi({
      task: "cv-formal-review",
      systemPrompt: SYSTEM_PROMPT,
      userMessage,
      tools: [TOOL_SCHEMA],
      toolChoice: { type: "function", function: { name: "formal_review_result" } },
      maxTokens: 8192,
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
