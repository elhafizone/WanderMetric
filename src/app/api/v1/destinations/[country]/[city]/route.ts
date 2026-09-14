import { getDestinationByPath } from "@/core/content/queries";
import { slugParam } from "@/lib/api/schemas";
import { apiError, apiResult } from "@/lib/api/response";
import { withErrorHandling } from "@/lib/api/handler";
import { appError } from "@/core/shared/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const notFound = () =>
  apiError(appError("NOT_FOUND", "Invalid path", { publicMessage: "Not found." }));

/**
 * A city destination. The country-level page is served by
 * /api/v1/destinations/[country] — same table, `city_id` simply null.
 */
export const GET = withErrorHandling(
  async (
    _request: Request,
    context: { params: Promise<{ country: string; city: string }> },
  ) => {
    const { country, city } = await context.params;
    const parsedCountry = slugParam.safeParse(country);
    const parsedCity = slugParam.safeParse(city);
    if (!parsedCountry.success || !parsedCity.success) return notFound();

    const db = await createSupabaseServerClient();
    return apiResult(await getDestinationByPath(db, parsedCountry.data, parsedCity.data));
  },
  "api.v1.destinations.city",
);
