import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PartnerList } from "@/components/category/partner-list";
import { Container } from "@/components/layout/container";
import { OfferCard } from "@/components/offer/offer-card";
import { EmptyState } from "@/components/ui/card";
import { PageHeader, SectionHeader } from "@/components/ui/section";
import { PARTNERS } from "@/core/affiliate/partners";
import { listLiveLinkSlugs } from "@/core/affiliate/search";
import { listDestinations, listOffers, offerCardPhoto } from "@/core/offers/offers";
import { CompareTable } from "@/components/compare/compare-table";
import { CheckCards } from "@/components/section/check-cards";
import { COMPARE } from "@/core/affiliate/compare";
import { formatReadOn } from "@/core/content/offer-facts";
import Image from "next/image";
import { Car } from "lucide-react";
import { FlightHelpGrid } from "@/components/flights/flight-help-grid";
import { FlightSearch, type DestinationCard } from "@/components/flights/flight-search";
import { FLIGHT_HELP, flightHelpSlugs } from "@/core/content/flight-help";
import { routes } from "@/core/seo/site";
import { ThingsToDoStrip, type StripOffer } from "@/components/section/things-to-do-strip";
import { formatDuration } from "@/lib/format";
import {
  SECTION_SLUGS,
  getSection,
  offerPath,
  sectionPath,
} from "@/core/sections/sections";
import { buildMetadata } from "@/core/seo/metadata";
import { loadSearchModuleData } from "@/lib/search-module-data";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return SECTION_SLUGS.map((section) => ({ section }));
}


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

  const [offers, live] = await Promise.all([
    listOffers(db, { section: section.slug, perPage: 48 }),
    partnerSlugs.length > 0 ? listLiveLinkSlugs(db, partnerSlugs) : Promise.resolve(null),
  ]);

  const items = offers.ok ? offers.data.items : [];
  const liveSlugs = live?.ok ? live.data : new Set<string>();
  const partners = section.partnerCategory
    ? PARTNERS[section.partnerCategory].filter((partner) => liveSlugs.has(partner.linkSlug))
    : [];

  if (section.slug === "car-rentals") {
    const data = COMPARE["car-hire"];
    const liveCars = await listLiveLinkSlugs(db, (data?.rows ?? []).map((row) => row.linkSlug));
    const liveSet = liveCars.ok ? liveCars.data : new Set<string>();
    const rows = (data?.rows ?? []).filter((row) => liveSet.has(row.linkSlug));
    const viewRows = rows.map((row) => ({
      linkSlug: row.linkSlug,
      name: row.name,
      kind: row.kind,
      logo: row.logo ?? null,
      values: row.values,
      sourceUrl: row.sourceUrl,
      href: `${routes.affiliateRedirect(row.linkSlug)}?${new URLSearchParams({
        c: "car-rentals",
        from: sectionPath(section.slug),
      }).toString()}`,
    }));
    const freeCancel = rows.filter((r) => /free/i.test(r.values.cancellation ?? "")).length;
    const roundTheClock = rows.filter((r) => /24\/7/.test(r.values.support ?? "")).length;
    const stats = [
      { value: String(rows.length), label: "providers compared" },
      { value: String(freeCancel), label: "state free cancellation" },
      { value: String(roundTheClock), label: "state 24/7 support" },
    ];

    return (
      <>
        <PageHeader
          crumbs={[{ label: "Home", href: "/" }, { label: section.name }]}
          title={section.name}
          description={section.summary}
        />
        <Container className="flex flex-col gap-16 pt-10 pb-20 sm:gap-24 sm:pt-14 sm:pb-28">
          {rows.length > 0 && data ? (
            <section aria-labelledby="providers" className="flex flex-col gap-6">
              <div className="bg-accent-soft flex flex-col gap-6 rounded-3xl p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex max-w-xl flex-col gap-3">
                  <span className="bg-accent text-accent-contrast grid size-12 place-items-center rounded-2xl">
                    <Car aria-hidden className="size-6" />
                  </span>
                  <h2 id="providers" className="display text-[1.75rem]/[2rem] sm:text-[2.25rem]/[2.5rem]">
                    Compare before you rent
                  </h2>
                  <p className="text-ink-soft text-base/[1.625rem]">
                    The same questions put to each provider, answered from its own website. You book
                    with the provider.
                  </p>
                  <ul className="flex -space-x-2 pt-1" aria-label="Providers compared">
                    {rows.map((row) =>
                      row.logo ? (
                        <li
                          key={row.linkSlug}
                          className="border-surface bg-surface grid size-10 place-items-center overflow-hidden rounded-full border-2 p-1.5"
                        >
                          <Image
                            src={row.logo}
                            alt={row.name}
                            width={28}
                            height={28}
                            unoptimized
                            className="size-7 object-contain"
                          />
                        </li>
                      ) : null,
                    )}
                  </ul>
                </div>
                <dl className="grid grid-cols-3 gap-3 lg:w-[26rem]">
                  {stats.map((stat) => (
                    <div key={stat.label} className="bg-surface rounded-2xl p-4">
                      <dd className="display text-[2rem]/[2.25rem]">{stat.value}</dd>
                      <dt className="text-ink-soft mt-1 text-[0.8125rem]/[1.2rem] font-medium">
                        {stat.label}
                      </dt>
                    </div>
                  ))}
                </dl>
              </div>
              <CompareTable
                criteria={data.criteria}
                rows={viewRows}
                readOn={formatReadOn(data.rows[0]?.readOn)}
              />
            </section>
          ) : (
            <EmptyState
              title="No providers are available right now"
              description="We list a provider only while its link works. Check back soon."
            />
          )}

          {items.length > 0 && (
            <section className="flex flex-col gap-8">
              <SectionHeader
                title="Guides and offers"
                description="What each listing includes, written from the partner's own details. You book with the partner."
              />
              <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((offer) => (
                  <li key={offer.id}>
                    <OfferCard offer={offer} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <CheckCards title={section.checklistTitle} items={section.checklist} />
        </Container>
      </>
    );
  }

  if (section.slug === "flights") {
    const [searchData, destinations, live] = await Promise.all([
      loadSearchModuleData(db),
      listDestinations(db),
      listLiveLinkSlugs(db, flightHelpSlugs()),
    ]);
    const flightPartner = searchData.partners.find((partner) => partner.key === "flights");

    // A destination card is a city we have an airport code for and a partner
    // photograph of, taken from one of its own offers.
    const cards: DestinationCard[] = [];
    for (const country of destinations.ok ? destinations.data : []) {
      for (const city of country.cities) {
        const airport = searchData.airports.find(
          (a) => a.city.toLowerCase() === city.name.toLowerCase(),
        );
        if (airport && city.photo) {
          cards.push({
            code: airport.code,
            city: city.name,
            country: country.name,
            offerCount: city.offerCount,
            photo: { url: city.photo.url, alt: city.photo.alt, credit: city.photo.credit },
          });
        }
      }
    }
    cards.sort((a, b) => b.offerCount - a.offerCount || a.city.localeCompare(b.city));

    return (
      <>
        <PageHeader
          crumbs={[{ label: "Home", href: "/" }, { label: section.name }]}
          title={section.name}
          description="Search fares across airlines and agencies, then book with the seller. Below: the answers travellers look for before and after a flight."
        />
        <Container className="flex flex-col gap-16 pt-10 pb-20 sm:gap-24 sm:pt-14 sm:pb-28">
          {flightPartner ? (
            <FlightSearch
              action={routes.affiliateRedirect(flightPartner.linkSlug)}
              partner={flightPartner.partner}
              airports={searchData.airports}
              destinations={cards.slice(0, 4)}
            />
          ) : null}
          <FlightHelpGrid items={FLIGHT_HELP} liveSlugs={live.ok ? live.data : new Set<string>()} />
        </Container>
      </>
    );
  }

  if (section.slug === "tours-activities") {
    const strip: StripOffer[] = items.map((offer) => ({
      id: offer.id,
      name: offer.name,
      href: offerPath(offer.section, offer.country.slug, offer.slug),
      place: offer.city?.name ?? offer.country.name,
      placeKey: offer.city?.slug ?? offer.country.slug,
      section: offer.section,
      duration: formatDuration(offer.duration_minutes),
      provider: offer.program.name,
      photo: offerCardPhoto(offer),
    }));

    return (
      <>
        <PageHeader
          crumbs={[{ label: "Home", href: "/" }, { label: section.name }]}
          title={section.name}
          description={section.summary}
        />
        <Container className="pt-10 pb-20 sm:pt-14 sm:pb-28">
          {strip.length > 0 ? (
            <ThingsToDoStrip offers={strip} />
          ) : (
            <EmptyState
              title="Guides for this section are on the way"
              description="We publish a guide only when it has real details from the partner's listing."
            />
          )}
        </Container>
      </>
    );
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: section.name }]}
        title={section.name}
        description={section.summary}
      />

      <Container className="flex flex-col gap-16 pt-10 pb-20 sm:gap-24 sm:pt-14 sm:pb-28">
        {items.length > 0 ? (
          <ThingsToDoStrip
            title={`${section.shortName} guides and offers`}
            offers={items.map((offer) => ({
              id: offer.id,
              name: offer.name,
              href: offerPath(offer.section, offer.country.slug, offer.slug),
              place: offer.city?.name ?? offer.country.name,
              placeKey: offer.city?.slug ?? offer.country.slug,
              section: offer.section,
              duration: formatDuration(offer.duration_minutes),
              provider: offer.program.name,
              photo: offerCardPhoto(offer),
            }))}
          />
        ) : (
          <EmptyState
            title="Guides for this section are on the way"
            description="We publish a guide only when it has real details from the partner's listing."
          />
        )}

        {partners.length > 0 && (
          <section className="flex flex-col gap-8">
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

        <CheckCards title={section.checklistTitle} items={section.checklist} />
      </Container>
    </>
  );
}
