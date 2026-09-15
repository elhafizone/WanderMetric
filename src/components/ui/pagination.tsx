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

  const link =
    "border-border-strong hover:border-ink inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors duration-200";

  return (
    <nav
      aria-label="Pagination"
      className="border-border mt-4 flex items-center justify-between gap-4 border-t pt-10"
    >
      {meta.hasPrevious ? (
        <Link rel="prev" href={href(meta.page - 1)} className={link}>
          <span aria-hidden="true">←</span> Previous
        </Link>
      ) : (
        <span />
      )}

      <span className="text-ink-muted text-xs tracking-wide" aria-live="polite">
        Page {meta.page} of {meta.totalPages}
      </span>

      {meta.hasNext ? (
        <Link rel="next" href={href(meta.page + 1)} className={link}>
          Next <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
