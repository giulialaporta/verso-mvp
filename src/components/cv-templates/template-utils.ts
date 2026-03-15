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
  // Extreme: cap ALL entries
  if (config.maxBulletsAllEntries !== null) {
    const max = expIndex < 2 ? config.maxBulletsAllEntries : (config.maxBulletsOldEntries ?? config.maxBulletsAllEntries);
    if (bullets.length <= max) return bullets;
    return [...bullets.slice(0, max), "…"];
  }
  // Ultra: cap only old entries
  if (config.maxBulletsOldEntries === null || expIndex < 2) return bullets;
  const max = config.maxBulletsOldEntries;
  if (bullets.length <= max) return bullets;
  return [...bullets.slice(0, max), "…"];
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
