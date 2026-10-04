import { Check } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PartnerList } from "@/components/category/partner-list";
import { Container } from "@/components/layout/container";
import { OfferCard } from "@/components/offer/offer-card";
import { SearchModule, type TabKey } from "@/components/search/search-module";
import { CountryTabs } from "@/components/section/country-tabs";
import { EmptyState } from "@/components/ui/card";
import { PageHeader, SectionHeader } from "@/components/ui/section";
import { PARTNERS } from "@/core/affiliate/partners";
import { listLiveLinkSlugs } from "@/core/affiliate/search";
import { listCountriesWithOffers, listOffers } from "@/core/offers/offers";
import {
  SECTION_SLUGS,
  getSection,
  sectionCountryPath,
  sectionPath,
  type SectionSlug,
} from "@/core/sections/sections";
import { buildMetadata } from "@/core/seo/metadata";
import { loadSearchModuleData } from "@/lib/search-module-data";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return SECTION_SLUGS.map((section) => ({ section }));
}

/** The search tab each section opens, where the search module offers one. */
const SEARCH_TAB: Partial<Record<SectionSlug, TabKey>> = {
  flights: "flights",
  "car-rentals": "cars",
  transfers: "transfers",
  "tours-activities": "activities",
  "sim-cards": "esim",
};

interface Params {
  params: Promise<{ section: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { section: slug } = await params;
  const section = getSection(slug);
  if (!section) {
    return buildMetadata({ title: "Not found", description: "", path: `/${slug}`, noIndex: true });
  }

  return buildMetadata({
    title: section.name,
    description: section.summary,
    path: sectionPath(section.slug),
  });
}

export default async function SectionPage({ params }: Params) {
  const { section: slug } = await params;
  const section = getSection(slug);
  if (!section) notFound();

  const db = createSupabasePublicClient();
  const partnerSlugs = section.partnerCategory
    ? PARTNERS[section.partnerCategory].map((partner) => partner.linkSlug)
    : [];
  const searchTab = SEARCH_TAB[section.slug];

  const [offers, countries, live, search] = await Promise.all([
    listOffers(db, { section: section.slug, perPage: 48 }),
    listCountriesWithOffers(db, section.slug),
    partnerSlugs.length > 0 ? listLiveLinkSlugs(db, partnerSlugs) : Promise.resolve(null),
    searchTab ? loadSearchModuleData(db) : Promise.resolve(null),
  ]);

  const items = offers.ok ? offers.data.items : [];
  const liveSlugs = live?.ok ? live.data : new Set<string>();
  const partners = section.partnerCategory
    ? PARTNERS[section.partnerCategory].filter((partner) => liveSlugs.has(partner.linkSlug))
    : [];

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: section.name }]}
        title={section.name}
        description={section.summary}
      />

      <Container className="flex flex-col gap-10 pt-6 pb-16 sm:gap-12 sm:pt-8 sm:pb-24">
        {search && searchTab && (
          <SearchModule partners={search.partners} airports={search.airports} initialTab={searchTab} />
        )}

        <section className="flex flex-col gap-4">
          <SectionHeader
            title="Guides and offers"
            description="What each listing includes, written from the partner's own details. You book with the partner."
          />
          <CountryTabs
            countries={countries.ok ? countries.data : []}
            allHref={sectionPath(section.slug)}
            hrefFor={(country) => sectionCountryPath(section.slug, country)}
          />
          {items.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((offer) => (
                <li key={offer.id}>
                  <OfferCard offer={offer} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Guides for this section are on the way"
              description="We publish a guide only when it has real details from the partner's listing."
            />
          )}
        </section>

        {partners.length > 0 && (
          <section className="flex flex-col gap-4">
            <SectionHeader
              title="Providers we work with"
              description="Compare on their sites. You book with the provider."
            />
            <PartnerList
              partners={partners}
              campaign={section.slug}
              fromPath={sectionPath(section.slug)}
            />
          </section>
        )}

        <section className="border-border bg-surface flex flex-col gap-3 rounded-lg border p-5 sm:p-6">
          <h2 className="display-sm text-xl">{section.checklistTitle}</h2>
          <ul className="flex flex-col gap-2.5">
            {section.checklist.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-base/6">
                <Check
                  aria-hidden="true"
                  className="text-accent mt-1 h-[1.125rem] w-[1.125rem] shrink-0"
                />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </>
  );
}
