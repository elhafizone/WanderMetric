import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { requireSupabasePublicConfig } from "@/lib/env";

/**
 * Supabase client for Client Components. Uses the anon key and is therefore
 * bound by Row Level Security — never put privileged logic behind it.
 */
export function createSupabaseBrowserClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } =
    requireSupabasePublicConfig();

  return createBrowserClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
