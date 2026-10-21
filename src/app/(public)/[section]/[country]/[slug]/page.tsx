import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MapPin, Star } from "lucide-react";

import { Container } from "@/components/layout/container";
import { OfferBody } from "@/components/offer/offer-body";
import { OfferInclusionsBlock } from "@/components/offer/offer-inclusions";
import { OfferOptionCards } from "@/components/offer/offer-options";
import { OfferGallery } from "@/components/offer/offer-gallery";
import { OfferGuidePanel } from "@/components/offer/offer-guide-panel";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { DetailHero } from "@/components/ui/detail-hero";
import {
  offerInclusions,
  offerOptions,
  offerPhotoCredit,
  offerPhotos,
  offerRating,
} from "@/core/content/offer-facts";
import { editorialImage } from "@/core/media/imagery";
import { getOffer } from "@/core/offers/offers";
import { getSection, offerPath, sectionCountryPath, sectionPath } from "@/core/sections/sections";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

interface Params {
  params: Promise<{ section: string; country: string; slug: string }>;
}

async function load({ section, country, slug }: { section: string; country: string; slug: string }) {
  const info = getSection(section);
  if (!info) return null;
  const result = await getOffer(createSupabasePublicClient(), info.slug, country, slug);
  return result.ok ? { info, offer: result.data } : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const resolved = await params;
  const data = await load(resolved);
  const path = `/${resolved.section}/${resolved.country}/${resolved.slug}`;
  if (!data) return buildMetadata({ title: "Not found", description: "", path, noIndex: true });

  const { offer } = data;
  return buildMetadata({
    title: offer.name.includes(offer.country.name)
      ? offer.name
      : `${offer.name}, ${offer.country.name}`,
    description: offer.summary ?? `${offer.name} in ${offer.country.name}.`,
    path: offerPath(offer.section, offer.country.slug, offer.slug),
    type: "article",
  });
}

function RatingChip({ score, scale, count, credit }: { score: number; scale: number; count: string; credit: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="bg-warning-soft inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold">
        <Star aria-hidden className="text-warning size-4 fill-current" />
        {score.toFixed(1)}
        <span className="text-ink-muted font-normal">/ {scale}</span>
      </span>
      <span className="text-ink-soft">
        {count} reviews on {credit}
      </span>
    </p>
  );
}

export default async function OfferPage({ params }: Params) {
  const data = await load(await params);
  if (!data) notFound();
  const { info, offer } = data;
  const where = offer.city ? `${offer.city.name}, ${offer.country.name}` : offer.country.name;
  const photo = editorialImage(offer.slug, offer.city?.slug, offer.country.slug);
  const photos = offerPhotos(offer.facts);
  const credit = offerPhotoCredit(offer.facts);
  const rating = offerRating(offer.facts);
  const inclusions = offerInclusions(offer.facts);
  const options = offerOptions(offer.facts);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: info.name, href: sectionPath(info.slug) },
    { label: offer.country.name, href: sectionCountryPath(info.slug, offer.country.slug) },
    { label: offer.name },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: site.url },
            {
              "@type": "ListItem",
              position: 2,
              name: info.name,
              item: new URL(sectionPath(info.slug), site.url).toString(),
            },
            {
              "@type": "ListItem",
              position: 3,
              name: offer.country.name,
              item: new URL(sectionCountryPath(info.slug, offer.country.slug), site.url).toString(),
            },
            { "@type": "ListItem", position: 4, name: offer.name },
          ],
        }}
      />

      {photos.length > 0 && credit ? (
        <Container className="pt-4 sm:pt-5">
          <Breadcrumbs items={crumbs} />
          <header className="mt-5 flex max-w-[60rem] flex-col gap-3 sm:mt-6">
            <p className="text-secondary flex items-center gap-1.5 text-[0.9375rem] font-bold">
              <MapPin aria-hidden className="size-4" />
              {where}
            </p>
            <h1 className="display text-[2.125rem]/[1.08] lg:text-[3.25rem]/[1.05]">
              {offer.name}
            </h1>
            {rating && (
              <RatingChip
                score={rating.score}
                scale={rating.scale}
                count={rating.countLabel}
                credit={credit ?? offer.program.name}
              />
            )}
            {offer.summary && (
              <p className="text-ink-soft max-w-[62ch] text-base/[1.625rem] sm:text-[1.125rem]/[1.75rem]">
                {offer.summary}
              </p>
            )}
          </header>
          <div className="mt-6 sm:mt-8">
            <OfferGallery
              photos={photos}
              credit={credit}
              sourceUrl={offer.source_url}
              title={offer.name}
            />
          </div>
        </Container>
      ) : (
        <DetailHero
          crumbs={crumbs}
          eyebrow={where}
          title={offer.name}
          description={offer.summary}
          media={null}
          imageKeys={[offer.slug, offer.city?.slug, offer.country.slug]}
          meta={
            rating ? (
              <RatingChip
                score={rating.score}
                scale={rating.scale}
                count={rating.countLabel}
                credit={credit ?? offer.program.name}
              />
            ) : null
          }
        />
      )}

      <Container width="wide">
        <div className="grid gap-12 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-16">
          <article className="flex flex-col gap-10">
            <OfferBody text={offer.body} />
            {inclusions && <OfferInclusionsBlock data={inclusions} />}
            <OfferOptionCards options={options} />
            {photos.length === 0 && photo && (
              <p className="text-ink-muted mt-10 text-xs">
                Photo: {photo.credit.photographer} on {photo.credit.source}
              </p>
            )}
          </article>
          <aside className="flex h-fit flex-col gap-5 lg:sticky lg:top-24">
            <OfferGuidePanel item={offer} />
          </aside>
        </div>
      </Container>
    </>
  );
}
