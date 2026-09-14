import type { NextRequest } from "next/server";

import { searchContent } from "@/core/content/queries";
import { parseQuery, searchQuery } from "@/lib/api/schemas";
import { apiPaginatedResult } from "@/lib/api/response";
import { validationError, withErrorHandling } from "@/lib/api/handler";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Unified search. Ranking and matching happen in Postgres (migration 0010), and
 * RLS means an anonymous caller can only ever match published rows.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const parsed = parseQuery(searchQuery, request.nextUrl.searchParams);
  if (!parsed.success) return validationError(parsed.error);

  const { q, page, perPage, type } = parsed.data;
  const db = await createSupabaseServerClient();
  return apiPaginatedResult(await searchContent(db, q, { page, perPage, type }));
}, "api.v1.search");
