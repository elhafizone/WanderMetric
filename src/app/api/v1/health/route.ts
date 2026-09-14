import { NextResponse } from "next/server";

import { getSupabasePublicConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Liveness + configuration probe.
 *
 * Versioned under /api/v1 from the first endpoint so the future mobile client
 * consumes exactly the same contract as the website. Reports whether Supabase is
 * configured without ever revealing a key.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "wandermetric",
    version: "v1",
    phase: 1,
    checks: {
      supabaseConfigured: getSupabasePublicConfig() !== null,
    },
    timestamp: new Date().toISOString(),
  });
}
