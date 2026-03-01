/**
 * Shared utility: non-blocking output validation for edge function responses.
 * Logs warnings but never throws. Applies safe defaults for missing fields.
 */

type ValidationRule = {
  field: string;
  type: "number" | "string" | "array" | "object" | "boolean";
  required?: boolean;
  min?: number;
  max?: number;
  defaultValue?: unknown;
};

const RULES: Record<string, ValidationRule[]> = {
  "parse-cv": [
    { field: "personal", type: "object", required: true, defaultValue: {} },
    { field: "summary", type: "string", required: true, defaultValue: "" },
    { field: "experience", type: "array", required: false, defaultValue: [] },
    { field: "education", type: "array", required: false, defaultValue: [] },
    { field: "skills", type: "object", required: false, defaultValue: {} },
  ],
  "scrape-job": [
    { field: "company_name", type: "string", required: true, defaultValue: "" },
    { field: "role_title", type: "string", required: true, defaultValue: "" },
    { field: "description", type: "string", required: true, defaultValue: "" },
    { field: "required_skills", type: "array", required: true, defaultValue: [] },
  ],
  "ai-tailor-analyze": [
    { field: "match_score", type: "number", required: true, min: 0, max: 100, defaultValue: 0 },
    { field: "ats_score", type: "number", required: true, min: 0, max: 100, defaultValue: 0 },
    { field: "skills_present", type: "array", required: true, defaultValue: [] },
    { field: "skills_missing", type: "array", required: true, defaultValue: [] },
    { field: "seniority_match", type: "object", required: true, defaultValue: { candidate_level: "mid", role_level: "mid", match: true, note: "Non disponibile" } },
    { field: "ats_checks", type: "array", required: true, defaultValue: [] },
    { field: "detected_language", type: "string", required: true, defaultValue: "it" },
    { field: "score_note", type: "string", required: false, defaultValue: "" },
  ],
  "ai-tailor-tailor": [
    { field: "tailored_patches", type: "array", required: true, defaultValue: [] },
    { field: "honest_score", type: "object", required: true, defaultValue: { confidence: 100, experiences_added: 0, skills_invented: 0, dates_modified: 0, bullets_repositioned: 0, bullets_rewritten: 0, sections_removed: 0, flags: [] } },
    { field: "diff", type: "array", required: true, defaultValue: [] },
    { field: "structural_changes", type: "array", required: true, defaultValue: [] },
  ],
  "ai-prescreen": [
    { field: "requirements_analysis", type: "array", required: true, defaultValue: [] },
    { field: "dealbreakers", type: "array", required: true, defaultValue: [] },
    { field: "follow_up_questions", type: "array", required: true, defaultValue: [] },
    { field: "overall_feasibility", type: "string", required: true, defaultValue: "medium" },
    { field: "feasibility_note", type: "string", required: true, defaultValue: "" },
  ],
};

function checkType(value: unknown, expectedType: string): boolean {
  if (expectedType === "array") return Array.isArray(value);
  return typeof value === expectedType;
}

/**
 * Validate AI output for a specific function.
 * Mutates the result in-place (applies defaults for missing fields).
 * Returns array of warning messages (empty = all good).
 */
export function validateOutput(
  functionName: string,
  result: Record<string, unknown>
): string[] {
  const rules = RULES[functionName];
  if (!rules) {
    console.warn(`validateOutput: no rules defined for "${functionName}"`);
    return [];
  }

  const warnings: string[] = [];

  for (const rule of rules) {
    const value = result[rule.field];

    // Missing field
    if (value === undefined || value === null) {
      if (rule.required) {
        warnings.push(`Missing required field: ${rule.field}`);
        result[rule.field] = rule.defaultValue;
      }
      continue;
    }

    // Wrong type
    if (!checkType(value, rule.type)) {
      warnings.push(`Wrong type for ${rule.field}: expected ${rule.type}, got ${typeof value}`);
      result[rule.field] = rule.defaultValue;
      continue;
    }

    // Range check for numbers
    if (rule.type === "number") {
      const num = value as number;
      if (rule.min !== undefined && num < rule.min) {
        warnings.push(`${rule.field} below min (${num} < ${rule.min})`);
        result[rule.field] = rule.min;
      }
      if (rule.max !== undefined && num > rule.max) {
        warnings.push(`${rule.field} above max (${num} > ${rule.max})`);
        result[rule.field] = rule.max;
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(`[${functionName}] Validation warnings:`, warnings);
  }

  return warnings;
}
