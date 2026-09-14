import type { Metadata } from "next";
import Link from "next/link";

import { Container, Stack } from "@/components/layout/container";
import { SearchForm } from "@/components/search/search-form";
import { CardGrid, ContentCard, EmptyState } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section";
import { listDeals, listDestinations, listGuides } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { destinationPath, guidePath, dealPath } from "@/lib/paths";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = buildMetadata({
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  path: "/",
});

/**
 * Revalidate hourly. The home page aggregates several listings, so it changes
 * whenever anything is published; an hour keeps it fresh without rebuilding on
 * every request.
 */
export const revalidate = 3600;

export default async function HomePage() {
  const db = createSupabasePublicClient();

  // Independent queries, so run them concurrently rather than in series.
  const [destinations, guides, deals] = await Promise.all([
    listDestinations(db, { featuredOnly: true, perPage: 6 }),
    listGuides(db, { perPage: 3 }),
    listDeals(db, { perPage: 3 }),
  ]);

  const featured = destinations.ok ? destinations.data.items : [];
  const latestGuides = guides.ok ? guides.data.items : [];
  const currentDeals = deals.ok ? deals.data.items : [];

  return (
    <Container>
      <Stack>
        <section className="flex flex-col gap-6 pt-6 sm:pt-10">
          <p className="text-accent font-mono text-xs tracking-[0.16em] uppercase">
            Travel discovery
          </p>
          <h1 className="max-w-[18ch] text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Find where to go, and what is actually worth doing there.
          </h1>
          <p className="text-ink-muted max-w-[60ch] text-lg/relaxed">
            Researched destination guides, things to do, and places to stay — written to
            be useful rather than exhaustive.
          </p>
          <div className="max-w-xl pt-2">
            <SearchForm />
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeader
            title="Featured destinations"
            description="Cities and countries we have covered in depth."
            href="/destinations"
          />
          {featured.length > 0 ? (
            <CardGrid>
              {featured.map((destination, index) => (
                <ContentCard
                  key={destination.id}
                  href={destinationPath(destination)}
                  title={destination.title}
                  summary={destination.excerpt}
                  media={destination.hero}
                  eyebrow={destination.city ? destination.country.name : "Country guide"}
                  priority={index < 3}
                />
              ))}
            </CardGrid>
          ) : (
            <EmptyState
              title="No destinations published yet"
              description="Published destinations will appear here."
            />
          )}
        </section>

        {latestGuides.length > 0 && (
          <section className="flex flex-col gap-6">
            <SectionHeader
              title="Latest guides"
              description="Practical writing on getting the most out of a trip."
              href="/guides"
            />
            <CardGrid>
              {latestGuides.map((guide) => (
                <ContentCard
                  key={guide.id}
                  href={guidePath(guide.slug)}
                  title={guide.title}
                  summary={guide.excerpt}
                  media={guide.hero}
                  eyebrow={guide.category?.name}
                  meta={
                    guide.reading_minutes ? `${guide.reading_minutes} min read` : null
                  }
                />
              ))}
            </CardGrid>
          </section>
        )}

        {currentDeals.length > 0 && (
          <section className="flex flex-col gap-6">
            <SectionHeader
              title="Current deals"
              description="Time-limited offers, checked before they go live."
              href="/deals"
            />
            <CardGrid>
              {currentDeals.map((deal) => (
                <ContentCard
                  key={deal.id}
                  href={dealPath(deal.slug)}
                  title={deal.title}
                  summary={deal.summary}
                  media={deal.hero}
                  eyebrow={deal.discount_label}
                />
              ))}
            </CardGrid>
          </section>
        )}

        <section className="border-border bg-surface rounded-2xl border p-8 sm:p-12">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">Start somewhere</h2>
            <p className="text-ink-muted max-w-prose">
              Browse every destination we cover, or read the guides if you already know
              where you are going.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/destinations"
                className="bg-accent text-accent-contrast rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
              >
                Browse destinations
              </Link>
              <Link
                href="/guides"
                className="border-border hover:border-accent hover:text-accent rounded-md border px-5 py-2.5 text-sm font-medium transition-colors"
              >
                Read the guides
              </Link>
            </div>
          </div>
        </section>
      </Stack>
    </Container>
  );
}
