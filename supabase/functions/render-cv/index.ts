import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Template files (embedded at deploy time) ---
import classicoHtml from "./templates/classico.html" with { type: "text" };
import minimalHtml from "./templates/minimal.html" with { type: "text" };
import executiveHtml from "./templates/executive.html" with { type: "text" };
import modernoHtml from "./templates/moderno.html" with { type: "text" };

const TEMPLATES: Record<string, string> = {
  classico: classicoHtml,
  minimal: minimalHtml,
  executive: executiveHtml,
  moderno: modernoHtml,
};

// --- Localized headers ---
function getHeaders(lang: string): Record<string, string> {
  if (lang === "en") {
    return {
      contact: "Contact",
      skills: "Skills",
      languages: "Languages",
      certifications: "Certifications",
      profile: "Profile",
      experience: "Experience",
      education: "Education",
      projects: "Projects",
    };
  }
  return {
    contact: "Contatti",
    skills: "Competenze",
    languages: "Lingue",
    certifications: "Certificazioni",
    profile: "Profilo",
    experience: "Esperienza",
    education: "Formazione",
    projects: "Progetti",
  };
}

// --- Data preparation ---
function clean(v: unknown): string {
  if (typeof v === "string") return v.trim();
  return "";
}

function mergeSkills(skills: Record<string, unknown> | undefined): string[] {
  if (!skills || typeof skills !== "object") return [];
  const result: string[] = [];
  for (const key of ["technical", "soft", "tools"]) {
    const arr = (skills as any)[key];
    if (Array.isArray(arr)) {
      for (const s of arr) {
        const label = typeof s === "string" ? s : s?.label || s?.name || "";
        if (label && !result.includes(label)) result.push(label);
      }
    }
  }
  return result;
}

function prepareData(cv: Record<string, any>, lang: string) {
  const personal = cv.personal || {};
  const skills = mergeSkills(cv.skills);
  const languages = cv.skills?.languages || [];

  return {
    lang: lang || "it",
    name: clean(personal.name) || "Nome Cognome",
    email: clean(personal.email),
    phone: clean(personal.phone),
    location: clean(personal.location),
    linkedin: clean(personal.linkedin),
    website: clean(personal.website),
    photoUrl: clean(cv.photo_url) || clean(cv.photo_base64) || clean(personal.photo_url) || clean(personal.photo_base64),
    headline: clean(personal.headline),
    summary: clean(cv.summary),
    experience: (cv.experience || []).map((exp: any) => ({
      role: clean(exp.role) || clean(exp.title),
      company: exp.company || "",
      start: exp.start || "",
      end: exp.end || (exp.current ? (lang === "it" ? "Attuale" : "Present") : ""),
      location: clean(exp.location),
      description: clean(exp.description),
      bullets: (exp.bullets || []).filter((b: any) => clean(b)),
    })),
    education: (cv.education || []).map((ed: any) => ({
      degree: ed.degree || "",
      field: clean(ed.field),
      institution: ed.institution || "",
      period: [ed.start, ed.end].filter(Boolean).join(" – "),
      grade: clean(ed.grade),
      honors: clean(ed.honors),
    })),
    skills,
    languages,
    certifications: (cv.certifications || []).filter((c: any) => clean(c.name)),
    projects: (cv.projects || []).filter((p: any) => clean(p.name)),
    extraSections: (cv.extra_sections || []).filter((s: any) => s.title && s.items?.length),
    headers: getHeaders(lang),
  };
}

// --- Mini template engine (Handlebars-like) ---
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function compileTemplate(template: string, data: Record<string, any>): string {
  let html = template;

  // Process {{#each array}}...{{/each}} blocks (supports nesting)
  let safety = 0;
  while (html.includes("{{#each ") && safety < 50) {
    safety++;
    html = html.replace(
      /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/,
      (_match, key, body) => {
        const arr = resolveValue(data, key);
        if (!Array.isArray(arr) || arr.length === 0) return "";
        return arr.map((item: any) => {
          const ctx = typeof item === "object" ? { ...data, ...item, ".": item } : { ...data, ".": item };
          // Replace {{this}} and {{this.prop}}
          let result = body.replace(/\{\{this\}\}/g, escapeHtml(String(item)));
          result = result.replace(/\{\{this\.([\w]+)\}\}/g, (_: string, prop: string) => {
            return escapeHtml(String(item?.[prop] ?? ""));
          });
          // Recurse for nested each/if
          return compileTemplate(result, ctx);
        }).join("");
      }
    );
  }

  // Process {{#if value}}...{{/if}} blocks
  safety = 0;
  while (html.includes("{{#if ") && safety < 50) {
    safety++;
    html = html.replace(
      /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/,
      (_match, key, body) => {
        const val = resolveValue(data, key);
        const truthy = Array.isArray(val) ? val.length > 0 : Boolean(val);
        return truthy ? body : "";
      }
    );
  }

  // Replace {{variable}} with escaped values
  html = html.replace(/\{\{([\w.]+)\}\}/g, (_match, key) => {
    const val = resolveValue(data, key);
    return escapeHtml(String(val ?? ""));
  });

  return html;
}

function resolveValue(data: Record<string, any>, path: string): any {
  const parts = path.split(".");
  let current: any = data;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

// --- Fit-to-2-pages algorithm ---
interface FitConfig {
  bodySize: number;
  lineHeight: number;
  sectionMargin: number;
  expMargin: number;
  maxBullets: number;
}

function estimateHeight(data: ReturnType<typeof prepareData>, config: FitConfig, templateId: string): number {
  const pageWidth = 210 - 24; // A4 width - margins
  const mainWidth = templateId === "executive"
    ? pageWidth
    : templateId === "moderno"
      ? pageWidth * 0.65
      : templateId === "minimal"
        ? pageWidth * 0.74
        : pageWidth * 0.72;

  const charWidth = config.bodySize * 0.22;
  const charsPerLine = Math.floor(mainWidth / charWidth);
  const lineH = config.bodySize * config.lineHeight * 0.35;

  let height = 0;
  height += 14; // name + headline

  if (data.summary) {
    height += config.sectionMargin * 0.35 + 6;
    height += Math.ceil(data.summary.length / charsPerLine) * lineH;
  }

  if (data.experience.length > 0) {
    height += config.sectionMargin * 0.35 + 6;
    for (const exp of data.experience) {
      height += 3 * lineH;
      if (exp.description) {
        height += Math.ceil(exp.description.length / charsPerLine) * lineH;
      }
      const bullets = exp.bullets.slice(0, config.maxBullets);
      for (const b of bullets) {
        height += Math.ceil(String(b).length / charsPerLine) * lineH;
      }
      height += config.expMargin * 0.35;
    }
  }

  height += data.education.length * 3.5 * lineH;
  height += data.certifications.length * 2 * lineH;
  for (const proj of data.projects) {
    height += 2 * lineH;
    if (proj.description) height += Math.ceil(proj.description.length / charsPerLine) * lineH;
  }
  for (const extra of data.extraSections) {
    height += 6 + (extra.items?.length || 0) * lineH;
  }

  return height;
}

function fitTo2Pages(data: ReturnType<typeof prepareData>, templateId: string): FitConfig {
  const maxHeight = (297 - 30) * 2; // 2 A4 pages minus margins

  const config: FitConfig = {
    bodySize: 10,
    lineHeight: 1.5,
    sectionMargin: 16,
    expMargin: 12,
    maxBullets: 99,
  };

  let iterations = 0;
  while (estimateHeight(data, config, templateId) > maxHeight && iterations < 20) {
    iterations++;
    if (config.bodySize > 8) {
      config.bodySize -= 0.5;
      config.lineHeight = Math.max(1.3, config.lineHeight - 0.03);
      continue;
    }
    if (config.sectionMargin > 8) {
      config.sectionMargin -= 2;
      config.expMargin = Math.max(6, config.expMargin - 2);
      continue;
    }
    if (config.maxBullets > 3) {
      config.maxBullets = config.maxBullets > 4 ? 4 : 3;
      continue;
    }
    break;
  }

  return config;
}

// --- Main handler ---
Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { cv, template_id, format, lang } = await req.json();

    if (!cv || !template_id) {
      return new Response(JSON.stringify({ error: "Missing cv or template_id" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const templateHtml = TEMPLATES[template_id];
    if (!templateHtml) {
      return new Response(JSON.stringify({ error: "Unknown template: " + template_id }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const targetLang = lang || "it";
    const data = prepareData(cv, targetLang);

    // Fit-to-2-pages
    const fitConfig = fitTo2Pages(data, template_id);

    // Trim bullets if maxBullets was reduced
    if (fitConfig.maxBullets < 99) {
      for (const exp of data.experience) {
        if (exp.bullets.length > fitConfig.maxBullets) {
          exp.bullets = exp.bullets.slice(0, fitConfig.maxBullets);
        }
      }
    }

    // Compile template
    let compiled = compileTemplate(templateHtml, data);

    // Inject CSS overrides for fit-to-2-pages
    const cssOverride = "<style>:root{" +
      "--body-size:" + fitConfig.bodySize + "pt;" +
      "--line-height:" + fitConfig.lineHeight + ";" +
      "--section-margin-top:" + fitConfig.sectionMargin + "px;" +
      "--exp-margin-bottom:" + fitConfig.expMargin + "px;" +
      "}</style>";
    compiled = compiled.replace("</head>", cssOverride + "</head>");

    if (format === "html" || !format) {
      return new Response(compiled, {
        headers: { ...cors, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // format === "pdf" — for now return HTML with a note; PDF rendering requires external service
    // TODO: integrate PDFShift or similar when API key is available
    return new Response(compiled, {
      headers: { ...cors, "Content-Type": "text/html; charset=utf-8" },
    });

  } catch (e) {
    console.error("[render-cv] Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
