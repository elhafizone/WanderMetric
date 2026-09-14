import type { Metadata } from "next";
import Link from "next/link";

import { Container, Stack } from "@/components/layout/container";
import { SearchForm } from "@/components/search/search-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section";
import { searchContent } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { createSupabasePublicClient } from "@/lib/supabase/public";

/**
 * Search results are noindex.
 *
 * Internal search pages are classic thin/duplicate content: they generate an
 * unbounded number of URLs with no unique value, and indexing them invites
 * exactly the penalty this project is built to avoid. The page is useful to
 * visitors and invisible to crawlers, which is the correct split.
 */
export const metadata: Metadata = buildMetadata({
  title: "Search",
  description: "Search destinations, guides, hotels and things to do on WanderMetric.",
  path: "/search",
  noIndex: true,
});

const TYPE_LABEL: Record<string, string> = {
  destination: "Destination",
  guide: "Guide",
  hotel: "Hotel",
  activity: "Things to do",
  deal: "Deal",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; type?: string }>;
}) {
  const { q = "", page, type } = await searchParams;
  const query = q.trim();

  const db = createSupabasePublicClient();
  const result = query
    ? await searchContent(db, query, { page: Number(page) || 1, perPage: 20, type })
    : null;

  const items = result?.ok ? result.data.items : [];
  const meta = result?.ok ? result.data.meta : null;

  return (
    <Container width="narrow">
      <Stack>
        <div className="flex flex-col gap-5">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
          <PageHeader
            eyebrow="Search"
            title={query ? `Results for “${query}”` : "Search WanderMetric"}
            description={
              query
                ? null
                : "Search across destinations, guides, hotels, tours and things to do."
            }
          />
          <SearchForm defaultValue={query} autoFocus={!query} />
        </div>

        {query && items.length === 0 && (
          <EmptyState
            title="No matches"
            description="Try a broader term — a city or country name usually works best."
          />
        )}

        {items.length > 0 && (
          <>
            <p className="text-ink-muted text-sm" aria-live="polite">
              {items.length} result{items.length === 1 ? "" : "s"} on this page
            </p>
            <ul className="divide-border border-border bg-surface flex flex-col divide-y overflow-hidden rounded-xl border">
              {items.map((hit) => (
                <li key={`${hit.content_type}-${hit.id}`}>
                  <Link
                    href={hit.path}
                    className="hover:bg-surface-2 flex flex-col gap-1 p-5 transition-colors"
                  >
                    <span className="text-accent font-mono text-[11px] tracking-[0.12em] uppercase">
                      {TYPE_LABEL[hit.content_type] ?? hit.content_type}
                    </span>
                    <span className="font-medium">{hit.title}</span>
                    {hit.summary && (
                      <span className="text-ink-muted line-clamp-2 text-sm">
                        {hit.summary}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            {meta && (
              <Pagination
                meta={meta}
                basePath={`/search?q=${encodeURIComponent(query)}`}
              />
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
