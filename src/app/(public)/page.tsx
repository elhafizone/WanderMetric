import { BadgeCheck, CalendarCheck, PenLine, Scale, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Band, Container } from "@/components/layout/container";
import { OfferCard } from "@/components/offer/offer-card";
import { SearchModule } from "@/components/search/search-module";
import { CountryTabs } from "@/components/section/country-tabs";
import { SectionIcon } from "@/components/section/section-icon";
import { SectionHeader } from "@/components/ui/section";
import { countOffersBySection, listCountriesWithOffers, listOffers } from "@/core/offers/offers";
import { SECTIONS, countryHubPath, sectionPath } from "@/core/sections/sections";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { loadSearchModuleData } from "@/lib/search-module-data";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = buildMetadata({
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  path: "/",
});

/** Revalidate hourly: the home page changes whenever an offer is published. */
export const revalidate = 3600;

const TRUST = ["No invented prices or reviews", "You book directly with the partner"];

const PILLARS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: Scale, title: "Honest numbers", text: "Real partner prices or nothing. Never made up." },
  { icon: PenLine, title: "Independent", text: "Partners can’t buy a recommendation." },
  { icon: CalendarCheck, title: "Kept current", text: "Each guide shows when its details were read." },
];

export default async function HomePage() {
  const db = createSupabasePublicClient();

  const [offers, countries, counts, search] = await Promise.all([
    listOffers(db, { perPage: 6 }),
    listCountriesWithOffers(db),
    countOffersBySection(db),
    loadSearchModuleData(db),
  ]);

  const latest = offers.ok ? offers.data.items : [];
  const perSection = counts.ok ? counts.data : {};

  return (
    <>
      <section className="bg-bg-tint border-border border-b">
        <Container className="flex flex-col gap-5 pt-6 pb-6 sm:gap-7 sm:pt-10 sm:pb-10 lg:pt-14 lg:pb-12">
          <div className="flex max-w-[51rem] flex-col gap-3">
            <h1 className="display text-[2rem]/[2.25rem] tracking-[-0.03em] sm:text-[2.75rem]/[3rem] lg:text-[3.75rem]/[4rem]">
              Compare the trip. Book direct with partners you can trust.
            </h1>
            <p className="text-ink-soft text-base/6 font-medium sm:text-[1.125rem]/7">
              Tours, flights, car rentals, transfers, eSIMs, insurance and more. No invented
              prices.
            </p>
          </div>

          <SearchModule partners={search.partners} airports={search.airports} />

          <ul className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-7 sm:gap-y-2">
            {TRUST.map((line) => (
              <li
                key={line}
                className="text-ink-soft flex items-center gap-2 text-[0.8125rem] font-bold sm:text-sm"
              >
                <BadgeCheck aria-hidden="true" className="text-success h-[1.125rem] w-[1.125rem]" />
                {line}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container className="flex flex-col gap-5 pt-12 sm:gap-6 sm:pt-16">
        <SectionHeader title="Browse by section" description="Ten ways to plan a trip." />
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {SECTIONS.map((section) => {
            const count = perSection[section.slug] ?? 0;
            return (
              <li key={section.slug}>
                <Link
                  href={sectionPath(section.slug)}
                  className="border-border bg-surface hover:border-border-strong flex h-full flex-col gap-2 rounded-lg border p-4 transition-colors"
                >
                  <SectionIcon icon={section.icon} className="text-accent h-6 w-6" />
                  <span className="text-[1rem]/6 font-extrabold">{section.name}</span>
                  <span className="text-ink-muted mt-auto text-sm">
                    {count > 0 ? `${count} ${count === 1 ? "guide" : "guides"}` : "Providers and tips"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>

      {countries.ok && countries.data.length > 0 && (
        <Container className="flex flex-col gap-4 pt-12 sm:pt-14">
          <SectionHeader title="Browse by country" description="Every section, filtered to one country." />
          <CountryTabs
            countries={countries.data}
            allHref="/"
            hrefFor={countryHubPath}
            label="Countries"
          />
        </Container>
      )}

      {latest.length > 0 && (
        <Container className="flex flex-col gap-5 pt-12 sm:gap-6 sm:pt-16">
          <SectionHeader title="Latest guides" description="Written from each partner’s own listing." />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((offer) => (
              <li key={offer.id}>
                <OfferCard offer={offer} />
              </li>
            ))}
          </ul>
        </Container>
      )}

      <Band className="mt-12 sm:mt-16">
        <Container className="py-10 sm:py-14">
          <ul className="grid gap-6 sm:grid-cols-3">
            {PILLARS.map((pillar) => (
              <li key={pillar.title} className="flex gap-3">
                <pillar.icon aria-hidden="true" className="text-accent mt-0.5 h-6 w-6 shrink-0" />
                <div>
                  <h3 className="text-base font-extrabold">{pillar.title}</h3>
                  <p className="text-ink-soft text-sm/[1.55]">{pillar.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Band>
    </>
  );
}
