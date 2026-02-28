export { ClassicoTemplate } from "./ClassicoTemplate";
export { MinimalTemplate } from "./MinimalTemplate";

export const TEMPLATES = [
  { id: "classico", name: "Classico", free: true },
  { id: "minimal", name: "Minimal", free: true },
  { id: "executive", name: "Executive", free: false },
  { id: "moderno", name: "Moderno", free: false },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];
