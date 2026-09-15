import type { Metadata } from "next";

import { Comparison, type ComparisonSide } from "@/components/home/comparison";
import { EditorialBand } from "@/components/home/editorial-band";
import { FinalCta } from "@/components/home/final-cta";
import { GuideShowcase } from "@/components/home/guide-showcase";
import { HomeHero } from "@/components/home/hero";
import { Container, Stack } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { ContentCard, FeatureCard, Mosaic } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section";
import {
  getDestinationByPath,
  listActivities,
  listDeals,
  listDestinations,
  listFlightRoutes,
  listGuides,
  listHotels,
} from "@/core/content/queries";
import type { DestinationCard, DestinationDetail } from "@/core/content/types";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import {
  activityPath,
  dealPath,
  destinationPath,
  flightRoutePath,
  hotelPath,
} from "@/lib/paths";
import { formatDuration, formatShortDate } from "@/lib/format";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = buildMetadata({
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  path: "/",
});

/**
 * Revalidate hourly. The home page aggregates several listings, so it changes
 * whenever anything is published; an hour keeps it fresh without rebuilding on
 * every request.
 */
export const revalidate = 3600;

/**
 * Image keys for a destination, most specific first: the city where there is
 * one, otherwise the country. `resolveImage` walks them in order, so a Lisbon
 * card gets the Lisbon photograph and a country overview falls back only as far
 * as an image of that country — never to a picture of somewhere else.
 */
function keysFor(destination: Pick<DestinationCard, "city" | "country">) {
  return [destination.city?.slug, destination.country.slug];
}

export default async function HomePage() {
  const db = createSupabasePublicClient();

  // Independent queries, so run them concurrently rather than in series.
  const [destinations, guides, hotels, activities, flights, deals] = await Promise.all([
    listDestinations(db, { featuredOnly: true, perPage: 6 }),
    listGuides(db, { perPage: 5 }),
    listHotels(db, { perPage: 3 }),
    listActivities(db, { kind: "activity", perPage: 6 }),
    listFlightRoutes(db, { perPage: 3 }),
    listDeals(db, { perPage: 3 }),
  ]);

  const featured = destinations.ok ? destinations.data.items : [];
  const latestGuides = guides.ok ? guides.data.items : [];
  const stays = hotels.ok ? hotels.data.items : [];
  const things = activities.ok ? activities.data.items : [];
  const routes = flights.ok ? flights.data.items : [];
  const currentDeals = deals.ok ? deals.data.items : [];

  const comparison = await buildComparison(db, featured);

  return (
    <>
      <HomeHero />

      <Container width="wide">
        <Stack className="py-20 sm:py-28">
          {featured.length > 0 && (
            <section className="flex flex-col gap-10">
              <SectionHeader
                eyebrow="Popular destinations"
                title="Places worth the journey"
                description="Cities and countries we have covered properly — not a list of everywhere, a list of somewhere."
                href="/destinations"
                linkLabel="All destinations"
              />
              <Mosaic>
                {featured.map((destination, index) =>
                  index === 0 ? (
                    <FeatureCard
                      key={destination.id}
                      href={destinationPath(destination)}
                      title={destination.title}
                      summary={destination.excerpt}
                      media={destination.hero}
                      imageKeys={keysFor(destination)}
                      eyebrow={destination.country.name}
                      ratio="aspect-[4/5]"
                      sizes="(max-width: 1024px) 92vw, 48vw"
                      priority
                    />
                  ) : index < 3 ? (
                    <FeatureCard
                      key={destination.id}
                      href={destinationPath(destination)}
                      title={destination.title}
                      summary={destination.excerpt}
                      media={destination.hero}
                      imageKeys={keysFor(destination)}
                      eyebrow={destination.country.name}
                      ratio="aspect-[16/10] lg:aspect-[16/9]"
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 34vw"
                    />
                  ) : (
                    <ContentCard
                      key={destination.id}
                      href={destinationPath(destination)}
                      title={destination.title}
                      summary={destination.excerpt}
                      media={destination.hero}
                      imageKeys={keysFor(destination)}
                      eyebrow={
                        destination.city ? destination.country.name : "Country guide"
                      }
                    />
                  ),
                )}
              </Mosaic>
            </section>
          )}
        </Stack>
      </Container>

      <EditorialBand
        eyebrow="How this works"
        title="We write the page we wanted to find."
        body="Every destination here was researched before it was published — when to go, what is genuinely worth the time, and what quietly is not. Where a booking link helps, it is there. Where it would not, it is not."
      />

      <Container width="wide">
        <Stack className="py-20 sm:py-28">
          {things.length > 0 && (
            <section className="flex flex-col gap-10">
              <SectionHeader
                eyebrow="Best things to do"
                title="Worth building a day around"
                description="Landmarks, museums and walks that repay the queue — with notes on when to arrive and what to book ahead."
                href="/activities"
                linkLabel="All things to do"
              />
              <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {things.map((activity) => (
                  <ContentCard
                    key={activity.id}
                    href={activityPath(activity)}
                    title={activity.name}
                    summary={activity.summary}
                    media={activity.hero}
                    imageKeys={[activity.city.slug]}
                    eyebrow={activity.city.name}
                    meta={formatDuration(activity.duration_minutes)}
                  />
                ))}
              </Reveal>
            </section>
          )}

          {/* Stays, deals and the comparison render only when the data is
              genuinely there. An empty rail filled with placeholder cards would
              be an invented recommendation, which is the one thing this site
              does not do. */}
          {stays.length > 0 && (
            <section className="flex flex-col gap-10">
              <SectionHeader
                eyebrow="Best places to stay"
                title="Where to sleep, and why there"
                description="We describe the hotel and the neighbourhood around it. Prices and availability come live from booking partners — they are never stored here."
                href="/hotels"
                linkLabel="All stays"
              />
              <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {stays.map((hotel) => (
                  <ContentCard
                    key={hotel.id}
                    href={hotelPath(hotel)}
                    title={hotel.name}
                    summary={hotel.summary}
                    media={hotel.hero}
                    eyebrow={hotel.city.name}
                    meta={hotel.star_rating ? `${hotel.star_rating}-star` : null}
                  />
                ))}
              </Reveal>
            </section>
          )}

          {latestGuides.length > 0 && (
            <section className="flex flex-col gap-10">
              <SectionHeader
                eyebrow="Travel guides"
                title="Read before you book"
                description="Long-form writing on getting a trip right: what to reserve weeks ahead, what to leave open, and when to go at all."
                href="/guides"
                linkLabel="All guides"
              />
              <GuideShowcase guides={latestGuides} />
            </section>
          )}

          {comparison && (
            <section className="flex flex-col gap-10">
              <SectionHeader
                eyebrow="Where should you go next?"
                title={`${comparison.left.title} or ${comparison.right.title}?`}
                description="Two cities side by side, on the things we actually know about them."
                align="center"
              />
              <Comparison left={comparison.left} right={comparison.right} />
            </section>
          )}

          {routes.length > 0 && (
            <section className="flex flex-col gap-10">
              <SectionHeader
                eyebrow="Getting there"
                title="Flights for your next trip"
                description="Route guides on journey times, which airport to use — and when the train is quietly the better call."
                href="/flights"
                linkLabel="All routes"
              />
              <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {routes.map((route) => (
                  <ContentCard
                    key={route.id}
                    href={flightRoutePath(route)}
                    title={route.title}
                    summary={`${route.origin.name} to ${route.destination.name}`}
                    media={null}
                    imageKeys={[route.destination.slug, route.origin.slug]}
                    eyebrow={
                      route.origin.iata_code && route.destination.iata_code
                        ? `${route.origin.iata_code} → ${route.destination.iata_code}`
                        : "Route guide"
                    }
                  />
                ))}
              </Reveal>
            </section>
          )}

          {currentDeals.length > 0 && (
            <section className="flex flex-col gap-10">
              <SectionHeader
                eyebrow="Best deals right now"
                title="Checked before they were published"
                description="Time-limited offers we looked at first. Expired ones disappear on their own, so this never shows a stale discount."
                href="/deals"
                linkLabel="All deals"
              />
              <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {currentDeals.map((deal) => (
                  <ContentCard
                    key={deal.id}
                    href={dealPath(deal.slug)}
                    title={deal.title}
                    summary={deal.summary}
                    media={deal.hero}
                    imageKeys={[deal.city?.slug]}
                    eyebrow={deal.discount_label}
                    meta={deal.ends_at ? `Ends ${formatShortDate(deal.ends_at)}` : null}
                  />
                ))}
              </Reveal>
            </section>
          )}
        </Stack>
      </Container>

      <FinalCta />
    </>
  );
}

/**
 * The comparison needs the full record on both sides — `best_time` is not on
 * the card shape — so the two leading city destinations are re-read in detail.
 * Returns null unless both resolve, because a one-sided comparison is not one.
 */
async function buildComparison(
  db: ReturnType<typeof createSupabasePublicClient>,
  featured: DestinationCard[],
): Promise<{ left: ComparisonSide; right: ComparisonSide } | null> {
  const pair = featured.filter((item) => item.city !== null).slice(0, 2);
  if (pair.length < 2) return null;

  const results = await Promise.all(
    pair.map((item) => getDestinationByPath(db, item.country.slug, item.city!.slug)),
  );

  const [left, right] = results.map((result) => (result.ok ? result.data : null));
  if (!left || !right) return null;

  return { left: comparisonSide(left), right: comparisonSide(right) };
}

/**
 * Builds one side of the comparison from fields the record genuinely carries.
 * Anything null is omitted, and `Comparison` then renders only the rows both
 * sides share — so a missing value never appears as a dash the reader could
 * mistake for a judgement about the place.
 */
function comparisonSide(destination: DestinationDetail): ComparisonSide {
  const facts: ComparisonSide["facts"] = [
    { label: "Country", value: destination.country.name },
  ];

  if (destination.best_time) {
    facts.push({ label: "Best time to visit", value: destination.best_time });
  }
  if (destination.city?.iata_code) {
    facts.push({ label: "Airport", value: destination.city.iata_code });
  }

  return {
    title: destination.title,
    href: destinationPath(destination),
    eyebrow: destination.country.name,
    excerpt: destination.excerpt,
    media: destination.hero,
    imageKeys: [destination.city?.slug, destination.country.slug],
    facts,
  };
}
