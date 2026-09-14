/**
 * Pagination primitives shared by every list endpoint.
 *
 * Page-based rather than cursor-based: the public site needs stable, linkable,
 * indexable ?page=N URLs, and no list here is large or write-heavy enough for
 * offset drift to matter.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PageRequest {
  page: number;
  perPage: number;
}

export interface PageMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

/** Clamps caller-supplied values into a safe range. Never trusts input. */
export function normalizePageRequest(
  page?: number | null,
  perPage?: number | null,
): PageRequest {
  const safePage = Number.isFinite(page) && (page as number) > 0 ? Math.floor(page as number) : 1;
  const requested =
    Number.isFinite(perPage) && (perPage as number) > 0
      ? Math.floor(perPage as number)
      : DEFAULT_PAGE_SIZE;

  return { page: safePage, perPage: Math.min(requested, MAX_PAGE_SIZE) };
}

/** Inclusive `[from, to]` range for a Supabase `.range()` call. */
export function toRange({ page, perPage }: PageRequest): [number, number] {
  const from = (page - 1) * perPage;
  return [from, from + perPage - 1];
}

export function buildPageMeta(request: PageRequest, total: number): PageMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / request.perPage);
  return {
    page: request.page,
    perPage: request.perPage,
    total,
    totalPages,
    hasNext: request.page < totalPages,
    hasPrevious: request.page > 1 && totalPages > 0,
  };
}

export function paginate<T>(items: T[], request: PageRequest, total: number): Paginated<T> {
  return { items, meta: buildPageMeta(request, total) };
}
