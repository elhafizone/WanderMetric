import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { OfferCard } from "@/components/offer/offer-card";
import { PageHeader, SectionHeader } from "@/components/ui/section";
import { listOffers } from "@/core/offers/offers";
import { SECTIONS, sectionCountryPath } from "@/core/sections/sections";
import { buildMetadata } from "@/core/seo/metadata";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

/** A city page is noindex below this many offers, like a country page. */
const MIN_OFFERS_FOR_CITY_PAGE = 3;

interface Params {
  params: Promise<{ country: string; city: string }>;
}

async function load(countrySlug: string, citySlug: string) {
  const result = await listOffers(createSupabasePublicClient(), {
    countrySlug,
    citySlug,
    perPage: 100,
  });
  if (!result.ok || result.data.items.length === 0) return null;
  return result.data.items;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { country, city } = await params;
  const offers = await load(country, city);
  const path = `/countries/${country}/${city}`;
  if (!offers) return buildMetadata({ title: "Not found", description: "", path, noIndex: true });

  const cityName = offers[0]?.city?.name ?? city;
  const countryName = offers[0]?.country.name ?? country;
  return buildMetadata({
    title: `Things to book in ${cityName}, ${countryName}`,
    description: `Tours, transfers, car rentals, eSIMs and more in ${cityName}, each guide written from the partner's own listing.`,
    path,
    noIndex: offers.length < MIN_OFFERS_FOR_CITY_PAGE,
  });
}

export default async function CityHubPage({ params }: Params) {
  const { country, city } = await params;
  const offers = await load(country, city);
  if (!offers) notFound();

  const cityName = offers[0]?.city?.name ?? city;
  const countryName = offers[0]?.country.name ?? country;
  const groups = SECTIONS.map((section) => ({
    section,
    offers: offers.filter((offer) => offer.section === section.slug),
  })).filter((group) => group.offers.length > 0);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Destinations", href: "/countries" },
          { label: countryName, href: `/countries/${country}` },
          { label: cityName },
        ]}
        title={`Things to book in ${cityName}`}
        description={`Everything we have published for ${cityName}, by section.`}
      />
      <Container className="flex flex-col gap-10 pt-6 pb-16 sm:gap-12 sm:pt-8 sm:pb-24">
        {groups.map(({ section, offers: sectionOffers }) => (
          <section key={section.slug} className="flex flex-col gap-4">
            <SectionHeader
              title={section.name}
              href={sectionCountryPath(section.slug, country)}
              linkLabel={`All ${section.shortName.toLowerCase()} in ${countryName}`}
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sectionOffers.map((offer) => (
                <li key={offer.id}>
                  <OfferCard offer={offer} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Container>
    </>
  );
}
