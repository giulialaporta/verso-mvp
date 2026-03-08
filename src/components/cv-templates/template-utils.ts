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
