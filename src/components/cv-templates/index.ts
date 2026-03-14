export { ClassicoTemplate } from "./ClassicoTemplate";
export { MinimalTemplate } from "./MinimalTemplate";
export { ExecutiveTemplate } from "./ExecutiveTemplate";
export { ModernoTemplate } from "./ModernoTemplate";
export { clean, ensureArray, h, MAX_SIDEBAR_SKILLS } from "./template-utils";

export const TEMPLATES = [
  { id: "classico", name: "Classico", free: true },
  { id: "minimal", name: "Minimal", free: true },
  { id: "executive", name: "Executive", free: true },
  { id: "moderno", name: "Moderno", free: true },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];
