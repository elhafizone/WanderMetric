import type { NextRequest } from "next/server";

import { listDeals } from "@/core/content/queries";
import { paginationQuery, parseQuery } from "@/lib/api/schemas";
import { apiPaginatedResult } from "@/lib/api/response";
import { validationError, withErrorHandling } from "@/lib/api/handler";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const parsed = parseQuery(paginationQuery, request.nextUrl.searchParams);
  if (!parsed.success) return validationError(parsed.error);

  const db = await createSupabaseServerClient();
  return apiPaginatedResult(await listDeals(db, parsed.data));
}, "api.v1.deals.list");
