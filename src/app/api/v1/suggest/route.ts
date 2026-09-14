import type { NextRequest } from "next/server";

import { suggestPlaces } from "@/core/content/queries";
import { apiResult } from "@/lib/api/response";
import { withErrorHandling } from "@/lib/api/handler";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Trigram typeahead over place names — tolerates the misspellings FTS misses. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const db = await createSupabaseServerClient();
  return apiResult(await suggestPlaces(db, q));
}, "api.v1.suggest");
