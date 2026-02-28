import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractFirstImage(bytes: Uint8Array): { data: Uint8Array; ext: string } | null {
  // Search for JPEG marker FF D8 FF
  for (let i = 0; i < bytes.length - 3; i++) {
    if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8 && bytes[i + 2] === 0xFF) {
      // Find JPEG end marker FF D9
      for (let j = i + 3; j < bytes.length - 1; j++) {
        if (bytes[j] === 0xFF && bytes[j + 1] === 0xD9) {
          const imgBytes = bytes.slice(i, j + 2);
          if (imgBytes.length > 2000) { // Skip tiny images (icons, decorations)
            return { data: imgBytes, ext: "jpg" };
          }
        }
      }
    }
  }
  // Search for PNG marker 89 50 4E 47
  for (let i = 0; i < bytes.length - 8; i++) {
    if (bytes[i] === 0x89 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x4E && bytes[i + 3] === 0x47) {
      // Find PNG end marker IEND
      for (let j = i + 8; j < bytes.length - 8; j++) {
        if (bytes[j] === 0x49 && bytes[j + 1] === 0x45 && bytes[j + 2] === 0x4E && bytes[j + 3] === 0x44) {
          const imgBytes = bytes.slice(i, j + 8);
          if (imgBytes.length > 2000) {
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

    // Download PDF from storage
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

    // Convert PDF to base64 for multimodal AI input
    let binaryStr = "";
    for (let i = 0; i < bytes.length; i++) {
      binaryStr += String.fromCharCode(bytes[i]);
    }
    const pdfBase64 = btoa(binaryStr);

    // Try to extract profile photo from PDF bytes
    let photoUrl: string | null = null;
    try {
      const img = extractFirstImage(bytes);
      if (img) {
        const photoPath = `${user.id}/photo_${Date.now()}.${img.ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("cv-uploads")
          .upload(photoPath, img.data, {
            contentType: img.ext === "jpg" ? "image/jpeg" : "image/png",
          });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("cv-uploads").getPublicUrl(photoPath);
          photoUrl = urlData?.publicUrl || null;
        }
      }
    } catch (e) {
      console.error("Photo extraction failed (non-blocking):", e);
    }

    // Send PDF to AI as multimodal input
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
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an expert CV/resume parser. You receive a PDF and must extract ALL data in a structured and complete way.

CRITICAL LANGUAGE RULE: Preserve the EXACT original language of the CV. If the CV is written in English, ALL extracted text MUST remain in English. If in Italian, keep it in Italian. If in any other language, keep that language. NEVER translate any content. This applies to every single field: summary, role titles, descriptions, bullets, skills, degree names, certifications — everything.

RULES:
- The "summary" field is REQUIRED. If the CV has an explicit section (Profile, Summary, Objective, About Me, Profilo, Chi sono), use it verbatim. If NO such section exists, synthesize a 2-3 sentence professional profile based on: current role, years of experience, main sector, distinctive skills. Do not invent anything: use only information present in the CV.
- For experience, ALWAYS separate narrative text (description) from bullet points (bullets). If there are only bullets, leave description empty. If there is only narrative, leave bullets empty.
- For skills, categorize into 4 groups: technical (domain competencies), soft (transferable skills), tools (software and tools), languages (with CEFR level if indicated).
- For education:
  - degree: use the FULL qualification title exactly as written in the CV (e.g., "Qualification to practice as an Engineer", "Master of Science", "Laurea Magistrale"). Do NOT split or truncate multi-word degree titles.
  - field: use the specialization or discipline (e.g., "Civil Engineering", "Computer Science"). This is the subject area, separate from the degree title.
  - grade: extract the grade/score (e.g., "110/110", "3.8 GPA").
  - honors: extract distinctions (e.g., "cum laude", "with honours", "Dean's List").
  - program: If any education entry mentions an exchange program, Erasmus, Erasmus+, study abroad, double degree, or similar, ALWAYS populate this field with the full program name, host institution, and city/country if mentioned.
  - publication: thesis title or related publication if mentioned.
- ANY CV section that does NOT fit standard categories (experience, education, skills, certifications, projects) MUST be captured in extra_sections with the original section title and contents as an array of strings. Examples: Hobbies, Volunteering, Publications, Awards, Conferences, Portfolio, References, Interests, Extracurricular Activities, etc.
- has_photo: set to true if the CV visually contains a photo of the candidate.
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
                    has_photo: { type: "boolean" },
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
                          degree: { type: "string", description: "The FULL qualification title exactly as written (e.g., 'Qualification to practice as an Engineer', 'Master of Science'). Do NOT truncate." },
                          field: { type: "string", description: "The specialization or discipline (e.g., 'Civil Engineering', 'Computer Science'). Separate from degree title." },
                          start: { type: "string" },
                          end: { type: "string" },
                          grade: { type: "string", description: "Grade or score (e.g., '110/110', '3.8 GPA')" },
                          honors: { type: "string", description: "Distinctions such as 'cum laude', 'with honours', 'Dean\\'s List'" },
                          program: { type: "string", description: "Exchange or special program name (e.g., 'Erasmus', 'Erasmus+', 'Double Degree', 'Study Abroad'). Include the host institution and city if mentioned." },
                          publication: { type: "string", description: "Thesis title or related publication if mentioned" },
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
                          issuer: { type: "string", description: "The organization or institution that issued the certification (e.g., 'Google', 'AWS', 'PMI', 'Ordine degli Ingegneri'). Extract the EXACT issuer name as written in the CV." },
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
                      description: "Any CV section that doesn't fit standard categories (hobbies, volunteering, awards, publications, etc.)",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string", description: "Original section title from the CV" },
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

    let parsedCV: any;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      parsedCV =
        typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
    } else {
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

    // Remove has_photo from parsed data (it's metadata, not CV content)
    const hasPhoto = parsedCV.has_photo;
    delete parsedCV.has_photo;

    // Add photo_base64 placeholder if photo was extracted
    if (photoUrl) {
      parsedCV.photo_base64 = photoUrl; // We store the URL, not base64
    }

    return new Response(
      JSON.stringify({
        parsed_data: parsedCV,
        raw_text: "multimodal",
        has_photo: hasPhoto || false,
        photo_url: photoUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
