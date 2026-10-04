import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ArrowRight,
  Bus,
  CalendarCheck,
  Car,
  ExternalLink,
  Plane,
  Route,
  Smartphone,
  Sun,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { ArticleTile } from "@/components/ui/article-tile";
import { Badge } from "@/components/ui/badge";
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
import { formatDuration, formatMonthYear } from "@/lib/format";
import { activityPath, countryPath, hotelPath } from "@/lib/paths";
import { loadSearchModuleData } from "@/lib/search-module-data";
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

  const [hotels, activities, tours, guides, search] = await Promise.all([
    listHotels(db, { citySlug: city, perPage: 3 }),
    listActivities(db, { citySlug: city, kind: "activity", perPage: 6 }),
    listActivities(db, { citySlug: city, kind: "tour", perPage: 3 }),
    cityId ? listGuides(db, { cityId, perPage: 3 }) : Promise.resolve(null),
    loadSearchModuleData(db),
  ]);

  const hotelItems = hotels.ok ? hotels.data.items : [];
  const activityItems = activities.ok ? activities.data.items : [];
  const tourItems = tours.ok ? tours.data.items : [];
  const guideItems = guides?.ok ? guides.data.items : [];

  const path = `/destinations/${country}/${city}`;
  const imageKeys = [destination.city?.slug, destination.country.slug];

  const liveSearches = new Set(search.partners.map((partner) => partner.key));
  const updated = formatMonthYear(destination.updated_at);
  const airport = destination.city?.iata_code;
  const place = destination.city?.name ?? destination.title;

  // "Book for {place}": four ways to go on. Partner searches are offered only
  // when their link is live; the other two lead to our own comparison pages.
  const book: Array<{
    label: string;
    text: string;
    icon: LucideIcon;
    href: string;
    external: boolean;
  }> = [
    ...(liveSearches.has("activities")
      ? [
          {
            label: `Things to do in ${place}`,
            text: "Tours, tickets and day trips",
            icon: Ticket,
            href: `/go/search-things-to-do?${new URLSearchParams({ q: place, c: "destination-things", from: path })}`,
            external: true,
          },
        ]
      : []),
    {
      label: "Airport transfers",
      text: "Compare providers for your arrival",
      icon: Bus,
      href: "/transfers",
      external: false,
    },
    ...(liveSearches.has("esim")
      ? [
          {
            label: `eSIM for ${destination.country.name}`,
            text: "Data before you land",
            icon: Smartphone,
            href: `/go/search-esim?${new URLSearchParams({ q: destination.country.name, c: "destination-esim", from: path })}`,
            external: true,
          },
        ]
      : []),
    {
      label: "Car hire",
      text: "Providers and what to check",
      icon: Car,
      href: "/car-hire",
      external: false,
    },
  ];

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
        title={destination.title}
        description={destination.excerpt}
        media={destination.hero}
        imageKeys={imageKeys}
        meta={
          updated ? (
            <Badge tone="success" icon={<CalendarCheck aria-hidden="true" className="h-3.5 w-3.5" />}>
              Updated {updated}
            </Badge>
          ) : undefined
        }
        actions={
          <>
            {airport && (
              <Link
                href="/flights"
                className="bg-cta text-on-cta hover:bg-cta-hover flex h-12 items-center gap-2 rounded-md px-5 text-base font-extrabold transition-colors"
              >
                <Plane aria-hidden="true" className="h-[1.125rem] w-[1.125rem]" />
                Flights to {place}
              </Link>
            )}
            {activityItems.length > 0 && (
              <Link
                href={`/activities/${city}`}
                className="border-accent bg-surface hover:bg-accent-soft flex h-12 items-center gap-2 rounded-md border-[1.5px] px-4 text-[0.9375rem] font-extrabold transition-colors"
              >
                <Ticket aria-hidden="true" className="h-[1.125rem] w-[1.125rem]" />
                Things to do
              </Link>
            )}
          </>
        }
      />

      <Container className="flex flex-col gap-12 pt-8 pb-16 sm:gap-14 sm:pt-10 sm:pb-24">
        {(destination.best_time || airport) && (
          <section
            aria-label="Quick facts"
            className="border-border bg-surface grid overflow-hidden rounded-lg border md:grid-cols-2"
          >
            {destination.best_time && (
              <div className="border-border flex flex-col gap-3 p-5 sm:p-6 md:border-r">
                <p className="eyebrow text-ink-muted flex items-center gap-2">
                  <Sun aria-hidden="true" className="h-4 w-4" />
                  Best time to go
                </p>
                <p className="text-[1.0625rem]/[1.625rem] font-bold text-pretty">{destination.best_time}</p>
              </div>
            )}
            {airport && (
              <div className="border-border flex flex-col gap-2.5 border-t p-5 first:border-t-0 sm:p-6 md:border-t-0">
                <p className="eyebrow text-ink-muted flex items-center gap-2">
                  <Route aria-hidden="true" className="h-4 w-4" />
                  Getting there
                </p>
                <p className="text-[1.0625rem]/[1.625rem] font-bold">
                  Airport code{" "}
                  <span className="bg-bg-tint rounded-md px-2 py-0.5 tabular-nums">{airport}</span>
                </p>
                <Link
                  href="/transfers"
                  className="text-accent flex min-h-11 items-center gap-1.5 text-sm font-extrabold"
                >
                  Compare airport transfers
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            )}
          </section>
        )}

        {destination.body && (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
            <article>
              <h2 className="display mb-5 text-[1.5rem]/[1.875rem] lg:text-[2rem]/[2.375rem]">
                About {place}
              </h2>
              <Prose text={destination.body} lead={false} />
            </article>

            <aside className="flex h-fit flex-col gap-5 lg:sticky lg:top-24">
              <FactPanel
                facts={[
                  { label: "Country", value: destination.country.name },
                  { label: "Written by", value: destination.author?.full_name },
                  { label: "Updated", value: updated },
                ]}
              />
            </aside>
          </div>
        )}
      </Container>

      <div className="bg-bg-tint border-border border-y">
        <Container className="flex flex-col gap-5 py-10 sm:py-12">
          <SectionHeader
            title={`Book for ${place}`}
            description="Links marked with an arrow open a partner site."
          />
          <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {book.map((item) => (
              <li key={item.label}>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="sponsored nofollow noopener"
                    className="border-border bg-surface hover:border-accent flex h-full items-center gap-3.5 rounded-lg border p-4 transition-colors"
                  >
                    <BookTile item={item} external />
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="border-border bg-surface hover:border-accent flex h-full items-center gap-3.5 rounded-lg border p-4 transition-colors"
                  >
                    <BookTile item={item} />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Container>
      </div>

      <Container className="flex flex-col gap-12 pt-12 pb-16 sm:gap-14 sm:pt-14 sm:pb-24">
        {activityItems.length > 0 && (
          <section className="flex flex-col gap-5">
            <SectionHeader
              title={`Worth your time in ${destination.title}`}
              href={`/activities/${city}`}
              linkLabel="See all"
            />
            <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          <section className="flex flex-col gap-5">
            <SectionHeader
              title={`Tours in ${destination.title}`}
              href={`/tours/${city}`}
              linkLabel="See all"
            />
            <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          <section className="flex flex-col gap-5">
            <SectionHeader
              title={`Where to stay in ${destination.title}`}
              href={`/hotels/${city}`}
              linkLabel="See all"
            />
            <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          <section className="flex flex-col gap-5">
            <SectionHeader
              title={`Guides for ${destination.title}`}
              href="/guides"
              linkLabel="All guides"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {guideItems.map((guide) => (
                <ArticleTile key={guide.id} guide={guide} />
              ))}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}

function BookTile({
  item,
  external = false,
}: {
  item: { label: string; text: string; icon: LucideIcon };
  external?: boolean;
}) {
  return (
    <>
      <span className="bg-accent-soft text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
        <item.icon aria-hidden="true" className="h-[1.375rem] w-[1.375rem]" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="text-[0.9375rem]/5 font-extrabold">{item.label}</strong>
        <span className="text-ink-muted text-[0.8125rem]/[1.125rem]">{item.text}</span>
      </span>
      {external ? (
        <ExternalLink aria-hidden="true" className="text-ink-muted h-4 w-4 shrink-0" />
      ) : (
        <ArrowRight aria-hidden="true" className="text-ink-muted h-4 w-4 shrink-0" />
      )}
      {external && <span className="sr-only">(opens in a new tab)</span>}
    </>
  );
}
