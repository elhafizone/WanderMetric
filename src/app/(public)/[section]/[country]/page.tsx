import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { OfferCard } from "@/components/offer/offer-card";
import { CountryTabs } from "@/components/section/country-tabs";
import { PageHeader } from "@/components/ui/section";
import { listCountriesWithOffers, listOffers } from "@/core/offers/offers";
import {
  MIN_OFFERS_FOR_COUNTRY_PAGE,
  getSection,
  sectionCountryPath,
  sectionPath,
} from "@/core/sections/sections";
import { buildMetadata } from "@/core/seo/metadata";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

interface Params {
  params: Promise<{ section: string; country: string }>;
}

async function load(sectionSlug: string, countrySlug: string) {
  const section = getSection(sectionSlug);
  if (!section) return null;
  const db = createSupabasePublicClient();
  const [offers, countries] = await Promise.all([
    listOffers(db, { section: section.slug, countrySlug, perPage: 100 }),
    listCountriesWithOffers(db, section.slug),
  ]);
  if (!offers.ok || offers.data.items.length === 0) return null;
  return { section, offers: offers.data.items, countries: countries.ok ? countries.data : [] };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { section: sectionSlug, country: countrySlug } = await params;
  const data = await load(sectionSlug, countrySlug);
  const path = `/${sectionSlug}/${countrySlug}`;
  if (!data) return buildMetadata({ title: "Not found", description: "", path, noIndex: true });

  const country = data.offers[0]?.country.name ?? countrySlug;
  return buildMetadata({
    title: `${data.section.name} in ${country}`,
    description: `${data.section.name} in ${country}: guides written from each partner's listing, with what is included and what to check before you book.`,
    path,
    // A country page with only a couple of offers is too thin to index.
    noIndex: data.offers.length < MIN_OFFERS_FOR_COUNTRY_PAGE,
  });
}

export default async function SectionCountryPage({ params }: Params) {
  const { section: sectionSlug, country: countrySlug } = await params;
  const data = await load(sectionSlug, countrySlug);
  if (!data) notFound();

  const country = data.offers[0]?.country.name ?? countrySlug;

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: data.section.name, href: sectionPath(data.section.slug) },
          { label: country },
        ]}
        title={`${data.section.name} in ${country}`}
        description={data.section.summary}
      />
      <Container className="flex flex-col gap-6 pt-10 pb-20 sm:pt-14 sm:pb-28">
        <CountryTabs
          countries={data.countries}
          allHref={sectionPath(data.section.slug)}
          hrefFor={(slug) => sectionCountryPath(data.section.slug, slug)}
          activeSlug={countrySlug}
        />
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {data.offers.map((offer) => (
            <li key={offer.id}>
              <OfferCard offer={offer} />
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
