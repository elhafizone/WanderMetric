import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import {
  DestinationsExplorer,
  type DestinationImage,
} from "@/components/destinations/destinations-explorer";
import { EmptyState } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/section";
import { editorialImage } from "@/core/media/imagery";
import { listDestinations, type DestinationPhoto } from "@/core/offers/offers";
import { buildMetadata } from "@/core/seo/metadata";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = buildMetadata({
  title: "Destinations",
  description:
    "Pick a country, then a city, to see every tour, transfer, car rental and eSIM guide we have published for it.",
  path: "/countries",
});

export const revalidate = 3600;

/** Only what the client needs from a partner photograph. */
function toView(photo: DestinationPhoto | null): DestinationImage | null {
  if (!photo) return null;
  return { src: photo.url, alt: photo.alt, credit: photo.credit, remote: true };
}

/**
 * When no offer shows a photograph for a place, one of our own - a photograph of
 * that place, or of a city inside that country - stands in, described by what is
 * in the frame. A place with neither keeps no picture.
 */
function ownPhoto(...keys: string[]): DestinationImage | null {
  const found = editorialImage(...keys);
  if (!found) return null;
  return {
    src: found.src,
    alt: found.alt,
    credit: `${found.credit.photographer} / ${found.credit.source}`,
    remote: false,
  };
}

export default async function DestinationsPage() {
  const result = await listDestinations(createSupabasePublicClient());
  const countries = (result.ok ? result.data : []).map((country) => ({
    slug: country.slug,
    name: country.name,
    offerCount: country.offerCount,
    image:
      toView(country.photo) ?? ownPhoto(country.slug, ...country.cities.map((city) => city.slug)),
    cities: country.cities.map((city) => ({
      slug: city.slug,
      name: city.name,
      offerCount: city.offerCount,
      image: toView(city.photo) ?? ownPhoto(city.slug),
    })),
  }));

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Destinations" }]}
        title="Destinations"
        description="Pick a country, then a city, to see every tour, transfer, car rental and eSIM guide we have published for it."
      />
      <Container className="pt-10 pb-20 sm:pt-14 sm:pb-28">
        {countries.length > 0 ? (
          <DestinationsExplorer countries={countries} />
        ) : (
          <EmptyState
            title="Destinations are on the way"
            description="A country appears here once we have published a guide for it."
          />
        )}
      </Container>
    </>
  );
}
