export { clean, ensureArray, h, MAX_SIDEBAR_SKILLS } from "./template-utils";

export const TEMPLATES = [
  { id: "classico", name: "Verso", free: true, atsSafe: true },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];
