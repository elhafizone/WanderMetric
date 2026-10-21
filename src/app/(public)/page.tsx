import type { Metadata } from "next";

import { ClosingPanel } from "@/components/home/closing-panel";
import { DestinationMosaic, type MosaicDestination } from "@/components/home/destination-mosaic";
import { destinationPicture } from "@/components/home/destination-image";
import { DiscoveryBar } from "@/components/home/discovery-bar";
import { EditorialBand } from "@/components/home/editorial-band";
import { HomeHero } from "@/components/home/home-hero";
import { LatestGuides } from "@/components/home/latest-guides";
import { SectionIndex } from "@/components/home/section-index";
import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/ui/section";
import { countOffersBySection, listDestinations, listOffers } from "@/core/offers/offers";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = buildMetadata({
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  path: "/",
});

/** Revalidate hourly: the home page changes whenever an offer is published. */
export const revalidate = 3600;

/** How many country tiles the home page shows. */
const MAX_DESTINATIONS = 6;

export default async function HomePage() {
  const db = createSupabasePublicClient();

  const [offers, destinations, counts] = await Promise.all([
    listOffers(db, { perPage: 4 }),
    listDestinations(db),
    countOffersBySection(db),
  ]);

  const latest = offers.ok ? offers.data.items : [];
  const countries = destinations.ok ? destinations.data : [];
  const perSection = counts.ok ? counts.data : {};

  // Only a country with a real photograph gets a tile: nothing stands in for a
  // picture of somewhere else.
  const tiles: MosaicDestination[] = [];
  for (const country of countries) {
    const picture = destinationPicture(country);
    if (!picture) continue;
    tiles.push({
      slug: country.slug,
      name: country.name,
      offerCount: country.offerCount,
      cityCount: country.cities.length,
      picture,
    });
    if (tiles.length === MAX_DESTINATIONS) break;
  }

  return (
    <>
      <HomeHero />
      <DiscoveryBar
        countries={countries.map((country) => ({
          slug: country.slug,
          name: country.name,
          offerCount: country.offerCount,
        }))}
      />

      {tiles.length > 0 && (
        <section aria-label="Destinations" className="pt-20 sm:pt-28">
          <Container className="flex flex-col gap-8 sm:gap-10">
            <SectionHeader
              title="Start with a place"
              description="Every country that has a published guide, and the cities inside it."
              href="/countries"
              linkLabel="All destinations"
            />
            <DestinationMosaic destinations={tiles} />
          </Container>
        </section>
      )}

      {latest.length > 0 && (
        <section aria-label="Latest guides" className="pt-20 sm:pt-28">
          <Container className="flex flex-col gap-8 sm:gap-10">
            <SectionHeader
              title="Latest guides"
              description="Written from each partner’s own listing: what it includes, what to check, and when we read it."
              href="/tours-activities"
              linkLabel="All tours"
            />
            <LatestGuides offers={latest} />
          </Container>
        </section>
      )}

      <section aria-label="Sections" className="py-20 sm:py-28">
        <Container className="flex flex-col gap-8 sm:gap-10">
          <SectionHeader
            title="Ten ways to plan a trip"
            description="From the things to do there to the SIM card you land with."
          />
          <SectionIndex counts={perSection} />
        </Container>
      </section>

      <EditorialBand />
      <ClosingPanel />
    </>
  );
}
