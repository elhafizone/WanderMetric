import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { Container, Stack } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { ContentCard } from "@/components/ui/card";
import { DetailHero } from "@/components/ui/detail-hero";
import { FactPanel } from "@/components/ui/fact-list";
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
import { formatDuration, formatReadingTime } from "@/lib/format";
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
  const imageKeys = [destination.city?.slug, destination.country.slug];

  return (
    <>
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

      <DetailHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Destinations", href: "/destinations" },
          {
            label: destination.country.name,
            href: countryPath(destination.country.slug),
          },
          { label: destination.title },
        ]}
        eyebrow={destination.country.name}
        title={destination.title}
        description={destination.excerpt}
        media={destination.hero}
        imageKeys={imageKeys}
      />

      <Container width="wide">
        <Stack className="py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
            <article className="flex flex-col gap-10">
              <Prose text={destination.body} />

              {destination.best_time && (
                <section className="border-border-strong border-l-2 pl-6">
                  <h2 className="display-sm mb-2 text-xl">When to visit</h2>
                  <p className="text-ink-soft max-w-[58ch] text-[1.0625rem]/[1.7]">
                    {destination.best_time}
                  </p>
                </section>
              )}
            </article>

            <aside className="flex h-fit flex-col gap-6 lg:sticky lg:top-28">
              <FactPanel
                facts={[
                  { label: "Country", value: destination.country.name },
                  { label: "Airport", value: destination.city?.iata_code, mono: true },
                  { label: "Written by", value: destination.author?.full_name },
                ]}
              />
              {hasAffiliateSurfaces && <AffiliateDisclosure />}
            </aside>
          </div>

          {activityItems.length > 0 && (
            <section className="flex flex-col gap-10">
              <SectionHeader
                eyebrow="Things to do"
                title={`Worth your time in ${destination.title}`}
                href={`/activities/${city}`}
                linkLabel="See all"
              />
              <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activityItems.map((activity) => (
                  <ContentCard
                    key={activity.id}
                    href={activityPath(activity)}
                    title={activity.name}
                    summary={activity.summary}
                    media={activity.hero}
                    imageKeys={[activity.city.slug]}
                    meta={formatDuration(activity.duration_minutes)}
                  />
                ))}
              </Reveal>
            </section>
          )}

          {tourItems.length > 0 && (
            <section className="flex flex-col gap-10">
              <SectionHeader
                eyebrow="Guided"
                title={`Tours in ${destination.title}`}
                href={`/tours/${city}`}
                linkLabel="See all"
              />
              <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {tourItems.map((tour) => (
                  <ContentCard
                    key={tour.id}
                    href={activityPath(tour)}
                    title={tour.name}
                    summary={tour.summary}
                    media={tour.hero}
                    imageKeys={[tour.city.slug]}
                    meta={formatDuration(tour.duration_minutes)}
                  />
                ))}
              </Reveal>
            </section>
          )}

          {hotelItems.length > 0 && (
            <section className="flex flex-col gap-10">
              <SectionHeader
                eyebrow="Where to stay"
                title={`Sleeping in ${destination.title}`}
                href={`/hotels/${city}`}
                linkLabel="See all"
              />
              <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              </Reveal>
            </section>
          )}

          {guideItems.length > 0 && (
            <section className="flex flex-col gap-10">
              <SectionHeader
                eyebrow="Read next"
                title={`Guides for ${destination.title}`}
                href="/guides"
                linkLabel="All guides"
              />
              <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {guideItems.map((guide) => (
                  <ContentCard
                    key={guide.id}
                    href={guidePath(guide.slug)}
                    title={guide.title}
                    summary={guide.excerpt}
                    media={guide.hero}
                    imageKeys={imageKeys}
                    eyebrow={guide.category?.name}
                    meta={formatReadingTime(guide.reading_minutes)}
                  />
                ))}
              </Reveal>
            </section>
          )}
        </Stack>
      </Container>
    </>
  );
}
