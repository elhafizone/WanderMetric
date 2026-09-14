import { createClient } from "@supabase/supabase-js";

import { requireSupabasePublicConfig } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cookie-free Supabase client for public pages.
 *
 * This exists for a specific reason: `createSupabaseServerClient` reads cookies,
 * and reading cookies opts a route out of static rendering entirely. Public
 * pages have no user session to honour, so using the session-aware client there
 * would silently force every destination and guide page to render on demand,
 * losing ISR and the Core Web Vitals that depend on it.
 *
 * It uses the anon key, so RLS still restricts it to published content.
 */
export function createSupabasePublicClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } =
    requireSupabasePublicConfig();

  return createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
