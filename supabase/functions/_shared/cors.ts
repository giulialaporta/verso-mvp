/**
 * Shared CORS utility — dynamic origin whitelist.
 * Supports custom domains, Lovable preview/publish domains, and localhost.
 */

const ALLOWED_ORIGINS = [
  "https://verso-cv.lovable.app",
  "https://versocv.com",
  "https://www.versocv.com",
  "https://versocv.it",
  "https://www.versocv.it",
  "http://localhost:5173",
  "http://localhost:8080",
];

const ALLOWED_PATTERNS = [
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const hostname = new URL(origin).hostname;
    return ALLOWED_PATTERNS.some((p) => p.test(hostname));
  } catch {
    return false;
  }
}

const CORS_HEADERS_BASE = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowed = isAllowedOrigin(origin);

  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
    "Vary": "Origin",
    ...CORS_HEADERS_BASE,
  };
}
