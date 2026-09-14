import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, Stack } from "@/components/layout/container";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CardGrid, ContentCard } from "@/components/ui/card";
import { MediaImage } from "@/components/ui/media-image";
import { Prose } from "@/components/ui/prose";
import { SectionHeader } from "@/components/ui/section";
import {
  getDestinationByPath,
  listActivities,
  listGuides,
  listHotels,
} from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { activityPath, countryPath, guidePath, hotelPath } from "@/lib/paths";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 86400;

interface Params {
  params: Promise<{ country: string; city: string }>;
}

/**
 * Only genuinely published destinations are pre-rendered. Anything else is
 * generated on demand — the point is never to manufacture URLs, only to make
 * the ones that earn their place fast.
 */
export async function generateStaticParams() {
  const db = createSupabasePublicClient();

  const { data } = await db
    .from("destinations")
    .select(
      "country:countries!destinations_country_id_fkey(slug), city:cities!destinations_city_id_fkey(slug)",
    )
    .not("city_id", "is", null)
    .is("deleted_at", null)
    .limit(200);

  return (data ?? [])
    .map((row) => {
      const country = row.country as unknown as { slug: string } | null;
      const city = row.city as unknown as { slug: string } | null;
      return country && city ? { country: country.slug, city: city.slug } : null;
    })
    .filter((value): value is { country: string; city: string } => value !== null);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { country, city } = await params;
  const db = createSupabasePublicClient();
  const result = await getDestinationByPath(db, country, city);

  if (!result.ok) {
    return buildMetadata({
      title: "Not found",
      description: "This destination could not be found.",
      path: `/destinations/${country}/${city}`,
      noIndex: true,
    });
  }

  const destination = result.data;
  return buildMetadata({
    title: `${destination.title} travel guide`,
    description:
      destination.excerpt ??
      `A practical guide to visiting ${destination.title}: when to go and what is worth your time.`,
    path: `/destinations/${country}/${city}`,
    type: "article",
    publishedTime: destination.published_at ?? undefined,
  });
}

export default async function CityDestinationPage({ params }: Params) {
  const { country, city } = await params;
  const db = createSupabasePublicClient();

  const result = await getDestinationByPath(db, country, city);
  if (!result.ok) notFound();

  const destination = result.data;
  const cityId = destination.city?.id;

  const [hotels, activities, tours, guides] = await Promise.all([
    listHotels(db, { citySlug: city, perPage: 3 }),
    listActivities(db, { citySlug: city, kind: "activity", perPage: 6 }),
    listActivities(db, { citySlug: city, kind: "tour", perPage: 3 }),
    cityId ? listGuides(db, { cityId, perPage: 3 }) : Promise.resolve(null),
  ]);

  const hotelItems = hotels.ok ? hotels.data.items : [];
  const activityItems = activities.ok ? activities.data.items : [];
  const tourItems = tours.ok ? tours.data.items : [];
  const guideItems = guides?.ok ? guides.data.items : [];
  const hasAffiliateSurfaces = hotelItems.length > 0 || tourItems.length > 0;

  const path = `/destinations/${country}/${city}`;

  return (
    <Container>
      <Stack>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "TouristDestination",
            name: destination.title,
            description: destination.excerpt ?? undefined,
            url: new URL(path, site.url).toString(),
            ...(destination.city?.latitude && destination.city?.longitude
              ? {
                  geo: {
                    "@type": "GeoCoordinates",
                    latitude: destination.city.latitude,
                    longitude: destination.city.longitude,
                  },
                }
              : {}),
            containedInPlace: {
              "@type": "Country",
              name: destination.country.name,
            },
          }}
        />

        <div className="flex flex-col gap-5">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Destinations", href: "/destinations" },
              {
                label: destination.country.name,
                href: countryPath(destination.country.slug),
              },
              { label: destination.title },
            ]}
          />

          <div className="bg-surface-2 relative aspect-[21/9] w-full max-w-full overflow-hidden rounded-2xl">
            <MediaImage
              media={destination.hero}
              label={destination.title}
              priority
              sizes="(max-width: 1024px) 100vw, 1152px"
              className="h-full w-full"
            />
          </div>

          <header className="flex flex-col gap-3 pt-2">
            <p className="text-accent font-mono text-xs tracking-[0.16em] uppercase">
              {destination.country.name}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              {destination.title}
            </h1>
            {destination.excerpt && (
              <p className="text-ink-muted max-w-[65ch] text-lg/relaxed">
                {destination.excerpt}
              </p>
            )}
          </header>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="flex flex-col gap-8">
            <Prose text={destination.body} />

            {destination.best_time && (
              <section className="border-border bg-surface rounded-xl border p-6">
                <h2 className="mb-2 text-lg font-semibold">When to visit</h2>
                <p className="text-ink-muted">{destination.best_time}</p>
              </section>
            )}
          </article>

          <aside className="flex h-fit flex-col gap-4 lg:sticky lg:top-24">
            <div className="border-border bg-surface rounded-xl border p-5">
              <h2 className="mb-3 text-sm font-medium">At a glance</h2>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Country</dt>
                  <dd>{destination.country.name}</dd>
                </div>
                {destination.city?.iata_code && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Airport code</dt>
                    <dd className="font-mono">{destination.city.iata_code}</dd>
                  </div>
                )}
                {destination.author?.full_name && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Written by</dt>
                    <dd>{destination.author.full_name}</dd>
                  </div>
                )}
              </dl>
            </div>
            {hasAffiliateSurfaces && <AffiliateDisclosure />}
          </aside>
        </div>

        {activityItems.length > 0 && (
          <section className="flex flex-col gap-6">
            <SectionHeader
              title={`Things to do in ${destination.title}`}
              href={`/activities/${city}`}
            />
            <CardGrid>
              {activityItems.map((activity) => (
                <ContentCard
                  key={activity.id}
                  href={activityPath(activity)}
                  title={activity.name}
                  summary={activity.summary}
                  media={activity.hero}
                  meta={
                    activity.duration_minutes
                      ? `About ${Math.round(activity.duration_minutes / 60)} h`
                      : null
                  }
                />
              ))}
            </CardGrid>
          </section>
        )}

        {tourItems.length > 0 && (
          <section className="flex flex-col gap-6">
            <SectionHeader
              title={`Tours in ${destination.title}`}
              href={`/tours/${city}`}
            />
            <CardGrid>
              {tourItems.map((tour) => (
                <ContentCard
                  key={tour.id}
                  href={activityPath(tour)}
                  title={tour.name}
                  summary={tour.summary}
                  media={tour.hero}
                />
              ))}
            </CardGrid>
          </section>
        )}

        {hotelItems.length > 0 && (
          <section className="flex flex-col gap-6">
            <SectionHeader
              title={`Where to stay in ${destination.title}`}
              href={`/hotels/${city}`}
            />
            <CardGrid>
              {hotelItems.map((hotel) => (
                <ContentCard
                  key={hotel.id}
                  href={hotelPath(hotel)}
                  title={hotel.name}
                  summary={hotel.summary}
                  media={hotel.hero}
                  meta={hotel.star_rating ? `${hotel.star_rating}-star` : null}
                />
              ))}
            </CardGrid>
          </section>
        )}

        {guideItems.length > 0 && (
          <section className="flex flex-col gap-6">
            <SectionHeader title={`Guides for ${destination.title}`} href="/guides" />
            <CardGrid>
              {guideItems.map((guide) => (
                <ContentCard
                  key={guide.id}
                  href={guidePath(guide.slug)}
                  title={guide.title}
                  summary={guide.excerpt}
                  media={guide.hero}
                  meta={
                    guide.reading_minutes ? `${guide.reading_minutes} min read` : null
                  }
                />
              ))}
            </CardGrid>
          </section>
        )}
      </Stack>
    </Container>
  );
}
