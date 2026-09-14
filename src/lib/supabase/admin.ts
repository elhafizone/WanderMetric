import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requireServiceRoleKey, requireSupabasePublicConfig } from "@/lib/env";

/**
 * Privileged Supabase client that BYPASSES Row Level Security.
 *
 * Use only for trusted server-side work: scheduled jobs, webhook ingestion,
 * admin mutations that have already been authorized. Never expose a route that
 * proxies this client to an untrusted caller.
 */
export function createSupabaseAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = requireSupabasePublicConfig();

  return createClient(NEXT_PUBLIC_SUPABASE_URL, requireServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
