import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const ANON_UUID = "00000000-0000-0000-0000-000000000000";

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.toLowerCase().trim());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user with anon client
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const userEmail = user.email ?? "";
    const emailHash = await sha256(userEmail);

    // Service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 0. Stamp user_hash on ALL existing consent_logs for this user (before anonymizing)
    await supabaseAdmin
      .from("consent_logs")
      .update({ user_hash: emailHash })
      .eq("user_id", userId);

    // 1. Audit trail — log deletion request BEFORE wiping data
    await supabaseAdmin.from("consent_logs").insert({
      user_id: userId,
      user_hash: emailHash,
      consent_type: "account_deletion",
      consent_version: "1.0",
      granted: true,
      method: "settings_page",
      metadata: {
        requested_at: new Date().toISOString(),
        email_hash: emailHash,
        email: userEmail, // Stored for legal obligation (art. 6.1.c GDPR)
      },
    });

    // 1. Anonymize existing consent_logs (keep for audit, remove PII link)
    await supabaseAdmin
      .from("consent_logs")
      .update({ user_id: ANON_UUID })
      .eq("user_id", userId);

    // 3. Delete storage files
    for (const bucket of ["cv-uploads", "cv-exports"]) {
      const { data: files } = await supabaseAdmin.storage
        .from(bucket)
        .list(userId + "/");
      if (files && files.length > 0) {
        const paths = files.map((f: any) => `${userId}/${f.name}`);
        await supabaseAdmin.storage.from(bucket).remove(paths);
      }
    }

    // 4. Delete DB records (order matters for FK constraints)
    await supabaseAdmin.from("tailored_cvs").delete().eq("user_id", userId);
    await supabaseAdmin.from("applications").delete().eq("user_id", userId);
    await supabaseAdmin.from("master_cvs").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("user_id", userId);

    // 5. Delete auth user
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Errore durante l'eliminazione" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("delete-account error:", err);
    return new Response(
      JSON.stringify({ error: "Errore interno del server" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
