import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { ContentCard, EmptyState } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section";
import { listActivities } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { activityPath } from "@/lib/paths";
import { formatDuration } from "@/lib/format";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Tours",
  description:
    "Guided tours and experiences by city, with honest notes on what each covers and how long it takes.",
  path: "/tours",
});

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const db = createSupabasePublicClient();
  const result = await listActivities(db, {
    kind: "tour",
    page: Number(page) || 1,
    perPage: 12,
  });

  const items = result.ok ? result.data.items : [];
  const meta = result.ok ? result.data.meta : null;

  return (
    <>
      <PageHeader crumbs={[{ label: "Home", href: "/" }, { label: "Tours" }]} eyebrow="Tours"
              title="Tours"
              description="Guided routes and experiences, with what each one actually covers and how long it takes." />
      <Container className="pt-8 pb-16 sm:pt-10 sm:pb-24">
        <div className="flex flex-col gap-8 sm:gap-10">

          {items.length > 0 ? (
            <>
              <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, index) => (
                  <ContentCard
                    key={item.id}
                    href={activityPath(item)}
                    title={item.name}
                    summary={item.summary}
                    media={item.hero}
                    imageKeys={[item.city.slug]}
                    eyebrow={item.city.name}
                    meta={formatDuration(item.duration_minutes)}
                    priority={index < 3}
                  />
                ))}
              </Reveal>
              {meta && <Pagination meta={meta} basePath="/tours" />}
            </>
          ) : (
            <EmptyState
              title="Nothing published yet"
              description="Entries appear here once they are published from the admin dashboard."
            />
          )}
      </div>
    </Container>
    </>
  );
}
