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
// Estimates content volume and returns style adjustments to fit max 2 pages.

export type DensityTier = "normal" | "compact" | "dense" | "ultra";

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
  /** For "ultra" tier: max bullets per experience for older entries (index >= 2) */
  maxBulletsOldEntries: number | null;
}

// Base values (short CV — fits easily in 1-2 pages)
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
};

// Step 1: reduce margins
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

// Step 2: reduce body font sizes (never below 9)
const DENSE: DensityConfig = {
  ...COMPACT,
  tier: "dense",
  bodyFontSize: 9.5,
  bulletFontSize: 9,
  summaryFontSize: 9.5,
  lineHeight: 1.45,
};

// Step 3: reduce section titles + truncate old bullets
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
};

/**
 * Estimate content "weight" and return the appropriate density tier.
 * Uses a simple heuristic: count total text lines the CV will produce.
 */
export function computeDensity(cv: Record<string, any>): DensityConfig {
  const experience = Array.isArray(cv.experience) ? cv.experience : [];
  const education = Array.isArray(cv.education) ? cv.education : [];
  const certifications = Array.isArray(cv.certifications) ? cv.certifications : [];
  const projects = Array.isArray(cv.projects) ? cv.projects : [];
  const extraSections = Array.isArray(cv.extra_sections) ? cv.extra_sections : [];
  const summary = typeof cv.summary === "string" ? cv.summary : "";

  // Estimate line count (rough: 1 line ≈ 60 chars at font 10 in main column)
  let lines = 0;

  // Summary
  lines += Math.ceil(summary.length / 55) + 1;

  // Experiences
  for (const exp of experience) {
    lines += 3; // role + company + meta
    if (typeof exp.description === "string" && exp.description.trim()) {
      lines += Math.ceil(exp.description.length / 55);
    }
    const bullets = Array.isArray(exp.bullets) ? exp.bullets : [];
    for (const b of bullets) {
      lines += Math.ceil((typeof b === "string" ? b.length : 0) / 55);
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
      lines += Math.ceil(proj.description.length / 55);
    }
  }

  // Extra sections
  for (const sec of extraSections) {
    lines += 2;
    lines += Array.isArray(sec.items) ? sec.items.length : 0;
  }

  // A4 main column at font 10 ≈ 55-60 lines per page
  // 2 pages ≈ 110-120 lines
  if (lines <= 55) return NORMAL;
  if (lines <= 75) return COMPACT;
  if (lines <= 100) return DENSE;
  return ULTRA;
}

/**
 * Truncate bullets for older experiences when in ultra density.
 * Returns filtered bullets array, adding "…" if truncated.
 */
export function truncateBullets(
  bullets: string[],
  expIndex: number,
  config: DensityConfig
): string[] {
  if (config.maxBulletsOldEntries === null || expIndex < 2) return bullets;
  const max = config.maxBulletsOldEntries;
  if (bullets.length <= max) return bullets;
  return [...bullets.slice(0, max), "…"];
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
  },
};

export function h(key: string, lang?: string): string {
  const l = (lang || "it").toLowerCase().slice(0, 2);
  return HEADERS[l]?.[key] || HEADERS.it[key] || key;
}
