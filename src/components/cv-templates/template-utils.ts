export const NONE_VALUES = ["None", "none", "null", "N/A", "n/a", "undefined", "N/D", "n/d"];

export const clean = (val: unknown): string | null => {
  if (typeof val !== "string") return null;
  const trimmed = val.trim().replace(/^["']+|["']+$/g, "");
  if (!trimmed || NONE_VALUES.includes(trimmed)) return null;
  return trimmed;
};

export const ensureArray = (val: unknown): string[] => {
  if (Array.isArray(val)) return val.map(v => clean(String(v))).filter(Boolean) as string[];
  if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(s => s && !NONE_VALUES.includes(s));
  return [];
};

export const MAX_SIDEBAR_SKILLS = 20;

// ─── Adaptive density system ────────────────────────────────

export type DensityTier = "normal" | "compact" | "dense" | "ultra" | "extreme";

export interface DensityConfig {
  tier: DensityTier;
  bodyFontSize: number;
  bulletFontSize: number;
  sectionTitleFontSize: number;
  expRoleFontSize: number;
  summaryFontSize: number;
  sectionMarginTop: number;
  sectionMarginBottom: number;
  expBlockMarginBottom: number;
  eduBlockMarginBottom: number;
  bulletMarginBottom: number;
  lineHeight: number;
  maxBulletsOldEntries: number | null;
  /** For "extreme": max bullets for ALL entries */
  maxBulletsAllEntries: number | null;
  /** Max summary chars (null = no limit) */
  maxSummaryChars: number | null;
  /** Max experiences to show (null = no limit) */
  maxExperiences: number | null;
}

const NORMAL: DensityConfig = {
  tier: "normal",
  bodyFontSize: 10,
  bulletFontSize: 9.5,
  sectionTitleFontSize: 10,
  expRoleFontSize: 11,
  summaryFontSize: 10,
  sectionMarginTop: 18,
  sectionMarginBottom: 10,
  expBlockMarginBottom: 12,
  eduBlockMarginBottom: 10,
  bulletMarginBottom: 2.5,
  lineHeight: 1.6,
  maxBulletsOldEntries: null,
  maxBulletsAllEntries: null,
  maxSummaryChars: null,
  maxExperiences: null,
};

const COMPACT: DensityConfig = {
  ...NORMAL,
  tier: "compact",
  sectionMarginTop: 14,
  sectionMarginBottom: 8,
  expBlockMarginBottom: 8,
  eduBlockMarginBottom: 6,
  bulletMarginBottom: 2,
  lineHeight: 1.5,
};

const DENSE: DensityConfig = {
  ...COMPACT,
  tier: "dense",
  bodyFontSize: 9.5,
  bulletFontSize: 9,
  summaryFontSize: 9.5,
  lineHeight: 1.45,
};

const ULTRA: DensityConfig = {
  ...DENSE,
  tier: "ultra",
  sectionTitleFontSize: 9.5,
  expRoleFontSize: 10,
  sectionMarginTop: 10,
  sectionMarginBottom: 6,
  expBlockMarginBottom: 6,
  eduBlockMarginBottom: 4,
  maxBulletsOldEntries: 3,
  maxSummaryChars: 300,
};

const EXTREME: DensityConfig = {
  ...ULTRA,
  tier: "extreme",
  bodyFontSize: 9,
  bulletFontSize: 9,
  summaryFontSize: 9,
  sectionMarginTop: 8,
  sectionMarginBottom: 5,
  expBlockMarginBottom: 5,
  eduBlockMarginBottom: 3,
  bulletMarginBottom: 1.5,
  lineHeight: 1.35,
  maxBulletsOldEntries: 2,
  maxBulletsAllEntries: 3,
  maxSummaryChars: 200,
  maxExperiences: 5,
};

/**
 * Estimate content "weight" and return the appropriate density tier.
 * Uses chars/42 (realistic for main column width at 10pt).
 */
export function computeDensity(cv: Record<string, any>): DensityConfig {
  const experience = Array.isArray(cv.experience) ? cv.experience : [];
  const education = Array.isArray(cv.education) ? cv.education : [];
  const certifications = Array.isArray(cv.certifications) ? cv.certifications : [];
  const projects = Array.isArray(cv.projects) ? cv.projects : [];
  const extraSections = Array.isArray(cv.extra_sections) ? cv.extra_sections : [];
  const summary = typeof cv.summary === "string" ? cv.summary : "";
  const skills = cv.skills;

  const CPL = 42; // chars per line (realistic for main column)

  let lines = 0;

  // Summary
  lines += Math.ceil(summary.length / CPL) + 1;

  // Experiences
  for (const exp of experience) {
    lines += 3; // role + company + meta
    if (typeof exp.description === "string" && exp.description.trim()) {
      lines += Math.ceil(exp.description.length / CPL);
    }
    const bullets = Array.isArray(exp.bullets) ? exp.bullets : [];
    for (const b of bullets) {
      lines += Math.ceil((typeof b === "string" ? b.length : 0) / CPL);
    }
    lines += 1; // spacing
  }

  // Education
  lines += education.length * 3;

  // Certifications
  lines += certifications.length * 2;

  // Projects
  for (const proj of projects) {
    lines += 2;
    if (typeof proj.description === "string") {
      lines += Math.ceil(proj.description.length / CPL);
    }
  }

  // Extra sections
  for (const sec of extraSections) {
    lines += 2;
    lines += Array.isArray(sec.items) ? sec.items.length : 0;
  }

  // Sidebar content can also push pages — estimate sidebar lines
  let sidebarLines = 0;
  if (skills) {
    const techSkills = Array.isArray(skills) ? skills : [
      ...ensureArray(skills.technical),
      ...ensureArray(skills.soft),
      ...ensureArray(skills.tools),
    ];
    sidebarLines += Math.min(techSkills.length, MAX_SIDEBAR_SKILLS);
    const langs = Array.isArray(skills.languages) ? skills.languages : [];
    sidebarLines += langs.length * 2;
  }
  sidebarLines += certifications.length * 2;
  // Use the max of main vs sidebar
  lines = Math.max(lines, sidebarLines);

  if (lines <= 45) return NORMAL;
  if (lines <= 65) return COMPACT;
  if (lines <= 85) return DENSE;
  if (lines <= 110) return ULTRA;
  return EXTREME;
}

/**
 * Truncate bullets based on density config.
 */
export function truncateBullets(
  bullets: string[],
  expIndex: number,
  config: DensityConfig
): string[] {
  let max: number | null = null;

  if (config.maxBulletsAllEntries !== null) {
    max = expIndex < 2 ? config.maxBulletsAllEntries : (config.maxBulletsOldEntries ?? config.maxBulletsAllEntries);
  } else if (config.maxBulletsOldEntries !== null && expIndex >= 2) {
    max = config.maxBulletsOldEntries;
  }

  if (max === null || bullets.length <= max) return bullets;

  // Append "…" to last visible bullet instead of creating orphan line
  const truncated = bullets.slice(0, max);
  truncated[truncated.length - 1] = truncated[truncated.length - 1] + " …";
  return truncated;
}

/**
 * Truncate summary text if density config requires it.
 */
export function truncateSummary(summary: string | null, config: DensityConfig): string | null {
  if (!summary || config.maxSummaryChars === null) return summary;
  if (summary.length <= config.maxSummaryChars) return summary;
  return summary.slice(0, config.maxSummaryChars).replace(/\s+\S*$/, "") + "…";
}

/**
 * Limit experiences array based on density config.
 * Returns [limitedExperiences, omittedCount].
 */
export function limitExperiences<T>(experiences: T[], config: DensityConfig): [T[], number] {
  if (config.maxExperiences === null || experiences.length <= config.maxExperiences) {
    return [experiences, 0];
  }
  return [experiences.slice(0, config.maxExperiences), experiences.length - config.maxExperiences];
}

const HEADERS: Record<string, Record<string, string>> = {
  it: {
    contacts: "Contatti",
    skills: "Competenze",
    languages: "Lingue",
    certifications: "Certificazioni",
    profile: "Profilo",
    experience: "Esperienza",
    education: "Formazione",
    projects: "Progetti",
    publications: "Pubblicazioni",
    volunteering: "Volontariato",
    awards: "Premi e riconoscimenti",
    conferences: "Conferenze e presentazioni",
    present: "Attuale",
  },
  en: {
    contacts: "Contacts",
    skills: "Skills",
    languages: "Languages",
    certifications: "Certifications",
    profile: "Profile",
    experience: "Experience",
    education: "Education",
    projects: "Projects",
    publications: "Publications",
    volunteering: "Volunteering",
    awards: "Awards & Recognitions",
    conferences: "Conferences & Presentations",
    present: "Present",
  },
};

export function h(key: string, lang?: string): string {
  const l = (lang || "it").toLowerCase().slice(0, 2);
  return HEADERS[l]?.[key] || HEADERS.it[key] || key;
}

// ─── ATS-safe text normalization ────────────────────────────

const MONTH_MAP_IT: Record<string, string> = {
  "01":"Gen","02":"Feb","03":"Mar","04":"Apr","05":"Mag","06":"Giu",
  "07":"Lug","08":"Ago","09":"Set","10":"Ott","11":"Nov","12":"Dic",
};
const MONTH_MAP_EN: Record<string, string> = {
  "01":"Jan","02":"Feb","03":"Mar","04":"Apr","05":"May","06":"Jun",
  "07":"Jul","08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec",
};

const MONTH_WORDS: Record<string, string> = {
  gennaio:"01",january:"01",gen:"01",jan:"01",
  febbraio:"02",february:"02",feb:"02",
  marzo:"03",march:"03",mar:"03",
  aprile:"04",april:"04",apr:"04",
  maggio:"05",may:"05",mag:"05",
  giugno:"06",june:"06",giu:"06",jun:"06",
  luglio:"07",july:"07",lug:"07",jul:"07",
  agosto:"08",august:"08",ago:"08",aug:"08",
  settembre:"09",september:"09",set:"09",sep:"09",
  ottobre:"10",october:"10",ott:"10",oct:"10",
  novembre:"11",november:"11",nov:"11",
  dicembre:"12",december:"12",dic:"12",dec:"12",
};

/** Normalize a single date string to "Mmm YYYY" format */
function normalizeDate(d: string | null | undefined, lang: string): string {
  if (!d || typeof d !== "string") return "";
  const s = d.trim();
  if (!s) return "";

  const map = lang === "en" ? MONTH_MAP_EN : MONTH_MAP_IT;

  // ISO: 2021-03 or 2021-03-15
  const iso = s.match(/^(\d{4})-(\d{2})/);
  if (iso) {
    const abbr = map[iso[2]];
    return abbr ? abbr + " " + iso[1] : s;
  }

  // MM/YYYY or MM.YYYY
  const slashDot = s.match(/^(\d{2})[\/.](\d{4})$/);
  if (slashDot) {
    const abbr = map[slashDot[1]];
    return abbr ? abbr + " " + slashDot[2] : s;
  }

  // "Month YYYY" or "Mon YYYY"
  const wordMonth = s.match(/^([a-zA-Zàèéìòù]+)\s+(\d{4})$/);
  if (wordMonth) {
    const num = MONTH_WORDS[wordMonth[1].toLowerCase()];
    if (num) {
      const abbr = map[num];
      return abbr ? abbr + " " + wordMonth[2] : s;
    }
  }

  // Bare year
  if (/^\d{4}$/.test(s)) return s;

  return sanitizeText(s);
}

/** Replace non-ASCII chars with ATS-safe equivalents */
function sanitizeText(text: string): string {
  return text
    .replace(/\u2014/g, "-")   // em dash
    .replace(/\u2013/g, "-")   // en dash
    .replace(/[\u201C\u201D]/g, '"')  // smart double quotes
    .replace(/[\u2018\u2019]/g, "'"); // smart single quotes
}

/** Deep-clone and normalize all text in a CV for ATS compatibility */
export function normalizeCvText(cv: Record<string, any>, lang?: string): Record<string, any> {
  const l = (lang || "it").toLowerCase().slice(0, 2) === "en" ? "en" : "it";
  const out = JSON.parse(JSON.stringify(cv));

  // Sanitize all string values recursively
  function walkAndSanitize(obj: any): any {
    if (typeof obj === "string") return sanitizeText(obj);
    if (Array.isArray(obj)) return obj.map(walkAndSanitize);
    if (obj && typeof obj === "object") {
      for (const k of Object.keys(obj)) {
        obj[k] = walkAndSanitize(obj[k]);
      }
    }
    return obj;
  }
  walkAndSanitize(out);

  // Normalize dates in experience
  if (Array.isArray(out.experience)) {
    for (const exp of out.experience) {
      if (exp.start) exp.start = normalizeDate(exp.start, l);
      if (exp.end) exp.end = normalizeDate(exp.end, l);
    }
  }

  // Normalize dates in education
  if (Array.isArray(out.education)) {
    for (const ed of out.education) {
      if (ed.start) ed.start = normalizeDate(ed.start, l);
      if (ed.end) ed.end = normalizeDate(ed.end, l);
    }
  }

  // Normalize dates in certifications
  if (Array.isArray(out.certifications)) {
    for (const cert of out.certifications) {
      if (cert.year) cert.year = normalizeDate(cert.year, l);
    }
  }

  return out;
}
