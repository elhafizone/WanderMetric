import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Untyped view of the Supabase client, for the generic admin paths only.
 *
 * The admin list/form/action code addresses one of eight tables chosen at
 * runtime. The generated `Database` types cannot express that union: TypeScript
 * intersects the column names across every candidate table and collapses them
 * to `never`, so even `eq("id", …)` fails to compile.
 *
 * Narrowing to the SDK's untyped surface here is the contained cost of having
 * one CRUD implementation instead of eight near-identical ones. Correctness is
 * not lost, only relocated: the field config shapes the payload, and the
 * database's CHECK constraints, foreign keys and RLS policies validate it — and
 * those run regardless of what TypeScript believes.
 *
 * Every typed, single-table query elsewhere in the codebase keeps full
 * inference. This escape hatch is used in exactly three places.
 */
export function untypedTable(db: unknown): SupabaseClient {
  return db as SupabaseClient;
}
