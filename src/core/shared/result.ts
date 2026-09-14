/**
 * Explicit result type for service-layer calls.
 *
 * The domain layer never throws across its own boundary — callers (web routes
 * today, a mobile-facing API tomorrow) get a value they must handle. This keeps
 * error semantics identical for every client.
 */
export type Result<T, E = AppError> = { ok: true; data: T } | { ok: false; error: E };

export type AppErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PROVIDER_ERROR"
  | "NOT_CONFIGURED"
  | "INTERNAL";

export interface AppError {
  code: AppErrorCode;
  message: string;
  /** Safe to show a end user. Internal detail stays in `message`. */
  publicMessage?: string;
  details?: unknown;
}

export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

export function err<E = AppError>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function appError(
  code: AppErrorCode,
  message: string,
  options: { publicMessage?: string; details?: unknown } = {},
): AppError {
  return { code, message, ...options };
}

/** Maps a domain error code onto the HTTP status the API layer should return. */
export const HTTP_STATUS_BY_CODE: Record<AppErrorCode, number> = {
  NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  PROVIDER_ERROR: 502,
  NOT_CONFIGURED: 503,
  INTERNAL: 500,
};
