import type { Metadata } from "next";

import { Container, Stack } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CardGrid, ContentCard, EmptyState } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section";
import { JsonLd } from "@/components/seo/json-ld";
import { listDestinations } from "@/core/content/queries";
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

export default async function DestinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const db = createSupabasePublicClient();
  const result = await listDestinations(db, { page: Number(page) || 1, perPage: 12 });

  const items = result.ok ? result.data.items : [];
  const meta = result.ok ? result.data.meta : null;

  return (
    <Container>
      <Stack>
        <div className="flex flex-col gap-5">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Destinations" }]}
          />
          <PageHeader
            eyebrow="Destinations"
            title="Where to go"
            description="Cities and countries we have researched properly. Each page covers when to visit, what is worth the time, and what to skip."
          />
        </div>

        {items.length > 0 ? (
          <>
            {/* ItemList so the listing is understood as a collection rather than
                a page that happens to contain links. */}
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
            <CardGrid>
              {items.map((destination, index) => (
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
  );
}
