import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, PageShell, Stack } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ContentCard, EmptyState } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/section";
import { listActivities } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { activityPath, cityPath } from "@/lib/paths";
import { formatDuration } from "@/lib/format";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

interface Params {
  params: Promise<{ city: string }>;
}

async function loadCity(citySlug: string) {
  const db = createSupabasePublicClient();
  const { data } = await db
    .from("cities")
    .select("id, name, slug, country:countries!cities_country_id_fkey(name, slug)")
    .eq("slug", citySlug)
    .is("deleted_at", null)
    .maybeSingle();
  return data as unknown as {
    id: string;
    name: string;
    slug: string;
    country: { name: string; slug: string } | null;
  } | null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city } = await params;
  const record = await loadCity(city);

  if (!record) {
    return buildMetadata({
      title: "Not found",
      description: "This city could not be found.",
      path: `/activities/${city}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `Things to do in ${record.name}`,
    description: `Things to do in ${record.name}, with practical notes on booking ahead and when to arrive.`,
    path: `/activities/${record.slug}`,
  });
}

export default async function ActivitiesByCityPage({ params }: Params) {
  const { city } = await params;
  const record = await loadCity(city);
  if (!record) notFound();

  const db = createSupabasePublicClient();
  const result = await listActivities(db, {
    kind: "activity",
    citySlug: city,
    perPage: 24,
  });
  const items = result.ok ? result.data.items : [];

  return (
    <PageShell>
      <Container width="wide">
        <Stack gap="tight">
          <div className="flex flex-col gap-6">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Things to do", href: "/activities" },
                { label: record.name },
              ]}
            />
            <PageHeader
              eyebrow={record.country?.name ?? "Things to do"}
              title={`Things to do in ${record.name}`}
              description={`What is worth your time in ${record.name}, and what to book before you arrive.`}
            />
            {record.country && (
              <p className="text-ink-muted text-sm">
                See the full{" "}
                <a
                  className="text-accent underline-offset-4 hover:underline"
                  href={cityPath(record.country.slug, record.slug)}
                >
                  {record.name} travel guide
                </a>
                .
              </p>
            )}
            <div aria-hidden="true" className="rule w-full" />
          </div>

          {items.length > 0 ? (
            <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => (
                <ContentCard
                  key={item.id}
                  href={activityPath(item)}
                  title={item.name}
                  summary={item.summary}
                  media={item.hero}
                  imageKeys={[record.slug]}
                  meta={formatDuration(item.duration_minutes)}
                  priority={index < 3}
                />
              ))}
            </Reveal>
          ) : (
            <EmptyState
              title={`Nothing published for ${record.name} yet`}
              description="Entries appear here once they are published."
            />
          )}
        </Stack>
      </Container>
    </PageShell>
  );
}
