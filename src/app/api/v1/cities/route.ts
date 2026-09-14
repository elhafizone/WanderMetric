import type { NextRequest } from "next/server";

import { listCities } from "@/core/content/queries";
import { citiesQuery, parseQuery } from "@/lib/api/schemas";
import { apiPaginatedResult } from "@/lib/api/response";
import { validationError, withErrorHandling } from "@/lib/api/handler";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const parsed = parseQuery(citiesQuery, request.nextUrl.searchParams);
  if (!parsed.success) return validationError(parsed.error);

  const { page, perPage, country, featured } = parsed.data;
  const db = await createSupabaseServerClient();
  return apiPaginatedResult(
    await listCities(db, { page, perPage, countrySlug: country, featuredOnly: featured }),
  );
}, "api.v1.cities.list");
