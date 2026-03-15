/**
 * Unified application types — single source of truth.
 * Import from "@/types/application" everywhere.
 */

/** Minimal fields for list views (Home, Candidature) */
export type AppRow = {
  id: string;
  company_name: string;
  role_title: string;
  match_score: number | null;
  status: string;
  created_at: string;
  notes: string | null;
};

/** AppRow enriched with ats_score and honest_score from tailored_cvs join */
export type AppRowWithAts = AppRow & {
  ats_score: number | null;
  honest_score: number | null;
};
