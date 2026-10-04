import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { ArticleTile } from "@/components/ui/article-tile";
import { EmptyState } from "@/components/ui/card";
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
  const currentPage = Number(page) || 1;

  const db = createSupabasePublicClient();
  const result = await listGuides(db, { page: currentPage, perPage: 12 });

  const items = result.ok ? result.data.items : [];
  const meta = result.ok ? result.data.meta : null;

  return (
    <>
      <PageHeader crumbs={[{ label: "Home", href: "/" }, { label: "Travel guides" }]} eyebrow="Guides"
              title="Travel guides"
        description="Short, practical guides: what to book ahead, what to skip, and how to compare. Each one shows when it was last updated." />
      <Container className="pt-8 pb-16 sm:pt-10 sm:pb-24">
        <div className="flex flex-col gap-8 sm:gap-10">

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

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <ArticleTile key={item.id} guide={item} />
                ))}
              </div>

              {meta && <Pagination meta={meta} basePath="/guides" />}
            </>
          ) : (
            <EmptyState
              title="Nothing published yet"
              description="Guides appear here once they are published."
            />
          )}
      </div>
    </Container>
    </>
  );
}
