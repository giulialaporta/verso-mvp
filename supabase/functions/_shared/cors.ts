/**
 * Shared CORS utility — dynamic origin whitelist.
 * US-S01: replaces Access-Control-Allow-Origin: * across all edge functions.
 */

const ALLOWED_ORIGINS = [
  "https://verso-cv.lovable.app",       // produzione (published)
  "https://id-preview--79973808-7997-4009-a8ef-6fba6ac3604e.lovable.app", // preview legacy
  "https://79973808-7997-4009-a8ef-6fba6ac3604e.lovableproject.com",      // preview attuale
  "http://localhost:5173",               // sviluppo locale
  "http://localhost:8080",               // sviluppo locale alternativo
];

const CORS_HEADERS_BASE = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Build CORS headers with dynamic origin check.
 * If origin is not in whitelist, falls back to the first allowed origin
 * (browser will block the response due to mismatch).
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    ...CORS_HEADERS_BASE,
  };
}
