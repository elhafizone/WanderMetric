import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { OfferGuidePanel } from "@/components/offer/offer-guide-panel";
import { JsonLd } from "@/components/seo/json-ld";
import { DetailHero } from "@/components/ui/detail-hero";
import { Prose } from "@/components/ui/prose";
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

export default async function OfferPage({ params }: Params) {
  const data = await load(await params);
  if (!data) notFound();
  const { info, offer } = data;
  const where = offer.city ? `${offer.city.name}, ${offer.country.name}` : offer.country.name;

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

      <DetailHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: info.name, href: sectionPath(info.slug) },
          { label: offer.country.name, href: sectionCountryPath(info.slug, offer.country.slug) },
          { label: offer.name },
        ]}
        eyebrow={where}
        title={offer.name}
        description={offer.summary}
        media={null}
        imageKeys={[offer.city?.slug, offer.country.slug]}
      />

      <Container width="wide">
        <div className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <article>
            <Prose text={offer.body} />
          </article>
          <aside className="flex h-fit flex-col gap-6 lg:sticky lg:top-24">
            <OfferGuidePanel item={offer} />
          </aside>
        </div>
      </Container>
    </>
  );
}
