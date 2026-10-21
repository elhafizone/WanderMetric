import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { OfferCard } from "@/components/offer/offer-card";
import { HeaderPhoto } from "@/components/ui/header-photo";
import { PageHeader, SectionHeader } from "@/components/ui/section";
import { listCitiesWithOffers, listOffers, offerCardPhoto } from "@/core/offers/offers";
import { SECTIONS, sectionCountryPath } from "@/core/sections/sections";
import { buildMetadata } from "@/core/seo/metadata";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

interface Params {
  params: Promise<{ country: string }>;
}

async function load(countrySlug: string) {
  const result = await listOffers(createSupabasePublicClient(), { countrySlug, perPage: 100 });
  if (!result.ok || result.data.items.length === 0) return null;
  return result.data.items;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { country: slug } = await params;
  const offers = await load(slug);
  const path = `/countries/${slug}`;
  if (!offers) return buildMetadata({ title: "Not found", description: "", path, noIndex: true });

  const name = offers[0]?.country.name ?? slug;
  return buildMetadata({
    title: `Travel offers in ${name}`,
    description: `Tours, transfers, car rentals, eSIMs and more in ${name}, each guide written from the partner's own listing.`,
    path,
    noIndex: offers.length < 3,
  });
}

export default async function CountryHubPage({ params }: Params) {
  const { country: slug } = await params;
  const offers = await load(slug);
  if (!offers) notFound();

  const name = offers[0]?.country.name ?? slug;
  const citiesResult = await listCitiesWithOffers(createSupabasePublicClient(), slug);
  const cities = citiesResult.ok ? citiesResult.data : [];
  const groups = SECTIONS.map((section) => ({
    section,
    offers: offers.filter((offer) => offer.section === section.slug),
  })).filter((group) => group.offers.length > 0);
  const photo = offers.map((offer) => offerCardPhoto(offer)).find((found) => found !== null);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: name }]}
        title={`Travel offers in ${name}`}
        description={`Everything we have published for ${name}, by section.`}
      >
        <HeaderPhoto photo={photo} />
      </PageHeader>
      <Container className="flex flex-col gap-16 pt-10 pb-20 sm:gap-24 sm:pt-14 sm:pb-28">
        {cities.length > 0 && (
          <section className="flex flex-col gap-8">
            <h2 className="display-sm text-[1.75rem]/[1.1]">Cities in {name}</h2>
            <ul className="flex flex-wrap gap-2">
              {cities.map((city) => (
                <li key={city.id}>
                  <Link
                    href={`/countries/${slug}/${city.slug}`}
                    className="border-border-strong text-ink hover:border-ink hover:bg-surface inline-flex min-h-10 items-center rounded-full border px-4 text-[0.9375rem] font-semibold transition-colors"
                  >
                    {city.name} · {city.offerCount}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {groups.map(({ section, offers: sectionOffers }) => (
          <section key={section.slug} className="flex flex-col gap-4">
            <SectionHeader
              title={section.name}
              href={sectionCountryPath(section.slug, slug)}
              linkLabel={`All ${section.shortName.toLowerCase()} in ${name}`}
            />
            <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
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
