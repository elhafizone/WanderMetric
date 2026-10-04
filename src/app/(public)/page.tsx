import {
  BadgeCheck,
  Bus,
  CalendarCheck,
  Car,
  ChevronRight,
  PenLine,
  Plane,
  Scale,
  ShieldCheck,
  Smartphone,
  Sun,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Band, Container } from "@/components/layout/container";
import { SearchModule } from "@/components/search/search-module";
import { ArticleTile } from "@/components/ui/article-tile";
import { ContentCard } from "@/components/ui/card";
import { DealTile } from "@/components/ui/deal-tile";
import { SectionHeader } from "@/components/ui/section";
import {
  listDeals,
  listDestinations,
  listFlightRoutes,
  listGuides,
} from "@/core/content/queries";
import type { DestinationCard } from "@/core/content/types";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { destinationPath, flightRoutePath } from "@/lib/paths";
import { loadSearchModuleData } from "@/lib/search-module-data";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = buildMetadata({
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  path: "/",
});

/**
 * Revalidate hourly. The home page aggregates several listings, so it changes
 * whenever anything is published; an hour keeps it fresh without rebuilding on
 * every request.
 */
export const revalidate = 3600;

/**
 * Image keys for a destination, most specific first: the city where there is
 * one, otherwise the country. `resolveImage` walks them in order, so a Lisbon
 * card gets the Lisbon photograph and a country overview falls back only as far
 * as an image of that country — never to a picture of somewhere else.
 */
function keysFor(destination: Pick<DestinationCard, "city" | "country">) {
  return [destination.city?.slug, destination.country.slug];
}

const TRUST = [
  "No invented prices or reviews",
  "You book directly with the partner",
];

const ESSENTIALS: Array<{ href: string; icon: LucideIcon; label: string; text: string }> = [
  { href: "/flights", icon: Plane, label: "Flights", text: "Search fares across partners" },
  { href: "/car-hire", icon: Car, label: "Car hire", text: "Providers and what to check" },
  { href: "/transfers", icon: Bus, label: "Airport transfers", text: "Shared and private rides" },
  { href: "/activities", icon: Ticket, label: "Things to do", text: "Tours, tickets, day trips" },
  { href: "/esim", icon: Smartphone, label: "eSIMs", text: "Data before you land" },
  { href: "/insurance", icon: ShieldCheck, label: "Travel insurance", text: "Cover explained plainly" },
];

const PILLARS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: Scale, title: "Honest numbers", text: "Real partner prices or nothing. Never made up." },
  { icon: PenLine, title: "Independent", text: "Partners can’t buy a recommendation." },
  { icon: CalendarCheck, title: "Kept current", text: "Each guide shows when it was last updated." },
];

/** A best-time fact is only worth a card line when it is short enough to read. */
function bestTimeFact(destination: DestinationCard) {
  const text = destination.best_time?.trim();
  if (!text || text.length > 34) return [];
  return [{ icon: <Sun aria-hidden="true" className="h-4 w-4" />, text: `Best ${text}` }];
}

export default async function HomePage() {
  const db = createSupabasePublicClient();

  // Independent queries, so run them concurrently rather than in series.
  const [destinations, guides, flights, deals, search] = await Promise.all([
    listDestinations(db, { featuredOnly: true, perPage: 4 }),
    listGuides(db, { perPage: 3 }),
    listFlightRoutes(db, { perPage: 8 }),
    listDeals(db, { perPage: 4 }),
    loadSearchModuleData(db),
  ]);

  const featured = destinations.ok ? destinations.data.items : [];
  const latestGuides = guides.ok ? guides.data.items : [];
  const routes = flights.ok ? flights.data.items : [];
  const currentDeals = deals.ok ? deals.data.items : [];

  return (
    <>
      <section className="bg-bg-tint border-border border-b">
        <Container className="flex flex-col gap-5 pt-6 pb-6 sm:gap-7 sm:pt-10 sm:pb-10 lg:pt-14 lg:pb-12">
          <div className="flex max-w-[51rem] flex-col gap-3">
            <h1 className="display text-[2rem]/[2.25rem] tracking-[-0.03em] sm:text-[2.75rem]/[3rem] lg:text-[3.75rem]/[4rem]">
              Compare the trip. Book direct with partners you can trust.
            </h1>
            <p className="text-ink-soft text-base/6 font-medium sm:text-[1.125rem]/7">
              Flights, car hire, transfers, tours, eSIMs and insurance. No invented
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

      {featured.length > 0 && (
        <Container className="flex flex-col gap-5 pt-12 sm:gap-6 sm:pt-16">
          <SectionHeader
            title="Popular destinations"
            description="Places we have researched properly."
            href="/destinations"
            linkLabel="All destinations"
          />
          <div className="-mx-4 grid auto-cols-[15rem] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {featured.map((destination, index) => (
              <ContentCard
                key={destination.id}
                href={destinationPath(destination)}
                title={destination.city?.name ?? destination.title}
                eyebrow={destination.country.name}
                media={destination.hero}
                imageKeys={keysFor(destination)}
                facts={bestTimeFact(destination)}
                priority={index < 2}
              />
            ))}
          </div>
        </Container>
      )}

      {currentDeals.length > 0 && (
        <Container className="flex flex-col gap-5 pt-12 sm:gap-6 sm:pt-16">
          <SectionHeader
            title="Deals ending soon"
            description="Every deal shows when it ends. Expired ones disappear on their own."
            href="/deals"
            linkLabel="All deals"
          />
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {currentDeals.map((deal) => (
              <DealTile key={deal.id} deal={deal} />
            ))}
          </div>
        </Container>
      )}

      <Container className="grid gap-10 pt-12 sm:pt-16 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-10">
        {routes.length > 0 && (
          <div className="flex flex-col gap-4">
            <SectionHeader title="Route guides" href="/flights" linkLabel="All routes" />
            <ul className="border-border bg-surface grid overflow-hidden rounded-lg border sm:grid-cols-2">
              {routes.map((route) => (
                <li key={route.id} className="border-border border-r-0 border-b sm:[&:nth-child(odd)]:border-r">
                  <Link
                    href={flightRoutePath(route)}
                    className="hover:bg-bg flex min-h-[4.25rem] items-center gap-3 px-4 py-2.5 transition-colors sm:px-[1.125rem]"
                  >
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="text-base/[1.375rem] font-bold">
                        {route.origin.name} → {route.destination.name}
                      </span>
                      {route.origin.iata_code && route.destination.iata_code && (
                        <span className="text-ink-muted text-[0.8125rem]/[1.125rem] tabular-nums">
                          {route.origin.iata_code} → {route.destination.iata_code}
                        </span>
                      )}
                    </span>
                    <ChevronRight aria-hidden="true" className="text-ink-muted h-[1.125rem] w-[1.125rem]" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={`flex flex-col gap-4 ${routes.length === 0 ? "lg:col-span-2" : ""}`}>
          <SectionHeader title="Travel essentials" />
          <ul className={`grid grid-cols-2 gap-2.5 sm:gap-3 ${routes.length === 0 ? "lg:grid-cols-3" : ""}`}>
            {ESSENTIALS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="border-border bg-surface hover:border-accent flex h-full items-center gap-2.5 rounded-md border px-3 py-2 transition-colors sm:flex-col sm:items-start sm:gap-2.5 sm:rounded-lg sm:p-4"
                >
                  <span className="bg-accent-soft text-accent hidden h-10 w-10 items-center justify-center rounded-[0.625rem] sm:flex">
                    <item.icon aria-hidden="true" className="h-[1.375rem] w-[1.375rem]" />
                  </span>
                  <item.icon aria-hidden="true" className="text-accent h-5 w-5 shrink-0 sm:hidden" />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm/[1.125rem] font-extrabold sm:text-[0.9375rem]/5">
                      {item.label}
                    </span>
                    <span className="text-ink-muted hidden text-[0.8125rem]/[1.125rem] sm:block">
                      {item.text}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {latestGuides.length > 0 && (
        <Container className="flex flex-col gap-5 pt-12 sm:gap-6 sm:pt-16">
          <SectionHeader
            title="Guides that get to the point"
            href="/guides"
            linkLabel="All guides"
          />
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {latestGuides.map((guide) => (
              <ArticleTile key={guide.id} guide={guide} />
            ))}
          </div>
        </Container>
      )}

      <div className="mt-14 sm:mt-[4.5rem]">
        <Band tone="lagoon" padding="tight">
          <div className="grid gap-6 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-center lg:gap-8">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="flex items-start gap-3">
                <pillar.icon aria-hidden="true" className="text-accent h-6 w-6 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <strong className="text-[0.9375rem]/5 font-extrabold">{pillar.title}</strong>
                  <span className="text-ink-soft text-sm/5">{pillar.text}</span>
                </div>
              </div>
            ))}
            <Link
              href="/affiliate-disclosure"
              className="border-accent bg-surface text-ink hover:bg-accent-soft flex min-h-11 items-center justify-center rounded-md border-[1.5px] px-4 text-sm font-extrabold whitespace-nowrap transition-colors"
            >
              How we make money
            </Link>
          </div>
        </Band>
      </div>
    </>
  );
}
