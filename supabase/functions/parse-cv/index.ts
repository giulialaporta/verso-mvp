import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch, parseAIResponse } from "../_shared/ai-fetch.ts";
import { validateOutput } from "../_shared/validate-output.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractFirstImage(bytes: Uint8Array): { data: Uint8Array; ext: string } | null {
  // Search for JPEG marker FF D8 FF
  for (let i = 0; i < bytes.length - 3; i++) {
    if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8 && bytes[i + 2] === 0xFF) {
      for (let j = i + 3; j < bytes.length - 1; j++) {
        if (bytes[j] === 0xFF && bytes[j + 1] === 0xD9) {
          const imgBytes = bytes.slice(i, j + 2);
          if (imgBytes.length > 5000 && imgBytes.length < 500000) {
            return { data: imgBytes, ext: "jpg" };
          }
        }
      }
    }
  }
  // Search for PNG marker 89 50 4E 47
  for (let i = 0; i < bytes.length - 8; i++) {
    if (bytes[i] === 0x89 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x4E && bytes[i + 3] === 0x47) {
      for (let j = i + 8; j < bytes.length - 8; j++) {
        if (bytes[j] === 0x49 && bytes[j + 1] === 0x45 && bytes[j + 2] === 0x4E && bytes[j + 3] === 0x44) {
          const imgBytes = bytes.slice(i, j + 8);
          if (imgBytes.length > 5000 && imgBytes.length < 500000) {
            return { data: imgBytes, ext: "png" };
          }
        }
      }
    }
  }
  return null;
}

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
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
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

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("cv-uploads")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return new Response(
        JSON.stringify({ error: "Impossibile scaricare il file" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    let binaryStr = "";
    for (let i = 0; i < bytes.length; i++) {
      binaryStr += String.fromCharCode(bytes[i]);
    }
    const pdfBase64 = btoa(binaryStr);

    // Try to extract profile photo from PDF bytes
    let photoUrl: string | null = null;
    let hasPhotoFromBinary = false;
    try {
      const img = extractFirstImage(bytes);
      if (img) {
        hasPhotoFromBinary = true;
        const photoPath = `${user.id}/photo_${Date.now()}.${img.ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("cv-uploads")
          .upload(photoPath, img.data, {
            contentType: img.ext === "jpg" ? "image/jpeg" : "image/png",
          });
        if (!uploadErr) {
          const { data: urlData } = await supabase.storage.from("cv-uploads").createSignedUrl(photoPath, 60 * 60 * 24 * 365);
          photoUrl = urlData?.signedUrl || null;
        }
      }
    } catch (e) {
      console.error("Photo extraction failed (non-blocking):", e);
    }

    const { data: aiData } = await aiFetch({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are an expert CV/resume parser. You receive a PDF and must extract ALL data in a structured and complete way.

CRITICAL LANGUAGE RULE: Preserve the EXACT original language of the CV. If the CV is written in English, ALL extracted text MUST remain in English. If in Italian, keep it in Italian. If in any other language, keep that language. NEVER translate any content. This applies to every single field: summary, role titles, descriptions, bullets, skills, degree names, certifications — everything.

## SECTION MAPPING (MULTILINGUAL)
Map these common section headers to the correct output fields:
- "Esperienza lavorativa" / "Work Experience" / "Professional Experience" / "Employment History" → experience
- "Istruzione" / "Formazione" / "Education" / "Academic Background" → education  
- "Competenze" / "Skills" / "Abilità" → skills
- "Certificazioni" / "Certifications" / "Qualifiche" → certifications
- "Progetti" / "Projects" / "Portfolio" → projects
- "Profilo" / "Summary" / "About Me" / "Chi sono" / "Obiettivo" → summary

## MULTI-COLUMN LAYOUT
If the CV uses a multi-column layout, read ALL columns. Do not skip sidebar content — it often contains skills, languages, contact info, or certifications.

## DESCRIPTION vs BULLETS SEPARATION
For each experience entry:
- "description" = narrative paragraph text (if any)
- "bullets" = individual bullet points or list items
If only bullets exist, leave description empty. If only narrative, leave bullets empty. NEVER merge them.

## LANGUAGE NORMALIZATION
For language skills, normalize to CEFR levels when possible:
- "Fluent" / "Fluente" → C1-C2
- "Intermediate" / "Intermedio" → B1-B2  
- "Basic" / "Base" / "Elementare" → A1-A2
- "Native" / "Madrelingua" / "Mother tongue" → "Madrelingua" or "Native"

## NULL HANDLING
If a field is not present in the CV, omit it entirely. Do NOT set it to null, "N/A", "None", or empty string.

RULES:
- The "summary" field is REQUIRED. If the CV has an explicit section (Profile, Summary, Objective, About Me, Profilo, Chi sono), use it verbatim. If NO such section exists, synthesize a 2-3 sentence professional profile based on: current role, years of experience, main sector, distinctive skills. Do not invent anything: use only information present in the CV.
- For experience, ALWAYS separate narrative text (description) from bullet points (bullets).
- For skills, categorize into 4 groups: technical (domain competencies), soft (transferable skills), tools (software and tools), languages (with CEFR level if indicated).
- For education:
  - degree: use the FULL qualification title exactly as written
  - field: use the specialization or discipline
  - grade: extract the grade/score
  - honors: extract distinctions (e.g., "cum laude")
  - program: exchange programs, Erasmus, double degree
  - publication: thesis title or related publication
- ANY CV section that does NOT fit standard categories MUST be captured in extra_sections
- has_photo: set to true if the CV visually contains a photo of the candidate
- Extract EVERYTHING. Do not lose any information present in the document.`,
        },
        {
          role: "user",
          content: [
            {
              type: "file",
              file: {
                filename: "cv.pdf",
                file_data: `data:application/pdf;base64,${pdfBase64}`,
              },
            },
            {
              type: "text",
              text: "Extract all structured data from this CV using the extract_cv_data tool. Preserve the original language exactly — do NOT translate any content.",
            },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_cv_data",
            description: "Extract all structured CV data from the document",
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
                    date_of_birth: { type: "string" },
                    linkedin: { type: "string" },
                    website: { type: "string" },
                  },
                },
                has_photo: { type: "boolean", description: "true if the CV visually contains a candidate photo" },
                summary: {
                  type: "string",
                  description: "REQUIRED. Professional summary extracted or synthesized from CV content.",
                },
                experience: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      role: { type: "string" },
                      company: { type: "string" },
                      location: { type: "string" },
                      start: { type: "string" },
                      end: { type: "string" },
                      current: { type: "boolean" },
                      description: { type: "string" },
                      bullets: { type: "array", items: { type: "string" } },
                    },
                    required: ["role", "company"],
                  },
                },
                education: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      institution: { type: "string" },
                      degree: { type: "string" },
                      field: { type: "string" },
                      start: { type: "string" },
                      end: { type: "string" },
                      grade: { type: "string" },
                      honors: { type: "string" },
                      program: { type: "string" },
                      publication: { type: "string" },
                    },
                    required: ["institution", "degree"],
                  },
                },
                skills: {
                  type: "object",
                  properties: {
                    technical: { type: "array", items: { type: "string" } },
                    soft: { type: "array", items: { type: "string" } },
                    tools: { type: "array", items: { type: "string" } },
                    languages: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          language: { type: "string" },
                          level: { type: "string" },
                          descriptor: { type: "string" },
                        },
                        required: ["language"],
                      },
                    },
                  },
                },
                certifications: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      issuer: { type: "string" },
                      year: { type: "string" },
                    },
                    required: ["name"],
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
                    required: ["name"],
                  },
                },
                extra_sections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      items: { type: "array", items: { type: "string" } },
                    },
                    required: ["title", "items"],
                  },
                },
              },
              required: ["personal", "summary"],
            },
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: { name: "extract_cv_data" },
      },
    });

    const parsedCV = parseAIResponse(aiData);
    if (!parsedCV) {
      return new Response(
        JSON.stringify({ error: "Impossibile analizzare il CV. Riprova." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    validateOutput("parse-cv", parsedCV);

    // Use AI's has_photo to conditionally keep binary-extracted photo
    const aiDetectedPhoto = parsedCV.has_photo;
    delete parsedCV.has_photo;

    // Only use binary-extracted photo if AI also confirms photo presence
    const finalPhotoUrl = (aiDetectedPhoto && hasPhotoFromBinary) ? photoUrl : (hasPhotoFromBinary ? photoUrl : null);

    if (finalPhotoUrl) {
      parsedCV.photo_base64 = finalPhotoUrl;
    }

    return new Response(
      JSON.stringify({
        parsed_data: parsedCV,
        raw_text: "multimodal",
        has_photo: aiDetectedPhoto || false,
        photo_url: finalPhotoUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    console.error("parse-cv error:", e);
    const status = (e as any)?.status;
    if (status === 429) {
      return new Response(JSON.stringify({ error: "Troppi tentativi. Riprova tra qualche momento." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (status === 402) {
      return new Response(JSON.stringify({ error: "Crediti AI esauriti." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
