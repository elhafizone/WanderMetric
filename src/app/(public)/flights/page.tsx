import type { Metadata } from "next";

import { Container, PageShell, Stack } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ContentCard, EmptyState } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section";
import { listFlightRoutes } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { flightRoutePath } from "@/lib/paths";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Flight routes",
  description:
    "Flight route guides from WanderMetric: journey times, which airport to use, and when the train is the better option.",
  path: "/flights",
});

export default async function FlightsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const db = createSupabasePublicClient();
  const result = await listFlightRoutes(db, { page: Number(page) || 1, perPage: 12 });

  const items = result.ok ? result.data.items : [];
  const meta = result.ok ? result.data.meta : null;

  return (
    <PageShell>
      <Container width="wide">
        <Stack gap="tight">
          <div className="flex flex-col gap-6">
            <Breadcrumbs
              items={[{ label: "Home", href: "/" }, { label: "Flight routes" }]}
            />
            <PageHeader
              eyebrow="Flights"
              title="Flight routes"
              description="Route guides covering journey times, airports and whether flying is actually the right call."
            />
            <div aria-hidden="true" className="rule w-full" />
          </div>

          {items.length > 0 ? (
            <>
              <JsonLd
                data={{
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  itemListElement: items.map((item, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: item.title,
                    url: new URL(flightRoutePath(item), site.url).toString(),
                  })),
                }}
              />
              <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, index) => (
                  <ContentCard
                    key={item.id}
                    href={flightRoutePath(item)}
                    title={item.title}
                    summary={`${item.origin.name} to ${item.destination.name}`}
                    media={null}
                    imageKeys={[item.destination.slug, item.origin.slug]}
                    eyebrow={
                      item.origin.iata_code && item.destination.iata_code
                        ? `${item.origin.iata_code} → ${item.destination.iata_code}`
                        : null
                    }
                    priority={index < 3}
                  />
                ))}
              </Reveal>
              {meta && <Pagination meta={meta} basePath="/flights" />}
            </>
          ) : (
            <EmptyState
              title="Nothing published yet"
              description="Route guides appear here once they are published."
            />
          )}
        </Stack>
      </Container>
    </PageShell>
  );
}
