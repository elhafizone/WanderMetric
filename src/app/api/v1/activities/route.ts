import type { NextRequest } from "next/server";

import { listActivities } from "@/core/content/queries";
import { activityKindQuery, parseQuery } from "@/lib/api/schemas";
import { apiPaginatedResult } from "@/lib/api/response";
import { validationError, withErrorHandling } from "@/lib/api/handler";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Serves both activities and tours; `kind` selects between them. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const parsed = parseQuery(activityKindQuery, request.nextUrl.searchParams);
  if (!parsed.success) return validationError(parsed.error);

  const { page, perPage, kind, city } = parsed.data;
  const db = await createSupabaseServerClient();
  return apiPaginatedResult(
    await listActivities(db, { page, perPage, kind, citySlug: city }),
  );
}, "api.v1.activities.list");
