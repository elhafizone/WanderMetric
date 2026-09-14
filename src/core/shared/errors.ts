import type { PostgrestError } from "@supabase/supabase-js";

import { appError, type AppError } from "@/core/shared/result";

/**
 * Translates a PostgREST error into the domain error taxonomy.
 *
 * Raw database messages can disclose table names, constraint definitions and
 * column layout, so `publicMessage` carries a generic string while the detailed
 * text stays server-side for logs.
 */
export function fromPostgrestError(error: PostgrestError, context: string): AppError {
  switch (error.code) {
    case "PGRST116": // no rows returned by .single()
      return appError("NOT_FOUND", `${context}: no matching row`, {
        publicMessage: "Not found.",
      });
    case "23505": // unique_violation
      return appError("CONFLICT", `${context}: ${error.message}`, {
        publicMessage: "That value is already in use.",
      });
    case "23503": // foreign_key_violation
      return appError("VALIDATION_FAILED", `${context}: ${error.message}`, {
        publicMessage: "A referenced record does not exist.",
      });
    case "23514": // check_violation — e.g. the thin-content publish gate
      return appError("VALIDATION_FAILED", `${context}: ${error.message}`, {
        publicMessage: "This record does not meet the requirements for publishing.",
      });
    case "42501": // insufficient_privilege (RLS)
      return appError("FORBIDDEN", `${context}: ${error.message}`, {
        publicMessage: "You do not have access to this resource.",
      });
    default:
      return appError("INTERNAL", `${context}: [${error.code}] ${error.message}`, {
        publicMessage: "Something went wrong.",
      });
  }
}
