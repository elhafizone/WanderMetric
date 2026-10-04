import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { SearchForm } from "@/components/search/search-form";
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

const FILTERS = [
  { value: "", label: "Everything" },
  { value: "destination", label: "Destinations" },
  { value: "hotel", label: "Hotels" },
  { value: "activity", label: "Things to do" },
  { value: "guide", label: "Guides" },
  { value: "deal", label: "Deals" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; type?: string }>;
}) {
  const { q = "", page, type } = await searchParams;
  const query = q.trim();

  // The RPC takes null for "no filter". An empty string arrives from the hero
  // form's default option and would otherwise be sent as a real filter value
  // that matches nothing.
  const activeType = type && type.length > 0 ? type : undefined;

  const db = createSupabasePublicClient();
  const result = query
    ? await searchContent(db, query, {
        page: Number(page) || 1,
        perPage: 20,
        type: activeType,
      })
    : null;

  const items = result?.ok ? result.data.items : [];
  const meta = result?.ok ? result.data.meta : null;

  const filterHref = (value: string) => {
    const params = new URLSearchParams({ q: query });
    if (value) params.set("type", value);
    return `/search?${params.toString()}`;
  };

  const basePath = `/search?q=${encodeURIComponent(query)}${
    activeType ? `&type=${encodeURIComponent(activeType)}` : ""
  }`;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
        eyebrow="Search"
        title={query ? `Results for “${query}”` : "Search WanderMetric"}
        description={
          query ? null : "Search across destinations, guides, hotels, tours and things to do."
        }
      >
        <div className="flex max-w-2xl flex-col gap-4">
          <SearchForm defaultValue={query} autoFocus={!query} />
          {query && (
            <ul className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => {
                const active = (activeType ?? "") === filter.value;
                return (
                  <li key={filter.value || "all"}>
                    <Link
                      href={filterHref(filter.value)}
                      aria-current={active ? "true" : undefined}
                      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-bold transition-colors ${
                        active
                          ? "border-accent bg-accent text-accent-contrast"
                          : "border-border-strong bg-surface text-ink-soft hover:border-ink"
                      }`}
                    >
                      {filter.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PageHeader>

      <Container className="pt-8 pb-16 sm:pt-10 sm:pb-24">
        <div className="flex max-w-4xl flex-col gap-6">
          {query && items.length === 0 && (
            <EmptyState
              title="No matches"
              description="Try a broader term. A city or country name usually works best."
            />
          )}

          {items.length > 0 && (
            <>
              <p className="text-ink-muted text-sm" aria-live="polite">
                {items.length} result{items.length === 1 ? "" : "s"} on this page
              </p>

              <ul className="flex flex-col gap-3">
                {items.map((hit) => (
                  <li key={`${hit.content_type}-${hit.id}`}>
                    <Link
                      href={hit.path}
                      className="group border-border bg-surface hover:border-accent flex flex-col gap-1.5 rounded-lg border p-5 transition-colors"
                    >
                      <span className="eyebrow text-accent">
                        {TYPE_LABEL[hit.content_type] ?? hit.content_type}
                      </span>
                      <span className="display-sm text-xl">{hit.title}</span>
                      {hit.summary && (
                        <span className="text-ink-muted line-clamp-2 max-w-[70ch] text-[0.9375rem]/[1.6]">
                          {hit.summary}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              {meta && <Pagination meta={meta} basePath={basePath} />}
            </>
          )}
        </div>
      </Container>
    </>
  );
}
