export { clean, ensureArray, h, MAX_SIDEBAR_SKILLS } from "./template-utils";

export const TEMPLATES = [
  { id: "visual", name: "Verso", free: true, atsSafe: false },
  { id: "classico", name: "Classico", free: true, atsSafe: false },
  { id: "minimal", name: "Minimal", free: true, atsSafe: false },
  { id: "executive", name: "Executive", free: false, atsSafe: true },
  { id: "moderno", name: "Moderno", free: false, atsSafe: false },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];
