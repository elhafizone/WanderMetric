import type { Metadata } from "next";

import { Container, Stack } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CardGrid, ContentCard, EmptyState } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section";
import { listActivities } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { activityPath } from "@/lib/paths";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Things to do",
  description:
    "Things to do, city by city: attractions and landmarks worth the time, with practical notes on booking and timing.",
  path: "/activities",
});

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const db = createSupabasePublicClient();
  const result = await listActivities(db, {
    kind: "activity",
    page: Number(page) || 1,
    perPage: 12,
  });

  const items = result.ok ? result.data.items : [];
  const meta = result.ok ? result.data.meta : null;

  return (
    <Container>
      <Stack>
        <div className="flex flex-col gap-5">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Things to do" }]}
          />
          <PageHeader
            eyebrow="Things to do"
            title="Things to do"
            description="Attractions, museums and landmarks worth the time, with notes on booking ahead and when to arrive."
          />
        </div>

        {items.length > 0 ? (
          <>
            <CardGrid>
              {items.map((item, index) => (
                <ContentCard
                  key={item.id}
                  href={activityPath(item)}
                  title={item.name}
                  summary={item.summary}
                  media={item.hero}
                  eyebrow={item.city.name}
                  meta={
                    item.duration_minutes
                      ? `About ${Math.round(item.duration_minutes / 60)} h`
                      : null
                  }
                  priority={index < 3}
                />
              ))}
            </CardGrid>
            {meta && <Pagination meta={meta} basePath="/activities" />}
          </>
        ) : (
          <EmptyState
            title="Nothing published yet"
            description="Entries appear here once they are published from the admin dashboard."
          />
        )}
      </Stack>
    </Container>
  );
}
