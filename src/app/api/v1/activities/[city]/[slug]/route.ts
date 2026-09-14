import type { NextRequest } from "next/server";

import { getActivityBySlug } from "@/core/content/queries";
import { slugParam } from "@/lib/api/schemas";
import { apiError, apiResult } from "@/lib/api/response";
import { withErrorHandling } from "@/lib/api/handler";
import { appError } from "@/core/shared/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * `?kind=tour` selects a tour; anything else resolves an activity. Activities
 * and tours share a table, so this is one code path rather than two.
 */
export const GET = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ city: string; slug: string }> },
  ) => {
    const { city, slug } = await context.params;
    const parsedCity = slugParam.safeParse(city);
    const parsedSlug = slugParam.safeParse(slug);
    if (!parsedCity.success || !parsedSlug.success) {
      return apiError(
        appError("NOT_FOUND", "Invalid path", { publicMessage: "Not found." }),
      );
    }

    const kind =
      request.nextUrl.searchParams.get("kind") === "tour" ? "tour" : "activity";
    const db = await createSupabaseServerClient();
    return apiResult(await getActivityBySlug(db, kind, parsedCity.data, parsedSlug.data));
  },
  "api.v1.activities.detail",
);
