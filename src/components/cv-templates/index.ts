export { clean, ensureArray, h, MAX_SIDEBAR_SKILLS } from "./template-utils";

export const TEMPLATES = [
  { id: "visual", name: "Verso", free: true },
  { id: "classico", name: "Classico", free: true },
  { id: "minimal", name: "Minimal", free: true },
  { id: "executive", name: "Executive", free: false },
  { id: "moderno", name: "Moderno", free: false },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];
