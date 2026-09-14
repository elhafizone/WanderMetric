import type { Metadata } from "next";

import { Container, Stack } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CardGrid, ContentCard, EmptyState } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section";
import { listGuides } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { guidePath } from "@/lib/paths";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Travel guides",
  description:
    "Practical travel guides from WanderMetric: what to book ahead, what to skip, and when to go.",
  path: "/guides",
});

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const db = createSupabasePublicClient();
  const result = await listGuides(db, { page: Number(page) || 1, perPage: 12 });

  const items = result.ok ? result.data.items : [];
  const meta = result.ok ? result.data.meta : null;

  return (
    <Container>
      <Stack>
        <div className="flex flex-col gap-5">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Travel guides" }]}
          />
          <PageHeader
            eyebrow="Guides"
            title="Travel guides"
            description="Practical writing on planning and getting the most out of a trip — what to book ahead, what to skip, and when to go."
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
                  url: new URL(guidePath(item.slug), site.url).toString(),
                })),
              }}
            />
            <CardGrid>
              {items.map((item, index) => (
                <ContentCard
                  key={item.id}
                  href={guidePath(item.slug)}
                  title={item.title}
                  summary={item.excerpt}
                  media={item.hero}
                  eyebrow={item.category?.name}
                  meta={item.reading_minutes ? `${item.reading_minutes} min read` : null}
                  priority={index < 3}
                />
              ))}
            </CardGrid>
            {meta && <Pagination meta={meta} basePath="/guides" />}
          </>
        ) : (
          <EmptyState
            title="Nothing published yet"
            description="Guides appear here once they are published."
          />
        )}
      </Stack>
    </Container>
  );
}
