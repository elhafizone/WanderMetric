import type { Metadata } from "next";

import { GuideShowcase } from "@/components/home/guide-showcase";
import { Container, PageShell, Stack } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ContentCard, EmptyState } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section";
import { listGuides } from "@/core/content/queries";
import { placeKeysFromSlug } from "@/core/media/imagery";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { formatReadingTime } from "@/lib/format";
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

  // The cover story is a page-one idea. Further pages are an archive, and an
  // archive reads better as an even grid than as a run of competing features.
  const showcase = currentPage === 1 ? items.slice(0, 5) : [];
  const rest = currentPage === 1 ? items.slice(5) : items;

  return (
    <PageShell>
      <Container width="wide">
        <Stack gap="tight">
          <div className="flex flex-col gap-6">
            <Breadcrumbs
              items={[{ label: "Home", href: "/" }, { label: "Travel guides" }]}
            />
            <PageHeader
              eyebrow="Guides"
              title="Travel guides"
              description="Practical writing on planning and getting the most out of a trip — what to book ahead, what to skip, and when to go."
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
                    url: new URL(guidePath(item.slug), site.url).toString(),
                  })),
                }}
              />

              {showcase.length > 0 && <GuideShowcase guides={showcase} />}

              {rest.length > 0 && (
                <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((item, index) => (
                    <ContentCard
                      key={item.id}
                      href={guidePath(item.slug)}
                      title={item.title}
                      summary={item.excerpt}
                      media={item.hero}
                      imageKeys={placeKeysFromSlug(item.slug)}
                      eyebrow={item.category?.name}
                      meta={formatReadingTime(item.reading_minutes)}
                      priority={currentPage > 1 && index < 3}
                    />
                  ))}
                </Reveal>
              )}

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
    </PageShell>
  );
}
