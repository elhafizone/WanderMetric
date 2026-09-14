import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { Container, Stack } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { MediaImage } from "@/components/ui/media-image";
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
    <Container width="narrow">
      <Stack>
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

        <div className="flex flex-col gap-5">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Hotels", href: "/hotels" },
              { label: hotel.city.name, href: hotelCityPath(hotel.city.slug) },
              { label: hotel.name },
            ]}
          />

          <div className="bg-surface-2 relative aspect-[16/9] w-full max-w-full overflow-hidden rounded-2xl">
            <MediaImage
              media={hotel.hero}
              label={hotel.name}
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-full w-full"
            />
          </div>

          <header className="flex flex-col gap-3">
            <p className="text-accent font-mono text-xs tracking-[0.16em] uppercase">
              {hotel.city.name}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {hotel.name}
            </h1>
            {hotel.summary && (
              <p className="text-ink-muted text-lg/relaxed">{hotel.summary}</p>
            )}
            <dl className="text-ink-muted flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {hotel.star_rating && (
                <div className="flex gap-2">
                  <dt>Rating</dt>
                  <dd className="text-ink">{hotel.star_rating}-star</dd>
                </div>
              )}
              {hotel.address && (
                <div className="flex gap-2">
                  <dt>Address</dt>
                  <dd className="text-ink">{hotel.address}</dd>
                </div>
              )}
            </dl>
          </header>
        </div>

        <Prose text={hotel.body} />
        <AffiliateDisclosure />
      </Stack>
    </Container>
  );
}
