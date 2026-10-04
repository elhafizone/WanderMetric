import { Bus, Car, ChevronRight, Luggage, ShieldCheck, Smartphone, CalendarRange } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { SearchModule } from "@/components/search/search-module";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { SectionHeader } from "@/components/ui/section";
import { listFlightRoutes } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { flightRoutePath } from "@/lib/paths";
import { loadSearchModuleData } from "@/lib/search-module-data";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Compare flights",
  description:
    "Search flights across partner sites and book with them. Plus route guides: journey times, which airport to use, and when the train is the better option.",
  path: "/flights",
});

const TIPS = [
  {
    icon: CalendarRange,
    title: "Flexible by a few days?",
    text: "Shifting your dates by a day or two often changes the fare more than the airline does.",
    href: "/guides/finding-cheaper-flights",
  },
  {
    icon: Luggage,
    title: "Check what the fare includes",
    text: "The cheapest fare may exclude a cabin bag or seat selection. Compare the total, not the headline.",
    href: "/guides/finding-cheaper-flights",
  },
  {
    icon: ShieldCheck,
    title: "If your flight goes wrong",
    text: "A long delay or a cancellation can entitle you to compensation. Here is what the EU rules say.",
    href: "/guides/flight-delay-compensation-eu",
  },
];

const NEXT = [
  { href: "/transfers", icon: Bus, label: "Airport transfers" },
  { href: "/car-hire", icon: Car, label: "Car hire" },
  { href: "/esim", icon: Smartphone, label: "eSIM data" },
  { href: "/insurance", icon: ShieldCheck, label: "Travel insurance" },
];

export default async function FlightsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const db = createSupabasePublicClient();
  const [result, search] = await Promise.all([
    listFlightRoutes(db, { page: Number(page) || 1, perPage: 12 }),
    loadSearchModuleData(db),
  ]);

  const items = result.ok ? result.data.items : [];
  const meta = result.ok ? result.data.meta : null;

  return (
    <>
      <div className="bg-bg-tint border-border border-b">
        <Container className="flex flex-col gap-5 pt-5 pb-8 sm:gap-6 sm:pb-10">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Flights" }]} />
          <div>
            <h1 className="display text-[2rem]/[2.25rem] lg:text-[2.75rem]/[3.125rem]">
              Compare flights
            </h1>
            <p className="text-ink-soft mt-2 max-w-[62ch] text-base/6 sm:text-[1.0625rem]/[1.625rem]">
              We search partner sites and send you there to book. No booking fees from us.
            </p>
          </div>
          <SearchModule partners={search.partners} airports={search.airports} initialTab="flights" />
        </Container>
      </div>

      <Container className="flex flex-col gap-12 pt-10 pb-16 sm:gap-14 sm:pt-12 sm:pb-24">
        <section className="flex flex-col gap-4">
          <SectionHeader
            title="Route guides"
            description="Journey times, which airport to use, and when the train is the better call."
          />
          {items.length > 0 ? (
            <>
              <JsonLd
                data={{
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  itemListElement: items.map((item, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: item.title,
                    url: new URL(flightRoutePath(item), site.url).toString(),
                  })),
                }}
              />
              <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={flightRoutePath(item)}
                      className="hover:bg-bg flex min-h-[4.25rem] items-center gap-4 px-4 py-3 transition-colors sm:px-5"
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="text-base/[1.375rem] font-extrabold sm:text-[1.0625rem]">
                          {item.origin.name} → {item.destination.name}
                        </strong>
                        {item.origin.iata_code && item.destination.iata_code && (
                          <span className="text-ink-muted text-[0.8125rem] tabular-nums">
                            {item.origin.iata_code} → {item.destination.iata_code}
                          </span>
                        )}
                      </span>
                      <span className="text-accent hidden items-center gap-1.5 text-sm font-extrabold sm:flex">
                        Read the route guide
                        <ChevronRight aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <ChevronRight aria-hidden="true" className="text-ink-muted h-[1.125rem] w-[1.125rem] sm:hidden" />
                    </Link>
                  </li>
                ))}
              </ul>
              {meta && <Pagination meta={meta} basePath="/flights" />}
            </>
          ) : (
            <EmptyState
              title="Nothing published yet"
              description="Route guides appear here once they are published."
            />
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-3 md:gap-5">
          {TIPS.map((tip) => (
            <Link
              key={tip.title}
              href={tip.href}
              className="border-border bg-surface hover:border-accent flex gap-3.5 rounded-lg border p-5 transition-colors"
            >
              <span className="bg-secondary-soft text-secondary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                <tip.icon aria-hidden="true" className="h-[1.375rem] w-[1.375rem]" />
              </span>
              <span className="flex flex-col gap-1">
                <strong className="text-base/[1.375rem] font-extrabold">{tip.title}</strong>
                <span className="text-ink-soft text-sm/[1.3125rem]">{tip.text}</span>
              </span>
            </Link>
          ))}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="display text-[1.5rem]/[2.125rem]">Sorted the flight? Finish the trip</h2>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {NEXT.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="border-border bg-surface hover:border-accent flex min-h-16 items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
                >
                  <item.icon aria-hidden="true" className="text-accent h-[1.375rem] w-[1.375rem] shrink-0" />
                  <span className="flex-1 text-[0.9375rem] font-extrabold">{item.label}</span>
                  <ChevronRight aria-hidden="true" className="h-[1.125rem] w-[1.125rem]" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </>
  );
}
