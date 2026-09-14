import type { Metadata } from "next";

import { Container, Stack } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CardGrid, ContentCard, EmptyState } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section";
import { listDeals } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { dealPath } from "@/lib/paths";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Travel deals",
  description:
    "Current travel deals on WanderMetric — checked before publishing, and removed automatically when they expire.",
  path: "/deals",
});

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const db = createSupabasePublicClient();
  const result = await listDeals(db, { page: Number(page) || 1, perPage: 12 });

  const items = result.ok ? result.data.items : [];
  const meta = result.ok ? result.data.meta : null;

  return (
    <Container>
      <Stack>
        <div className="flex flex-col gap-5">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Travel deals" }]}
          />
          <PageHeader
            eyebrow="Deals"
            title="Travel deals"
            description="Time-limited offers we have checked before publishing. Nothing here is an invented discount."
          />
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
                  url: new URL(dealPath(item.slug), site.url).toString(),
                })),
              }}
            />
            <CardGrid>
              {items.map((item, index) => (
                <ContentCard
                  key={item.id}
                  href={dealPath(item.slug)}
                  title={item.title}
                  summary={item.summary}
                  media={item.hero}
                  eyebrow={item.discount_label}
                  meta={
                    item.ends_at
                      ? `Ends ${new Date(item.ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                      : null
                  }
                  priority={index < 3}
                />
              ))}
            </CardGrid>
            {meta && <Pagination meta={meta} basePath="/deals" />}
          </>
        ) : (
          <EmptyState
            title="Nothing published yet"
            description="No deals are running right now. Expired deals are hidden automatically, so this page never shows a stale offer."
          />
        )}
      </Stack>
    </Container>
  );
}
