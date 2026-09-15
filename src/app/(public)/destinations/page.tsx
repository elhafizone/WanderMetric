import type { Metadata } from "next";

import { Container, PageShell, Stack } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ContentCard, EmptyState, FeatureCard, Mosaic } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section";
import { JsonLd } from "@/components/seo/json-ld";
import { listDestinations } from "@/core/content/queries";
import type { DestinationCard } from "@/core/content/types";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { destinationPath } from "@/lib/paths";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Destinations",
  description:
    "Every destination WanderMetric covers — cities and countries with practical, researched guides on when to go and what is worth your time.",
  path: "/destinations",
});

function keysFor(destination: Pick<DestinationCard, "city" | "country">) {
  return [destination.city?.slug, destination.country.slug];
}

export default async function DestinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;

  const db = createSupabasePublicClient();
  const result = await listDestinations(db, { page: currentPage, perPage: 12 });

  const items = result.ok ? result.data.items : [];
  const meta = result.ok ? result.data.meta : null;

  // The mosaic is for page one only. On page two a reader is scanning rather
  // than browsing, and promoting an arbitrary row to hero size there would be
  // a layout decision pretending to be an editorial one.
  const useMosaic = currentPage === 1 && items.length >= 3;
  const lead = useMosaic ? items.slice(0, 3) : [];
  const remainder = useMosaic ? items.slice(3) : items;

  return (
    <PageShell>
      <Container width="wide">
        <Stack gap="tight">
          <div className="flex flex-col gap-6">
            <Breadcrumbs
              items={[{ label: "Home", href: "/" }, { label: "Destinations" }]}
            />
            <PageHeader
              eyebrow="Destinations"
              title="Where to go"
              description="Cities and countries we have researched properly. Each page covers when to visit, what is worth the time, and what to skip."
            />
            <div aria-hidden="true" className="rule w-full" />
          </div>

          {items.length > 0 ? (
            <>
              {/* ItemList so the listing is understood as a collection rather
                  than a page that happens to contain links. */}
              <JsonLd
                data={{
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  itemListElement: items.map((destination, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: destination.title,
                    url: new URL(destinationPath(destination), site.url).toString(),
                  })),
                }}
              />

              {useMosaic && (
                <Mosaic>
                  {lead.map((destination, index) => (
                    <FeatureCard
                      key={destination.id}
                      href={destinationPath(destination)}
                      title={destination.title}
                      summary={destination.excerpt}
                      media={destination.hero}
                      imageKeys={keysFor(destination)}
                      eyebrow={
                        destination.city ? destination.country.name : "Country guide"
                      }
                      ratio={
                        index === 0 ? "aspect-[4/5]" : "aspect-[16/10] lg:aspect-[16/9]"
                      }
                      sizes={
                        index === 0
                          ? "(max-width: 1024px) 92vw, 48vw"
                          : "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 34vw"
                      }
                      priority={index === 0}
                    />
                  ))}
                </Mosaic>
              )}

              {remainder.length > 0 && (
                <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {remainder.map((destination, index) => (
                    <ContentCard
                      key={destination.id}
                      href={destinationPath(destination)}
                      title={destination.title}
                      summary={destination.excerpt}
                      media={destination.hero}
                      imageKeys={keysFor(destination)}
                      eyebrow={
                        destination.city ? destination.country.name : "Country guide"
                      }
                      priority={!useMosaic && index < 3}
                    />
                  ))}
                </Reveal>
              )}

              {meta && <Pagination meta={meta} basePath="/destinations" />}
            </>
          ) : (
            <EmptyState
              title="No destinations published yet"
              description="Destinations appear here once they are published from the admin dashboard."
            />
          )}
        </Stack>
      </Container>
    </PageShell>
  );
}
