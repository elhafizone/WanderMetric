import Link from "next/link";

import type { PageMeta } from "@/core/shared/pagination";

/**
 * Pagination with real anchors.
 *
 * Links rather than buttons so crawlers can follow them and the browser can
 * prefetch. rel=prev/next is emitted for the same reason.
 */
export function Pagination({ meta, basePath }: { meta: PageMeta; basePath: string }) {
  if (meta.totalPages <= 1) return null;

  // basePath may already carry a query string (search results do), so pick the
  // correct separator rather than always appending "?".
  const separator = basePath.includes("?") ? "&" : "?";
  const href = (page: number) =>
    page === 1 ? basePath : `${basePath}${separator}page=${page}`;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 pt-4">
      {meta.hasPrevious ? (
        <Link
          rel="prev"
          href={href(meta.page - 1)}
          className="border-border hover:border-accent hover:text-accent rounded-md border px-4 py-2 text-sm"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}

      <span className="text-ink-muted text-sm" aria-live="polite">
        Page {meta.page} of {meta.totalPages}
      </span>

      {meta.hasNext ? (
        <Link
          rel="next"
          href={href(meta.page + 1)}
          className="border-border hover:border-accent hover:text-accent rounded-md border px-4 py-2 text-sm"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
