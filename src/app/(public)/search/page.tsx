import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { OfferCard } from "@/components/offer/offer-card";
import { SearchForm } from "@/components/search/search-form";
import { EmptyState } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section";
import { searchOffers } from "@/core/offers/offers";
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
  description: "Search the tours, transfers, rentals and other guides on WanderMetric.",
  path: "/search",
  noIndex: true,
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page } = await searchParams;
  const query = q.trim();

  const result = query
    ? await searchOffers(createSupabasePublicClient(), query, {
        page: Number(page) || 1,
        perPage: 18,
      })
    : null;

  const items = result?.ok ? result.data.items : [];
  const meta = result?.ok ? result.data.meta : null;
  const basePath = `/search?q=${encodeURIComponent(query)}`;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
        eyebrow="Search"
        title={query ? `Results for “${query}”` : "Search WanderMetric"}
        description={query ? null : "Search the guides by name, place or partner."}
      >
        <div className="flex max-w-2xl flex-col gap-4">
          <SearchForm defaultValue={query} autoFocus={!query} />
        </div>
      </PageHeader>

      <Container className="pt-10 pb-20 sm:pt-14 sm:pb-28">
        <div className="flex flex-col gap-6">
          {query && items.length === 0 && (
            <EmptyState
              title="No matches"
              description="Try a broader term. A city or country name usually works best."
            />
          )}

          {items.length > 0 && (
            <>
              <p className="text-ink-muted text-sm" aria-live="polite">
                {meta?.total ?? items.length} result{(meta?.total ?? items.length) === 1 ? "" : "s"}
              </p>
              <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((offer) => (
                  <li key={offer.id}>
                    <OfferCard offer={offer} />
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
