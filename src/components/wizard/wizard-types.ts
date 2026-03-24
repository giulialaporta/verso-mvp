import type { SalaryAnalysis } from "@/components/SalaryAnalysisCard";

export type JobData = {
  company_name: string;
  role_title: string;
  location?: string;
  job_type?: string;
  description: string;
  key_requirements: string[];
  required_skills: string[];
  nice_to_have?: string[];
  is_staffing_agency?: boolean;
  end_client?: string;
};

export type PrescreenResult = {
  detected_language: string;
  requirements_analysis: {
    requirement: string;
    priority: "mandatory" | "preferred" | "nice_to_have";
    candidate_has: boolean;
    gap_type: "none" | "bridgeable" | "unbridgeable";
    explanation: string;
  }[];
  dealbreakers: {
    requirement: string;
    severity: "critical" | "significant";
    message: string;
  }[];
  follow_up_questions: {
    id: string;
    question: string;
    context: string;
    field: string;
    options?: { value: string; label: string }[];
  }[];
  overall_feasibility: "low" | "medium" | "high";
  feasibility_note: string;
  salary_analysis?: SalaryAnalysis;
};

export type LearningSuggestion = {
  skill: string;
  resource_name: string;
  url: string;
  type: "course" | "certification" | "tutorial";
  duration?: string;
};

export type StructuralChange = {
  action: "removed" | "reordered" | "condensed";
  section: string;
  item: string;
  reason: string;
};

export type AnalyzeResult = {
  match_score: number;
  score_note?: string;
  ats_score: number;
  skills_present: { label: string; has: boolean }[];
  skills_missing: { label: string; importance: string }[];
  seniority_match: {
    candidate_level: string;
    role_level: string;
    match: boolean;
    note: string;
  };
  ats_checks: {
    check: string;
    label: string;
    status: "pass" | "warning" | "fail";
    detail?: string;
  }[];
  suggestions?: { type: string; message: string }[];
  learning_suggestions?: LearningSuggestion[];
  detected_language: string;
  master_cv_id: string;
};

export type TailorResult = {
  tailored_cv: Record<string, unknown>;
  tailored_patches?: Array<{ path: string; value: unknown }>;
  original_cv?: Record<string, unknown>;
  structural_changes?: StructuralChange[];
  honest_score: {
    confidence: number;
    experiences_added: number;
    skills_invented: number;
    dates_modified: number;
    bullets_repositioned: number;
    bullets_rewritten: number;
    sections_removed: number;
    flags: string[];
  };
  diff: {
    section: string;
    index?: number;
    original: string;
    suggested: string;
    reason: string;
    patch_path?: string;
  }[];
  master_cv_id: string;
};
