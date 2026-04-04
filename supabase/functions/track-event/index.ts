import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// Allowlist of accepted event names
const ALLOWED_EVENTS = new Set([
  "signup_completed",
  "onboarding_completed",
  "wizard_step",
  "wizard_completed",
  "application_created",
  "application_status_changed",
  "cv_uploaded",
  "cv_parsed",
  "cv_tailored",
  "cv_exported",
  "pdf_downloaded",
  "template_selected",
  "prescreen_completed",
  "upgrade_started",
  "upgrade_completed",
  "page_view",
  "consent_granted",
  "consent_revoked",
]);

const MAX_PAYLOAD_BYTES = 4096; // 4 KB

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabase.auth.getUser(token);
    const userId = data?.user?.id ?? null;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();

    // Enforce payload size limit
    if (new TextEncoder().encode(rawBody).length > MAX_PAYLOAD_BYTES) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { event_name, event_data } = JSON.parse(rawBody);

    if (!event_name || typeof event_name !== "string") {
      return new Response(JSON.stringify({ error: "event_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate event name against allowlist
    if (!ALLOWED_EVENTS.has(event_name)) {
      return new Response(JSON.stringify({ error: "Unknown event_name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("user_events").insert({
      user_id: userId,
      event_name,
      event_data: event_data || {},
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[TRACK-EVENT]", err);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, // Always 200 — fire-and-forget
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});