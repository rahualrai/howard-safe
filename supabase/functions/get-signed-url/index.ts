// This function runs in Supabase's Deno runtime. It returns a short-lived
// signed URL for a path stored in a private storage bucket. The function is
// designed to be deployed to Supabase Edge Functions.
// @ts-nocheck

import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const BUCKET = Deno.env.get("SUPABASE_AVATAR_BUCKET") || "avatars";

function jsonResponse(obj: unknown, status = 200) {
  const headers = new Headers({
    "Content-Type": "application/json",
    // Allow your frontend origin in production instead of '*'
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  return new Response(JSON.stringify(obj), { status, headers });
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return jsonResponse({ ok: true }, 204);
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "POST required" }, 405);
    }

    const body = await req.json();
    const path = body?.path;
    if (!path) return jsonResponse({ error: "path is required" }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ signedUrl: data?.signedUrl ?? null });
  } catch (err: any) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
