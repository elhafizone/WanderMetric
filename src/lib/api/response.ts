import { NextResponse } from "next/server";

import { HTTP_STATUS_BY_CODE, type AppError, type Result } from "@/core/shared/result";
import type { Paginated } from "@/core/shared/pagination";

/**
 * One response envelope for every endpoint.
 *
 * Success:  { data, meta? }
 * Failure:  { error: { code, message } }
 *
 * Fixed from the first endpoint so the future mobile client can be generated
 * from it and never has to special-case a route.
 */

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function apiPaginated<T>(page: Paginated<T>, init?: ResponseInit) {
  return NextResponse.json({ data: page.items, meta: page.meta }, init);
}

/**
 * Emits `publicMessage` when present, so internal detail (constraint names,
 * table names, driver text) stays in the server log and never on the wire.
 */
export function apiError(error: AppError, init?: ResponseInit) {
  const status = HTTP_STATUS_BY_CODE[error.code] ?? 500;
  return NextResponse.json<ApiErrorBody>(
    { error: { code: error.code, message: error.publicMessage ?? error.message } },
    { ...init, status },
  );
}

/** Bridges a domain Result straight to an HTTP response. */
export function apiResult<T>(result: Result<T>, map?: (value: T) => unknown) {
  if (!result.ok) return apiError(result.error);
  return apiSuccess(map ? map(result.data) : result.data);
}

export function apiPaginatedResult<T>(result: Result<Paginated<T>>) {
  if (!result.ok) return apiError(result.error);
  return apiPaginated(result.data);
}
