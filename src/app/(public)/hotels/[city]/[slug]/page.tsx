import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { DetailHero } from "@/components/ui/detail-hero";
import { FactPanel } from "@/components/ui/fact-list";
import { Prose } from "@/components/ui/prose";
import { getHotelBySlug } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { hotelCityPath, hotelPath } from "@/lib/paths";
import { publicMediaUrl } from "@/lib/media";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 86400;

interface Params {
  params: Promise<{ city: string; slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city, slug } = await params;
  const db = createSupabasePublicClient();
  const result = await getHotelBySlug(db, city, slug);

  if (!result.ok) {
    return buildMetadata({
      title: "Not found",
      description: "This hotel could not be found.",
      path: `/hotels/${city}/${slug}`,
      noIndex: true,
    });
  }

  const hotel = result.data;
  return buildMetadata({
    title: `${hotel.name}, ${hotel.city.name}`,
    description:
      hotel.summary ?? `${hotel.name} in ${hotel.city.name} - a WanderMetric write-up.`,
    path: hotelPath(hotel),
    type: "article",
    image: publicMediaUrl(hotel.hero) ?? undefined,
  });
}

export default async function HotelDetailPage({ params }: Params) {
  const { city, slug } = await params;
  const db = createSupabasePublicClient();

  const result = await getHotelBySlug(db, city, slug);
  if (!result.ok) notFound();
  const hotel = result.data;

  return (
    <>
      {/* Hotel schema carries only facts we actually hold. No aggregateRating
          or priceRange is emitted, because we store neither -- inventing them
          would be both fabrication and a structured-data policy violation. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Hotel",
          name: hotel.name,
          description: hotel.summary ?? undefined,
          url: new URL(hotelPath(hotel), site.url).toString(),
          ...(hotel.star_rating
            ? {
                starRating: {
                  "@type": "Rating",
                  ratingValue: hotel.star_rating,
                  bestRating: 5,
                },
              }
            : {}),
          address: {
            "@type": "PostalAddress",
            addressLocality: hotel.city.name,
            ...(hotel.address ? { streetAddress: hotel.address } : {}),
          },
          ...(hotel.latitude && hotel.longitude
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: hotel.latitude,
                  longitude: hotel.longitude,
                },
              }
            : {}),
        }}
      />

      {/* No `imageKeys`: a photograph above a property name reads as a
          photograph of that property, so a hotel without its own media row gets
          the placeholder rather than a picture of the city it sits in. */}
      <DetailHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Hotels", href: "/hotels" },
          { label: hotel.city.name, href: hotelCityPath(hotel.city.slug) },
          { label: hotel.name },
        ]}
        eyebrow={hotel.city.name}
        title={hotel.name}
        description={hotel.summary}
        media={hotel.hero}
      />

      <Container width="wide">
        <div className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <article>
            <Prose text={hotel.body} />
          </article>

          <aside className="flex h-fit flex-col gap-6 lg:sticky lg:top-28">
            <FactPanel
              facts={[
                { label: "City", value: hotel.city.name },
                {
                  label: "Rating",
                  value: hotel.star_rating ? `${hotel.star_rating}-star` : null,
                },
                { label: "Address", value: hotel.address },
              ]}
            />
            <AffiliateDisclosure />
          </aside>
        </div>
      </Container>
    </>
  );
}
