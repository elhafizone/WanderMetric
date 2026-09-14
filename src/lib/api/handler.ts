import { ZodError } from "zod";

import { appError } from "@/core/shared/result";
import { apiError } from "@/lib/api/response";
import { logError } from "@/lib/logger";

/**
 * Wraps a route handler so an unexpected throw becomes a clean 500 instead of a
 * stack trace on the wire. Zod failures are reported as 422 with field detail,
 * which is safe: it describes the caller's own input, not our internals.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
  context: string,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ZodError) {
        return apiError(
          appError("VALIDATION_FAILED", "Invalid request", {
            publicMessage: "Invalid request parameters.",
            details: error.issues.map((i) => ({
              path: i.path.join("."),
              message: i.message,
            })),
          }),
        );
      }

      logError(context, error);
      return apiError(
        appError("INTERNAL", "Unhandled route error", {
          publicMessage: "Something went wrong.",
        }),
      );
    }
  };
}

/** Turns a Zod failure into the standard 422 response. */
export function validationError(error: ZodError) {
  return apiError(
    appError("VALIDATION_FAILED", "Invalid request", {
      publicMessage: "Invalid request parameters.",
      details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    }),
  );
}
