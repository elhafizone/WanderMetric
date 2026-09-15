import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, PageShell, Stack } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ContentCard, EmptyState } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/section";
import { listHotels } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { cityPath, hotelPath } from "@/lib/paths";
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
      path: `/hotels/${city}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `Hotels in ${record.name}`,
    description: `Where to stay in ${record.name}: hotels and neighbourhoods, written up by WanderMetric.`,
    path: `/hotels/${record.slug}`,
  });
}

export default async function HotelsByCityPage({ params }: Params) {
  const { city } = await params;
  const record = await loadCity(city);
  if (!record) notFound();

  const db = createSupabasePublicClient();
  const result = await listHotels(db, { citySlug: city, perPage: 24 });
  const items = result.ok ? result.data.items : [];

  return (
    <PageShell>
      <Container width="wide">
        <Stack gap="tight">
          <div className="flex flex-col gap-6">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Hotels", href: "/hotels" },
                { label: record.name },
              ]}
            />
            <PageHeader
              eyebrow={record.country?.name ?? "Hotels"}
              title={`Hotels in ${record.name}`}
              description={`Places to stay in ${record.name}, with notes on the neighbourhood each one sits in.`}
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
              {items.map((hotel, index) => (
                <ContentCard
                  key={hotel.id}
                  href={hotelPath(hotel)}
                  title={hotel.name}
                  summary={hotel.summary}
                  media={hotel.hero}
                  meta={hotel.star_rating ? `${hotel.star_rating}-star` : null}
                  priority={index < 3}
                />
              ))}
            </Reveal>
          ) : (
            <EmptyState
              title={`No hotels published for ${record.name} yet`}
              description="Hotel write-ups appear here once they are published."
            />
          )}
        </Stack>
      </Container>
    </PageShell>
  );
}
