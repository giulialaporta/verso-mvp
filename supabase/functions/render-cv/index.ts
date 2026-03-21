import { getCorsHeaders } from "../_shared/cors.ts";
import { TEMPLATES } from "./templates.ts";

function loadTemplate(templateId: string): string {
  const html = TEMPLATES[templateId];
  if (!html) throw new Error("Unknown template: " + templateId);
  return html;
}

// --- Localized headers ---
function normalizeLang(lang: string | undefined | null): string {
  if (!lang) return "it";
  const l = lang.toLowerCase();
  if (l.startsWith("en")) return "en";
  return "it";
}

function getHeaders(lang: string): Record<string, string> {
  const norm = normalizeLang(lang);
  if (norm === "en") {
    return { contact: "Contact", skills: "Skills", languages: "Languages", certifications: "Certifications", profile: "Profile", experience: "Experience", education: "Education", projects: "Projects" };
  }
  return { contact: "Contatti", skills: "Competenze", languages: "Lingue", certifications: "Certificazioni", profile: "Profilo", experience: "Esperienza", education: "Formazione", projects: "Progetti" };
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

interface PreparedData {
  lang: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  photoUrl: string;
  initials: string;
  headline: string;
  summary: string;
  experience: { role: string; company: string; start: string; end: string; location: string; description: string; bullets: string[] }[];
  education: { degree: string; field: string; institution: string; period: string; grade: string; honors: string }[];
  skills: string[];
  languages: { language: string; level: string }[];
  certifications: { name: string; issuer?: string; year?: string }[];
  projects: { name: string; description?: string }[];
  extraSections: { title: string; items: string[] }[];
  kpis: string[];
  headers: Record<string, string>;
}

function extractKpis(cv: Record<string, any>): string[] {
  const kpis: string[] = [];
  const regex = /(\d[\d.,]*[+]?\s*(%|[KMB]\b|anni|years|utenti|users|clienti|EUR|euro|\u20AC))/gi;
  for (const exp of (cv.experience || [])) {
    for (const b of (exp.bullets || [])) {
      const matches = String(b).match(regex);
      if (matches) {
        for (const m of matches) {
          if (kpis.length < 6 && !kpis.includes(m.trim())) kpis.push(m.trim());
        }
      }
    }
  }
  return kpis;
}

function getInitials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function prepareData(cv: Record<string, any>, lang: string): PreparedData {
  const personal = cv.personal || {};
  const nameStr = clean(personal.name) || "Nome Cognome";
  const photoUrl = clean(cv.photo_url) || clean(cv.photo_base64) || clean(personal.photo_url) || clean(personal.photo_base64);
  return {
    lang: lang || "it",
    name: nameStr,
    email: clean(personal.email),
    phone: clean(personal.phone),
    location: clean(personal.location),
    linkedin: clean(personal.linkedin),
    website: clean(personal.website),
    photoUrl: photoUrl,
    initials: photoUrl ? "" : getInitials(nameStr),
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
      period: [ed.start, ed.end].filter(Boolean).join(" \u2013 "),
      grade: clean(ed.grade),
      honors: clean(ed.honors),
    })),
    skills: mergeSkills(cv.skills),
    languages: cv.skills?.languages || [],
    certifications: (cv.certifications || []).filter((c: any) => clean(c.name)),
    projects: (cv.projects || []).filter((p: any) => clean(p.name)),
    extraSections: (cv.extra_sections || []).filter((s: any) => s.title && s.items?.length),
    kpis: extractKpis(cv),
    headers: getHeaders(lang),
  };
}

// --- Mini template engine ---
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

// Find the matching closing tag for a block, handling nesting
function findMatchingClose(html: string, tag: string, startPos: number): number {
  var depth = 1;
  var pos = startPos;
  var openTag = "{{#" + tag + " ";
  var closeTag = "{{/" + tag + "}}";
  while (depth > 0 && pos < html.length) {
    var nextOpen = html.indexOf(openTag, pos);
    var nextClose = html.indexOf(closeTag, pos);
    if (nextClose === -1) return -1;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + openTag.length;
    } else {
      depth--;
      if (depth === 0) return nextClose;
      pos = nextClose + closeTag.length;
    }
  }
  return -1;
}

function processBlock(html: string, tag: string, handler: (key: string, body: string) => string): string {
  var safety = 0;
  var openPrefix = "{{#" + tag + " ";
  while (html.indexOf(openPrefix) !== -1 && safety < 50) {
    safety++;
    var openStart = html.indexOf(openPrefix);
    var openEnd = html.indexOf("}}", openStart);
    if (openEnd === -1) break;
    var key = html.substring(openStart + openPrefix.length, openEnd);
    var bodyStart = openEnd + 2;
    var closePos = findMatchingClose(html, tag, bodyStart);
    if (closePos === -1) break;
    var body = html.substring(bodyStart, closePos);
    var closeTag = "{{/" + tag + "}}";
    var replacement = handler(key, body);
    html = html.substring(0, openStart) + replacement + html.substring(closePos + closeTag.length);
  }
  return html;
}

function compileTemplate(template: string, data: Record<string, any>): string {
  var html = template;

  // Process {{#each array}}...{{/each}} with proper nesting
  html = processBlock(html, "each", function(key, body) {
    var arr = resolveValue(data, key);
    if (!Array.isArray(arr) || arr.length === 0) return "";
    return arr.map(function(item: any) {
      var ctx = typeof item === "object"
        ? Object.assign({}, data, item, {"this": item, ".": item})
        : Object.assign({}, data, {"this": String(item), ".": item});
      return compileTemplate(body, ctx);
    }).join("");
  });

  // Process {{#if value}}...{{/if}} with proper nesting
  html = processBlock(html, "if", function(key, body) {
    var val = resolveValue(data, key);
    var truthy = Array.isArray(val) ? val.length > 0 : Boolean(val);
    return truthy ? compileTemplate(body, data) : "";
  });

  // Replace {{variable}}
  html = html.replace(/\{\{([\w.]+)\}\}/g, function(_match, key) {
    var val = resolveValue(data, key);
    if (val === undefined || val === null) return "";
    return escapeHtml(String(val));
  });

  return html;
}

// --- Fit-to-2-pages ---
interface FitConfig {
  bodySize: number;
  lineHeight: number;
  sectionMargin: number;
  expMargin: number;
  maxBullets: number;
}

function estimateHeight(data: PreparedData, config: FitConfig, templateId: string): number {
  const pageWidth = 210 - 24;
  let mainWidth: number;
  if (templateId === "executive") mainWidth = pageWidth;
  else if (templateId === "moderno") mainWidth = pageWidth * 0.65;
  else if (templateId === "minimal") mainWidth = pageWidth * 0.74;
  else mainWidth = pageWidth * 0.72;

  const charWidth = config.bodySize * 0.22;
  const charsPerLine = Math.floor(mainWidth / charWidth);
  const lineH = config.bodySize * config.lineHeight * 0.35;

  let height = 14;

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

function fitTo2Pages(data: PreparedData, templateId: string): FitConfig {
  const maxHeight = (297 - 30) * 2;
  const config: FitConfig = { bodySize: 10, lineHeight: 1.5, sectionMargin: 16, expMargin: 12, maxBullets: 99 };

  let iterations = 0;
  while (estimateHeight(data, config, templateId) > maxHeight && iterations < 20) {
    iterations++;
    if (config.bodySize > 8) { config.bodySize -= 0.5; config.lineHeight = Math.max(1.3, config.lineHeight - 0.03); continue; }
    if (config.sectionMargin > 8) { config.sectionMargin -= 2; config.expMargin = Math.max(6, config.expMargin - 2); continue; }
    if (config.maxBullets > 3) { config.maxBullets = config.maxBullets > 4 ? 4 : 3; continue; }
    break;
  }
  return config;
}

// --- Main ---
Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const cv = body.cv;
    const templateId = body.template_id || "classico";
    const format = body.format || "html";
    const lang = body.lang || "it";

    if (!cv) {
      return new Response(JSON.stringify({ error: "Missing cv" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const validTemplates = ["classico", "minimal", "executive", "moderno", "visual"];
    if (!validTemplates.includes(templateId)) {
      return new Response(JSON.stringify({ error: "Unknown template: " + templateId }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const templateHtml = loadTemplate(templateId);
    const data = prepareData(cv, lang);
    const fitConfig = fitTo2Pages(data, templateId);

    // Trim bullets if needed
    if (fitConfig.maxBullets < 99) {
      for (const exp of data.experience) {
        if (exp.bullets.length > fitConfig.maxBullets) {
          exp.bullets = exp.bullets.slice(0, fitConfig.maxBullets);
        }
      }
    }

    let compiled = compileTemplate(templateHtml, data as any);

    // Inject CSS overrides
    const cssOverride = "<style>:root{" +
      "--body-size:" + fitConfig.bodySize + "pt;" +
      "--line-height:" + fitConfig.lineHeight + ";" +
      "--section-margin-top:" + fitConfig.sectionMargin + "px;" +
      "--exp-margin-bottom:" + fitConfig.expMargin + "px;" +
      "}</style>";
    compiled = compiled.replace("</head>", cssOverride + "</head>");

    return new Response(compiled, {
      headers: { ...cors, "Content-Type": "text/html; charset=utf-8" },
    });

  } catch (e) {
    console.error("[render-cv] Error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
