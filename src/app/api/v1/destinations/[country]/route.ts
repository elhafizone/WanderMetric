import { getDestinationByPath } from "@/core/content/queries";
import { slugParam } from "@/lib/api/schemas";
import { apiError, apiResult } from "@/lib/api/response";
import { withErrorHandling } from "@/lib/api/handler";
import { appError } from "@/core/shared/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ country: string }> }) => {
    const { country } = await context.params;
    const parsed = slugParam.safeParse(country);
    if (!parsed.success) {
      return apiError(
        appError("NOT_FOUND", "Invalid slug", { publicMessage: "Not found." }),
      );
    }

    const db = await createSupabaseServerClient();
    return apiResult(await getDestinationByPath(db, parsed.data));
  },
  "api.v1.destinations.country",
);
