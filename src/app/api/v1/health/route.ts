import { NextResponse } from "next/server";

import { getSupabasePublicConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

type ReachableCheck = { reachable: boolean; status?: number; error?: string };

/**
 * Confirms the Supabase project actually answers and accepts our key, rather
 * than only checking that the variables are present.
 *
 * Probes the GoTrue health endpoint: it requires a valid `apikey`, responds
 * before any table or policy exists, and does not depend on PostgREST schema
 * exposure (whose root returns 401 to anonymous callers by default).
 */
async function checkSupabaseReachable(
  url: string,
  apiKey: string,
): Promise<ReachableCheck> {
  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: apiKey },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    return { reachable: response.ok, status: response.status };
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.name : "unknown_error",
    };
  }
}

/**
 * Liveness + configuration probe.
 *
 * Versioned under /api/v1 from the first endpoint so the future mobile client
 * consumes exactly the same contract as the website. Never reveals a key value.
 */
export async function GET() {
  const supabaseConfig = getSupabasePublicConfig();

  const supabase = supabaseConfig
    ? {
        configured: true,
        ...(await checkSupabaseReachable(
          supabaseConfig.NEXT_PUBLIC_SUPABASE_URL,
          supabaseConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        )),
      }
    : { configured: false, reachable: false };

  const healthy = supabase.configured && supabase.reachable;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "wandermetric",
      version: "v1",
      phase: 1,
      checks: { supabase },
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
