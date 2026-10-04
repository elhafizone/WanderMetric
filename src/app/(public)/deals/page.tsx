import { Clock, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/card";
import { DealTile } from "@/components/ui/deal-tile";
import { Pagination } from "@/components/ui/pagination";
import { listDeals } from "@/core/content/queries";
import type { DealCard } from "@/core/content/types";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { dealEnds } from "@/lib/format";
import { dealPath } from "@/lib/paths";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Travel deals, checked",
  description:
    "Partner offers we have reviewed. Each one shows when it ends, and expired deals disappear on their own.",
  path: "/deals",
});

const KIND_TAB: Record<DealCard["kind"], string> = {
  activity: "Things to do",
  tour: "Tours",
  flight: "Flights",
  hotel: "Stays",
  package: "Packages",
  other: "Other",
};

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; kind?: string }>;
}) {
  const { page, kind } = await searchParams;
  const db = createSupabasePublicClient();
  const result = await listDeals(db, { page: Number(page) || 1, perPage: 48 });

  const all = result.ok ? result.data.items : [];
  const meta = result.ok ? result.data.meta : null;

  // Tabs come from the deals that exist: a tab with nothing behind it would
  // promise a category we cannot fill.
  const kinds = [...new Set(all.map((deal) => deal.kind))];
  const active = kinds.find((k) => k === kind) ?? null;
  const items = active ? all.filter((deal) => deal.kind === active) : all;

  // Soonest first, so the 48-hour group leads and the rest keep date order.
  const byEnd = [...items].sort(
    (a, b) =>
      (a.ends_at ? new Date(a.ends_at).getTime() : Infinity) -
      (b.ends_at ? new Date(b.ends_at).getTime() : Infinity),
  );
  const urgent = byEnd.filter((deal) => dealEnds(deal.ends_at)?.urgent);
  const rest = byEnd.filter((deal) => !dealEnds(deal.ends_at)?.urgent);

  const tab = (label: string, href: string, on: boolean) => (
    <Link
      key={href}
      href={href}
      aria-current={on ? "page" : undefined}
      className={`relative flex h-12 shrink-0 items-center px-3.5 text-[0.9375rem] transition-colors ${
        on ? "text-accent font-extrabold" : "text-ink-soft hover:text-ink font-semibold"
      }`}
    >
      {label}
      {on && (
        <span aria-hidden="true" className="bg-accent absolute inset-x-2 bottom-0 h-[3px] rounded-t-[3px]" />
      )}
    </Link>
  );

  return (
    <>
      <div className="bg-bg-tint border-border border-b">
        <Container className="flex flex-col gap-4 pt-5">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Deals" }]} />
          <div className="max-w-[45rem]">
            <h1 className="display text-[2rem]/[2.25rem] lg:text-[2.75rem]/[3.125rem]">
              Travel deals, checked
            </h1>
            <p className="text-ink-soft mt-2 text-base/6 sm:text-[1.0625rem]/[1.625rem]">
              Partner offers we have reviewed. Each one shows when it ends, and expired
              deals disappear on their own.
            </p>
          </div>
          {kinds.length > 1 && (
            <nav aria-label="Deal categories" className="-mx-4 flex overflow-x-auto px-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
              {tab("All deals", "/deals", !active)}
              {kinds.map((k) => tab(KIND_TAB[k], `/deals?kind=${k}`, active === k))}
            </nav>
          )}
        </Container>
      </div>

      <Container className="flex flex-col gap-12 pt-8 pb-16 sm:pt-9 sm:pb-24">
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
                  url: new URL(dealPath(item.slug), site.url).toString(),
                })),
              }}
            />

            {urgent.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="bg-ember-soft text-ember flex h-9 w-9 items-center justify-center rounded-[0.625rem]">
                    <Clock aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <h2 className="display text-[1.5rem]/[2.125rem]">Ends within 48 hours</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
                  {urgent.map((deal) => (
                    <DealTile key={deal.id} deal={deal} />
                  ))}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="display text-[1.5rem]/[2.125rem]">
                  {urgent.length > 0 ? "More live deals" : "Live deals"}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
                  {rest.map((deal) => (
                    <DealTile key={deal.id} deal={deal} />
                  ))}
                </div>
              </section>
            )}

            {meta && <Pagination meta={meta} basePath="/deals" />}
          </>
        ) : (
          <EmptyState
            title="No deals are running right now"
            description="We only list a deal when a partner offers a real discount, and expired deals are removed automatically, so this page never shows a stale offer."
          />
        )}

        <section className="grid gap-5 md:grid-cols-2">
          <div className="border-border-strong bg-surface flex gap-4 rounded-lg border border-dashed p-6 sm:p-7">
            <span className="bg-bg-tint text-ink-soft flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <ShieldCheck aria-hidden="true" className="h-[1.375rem] w-[1.375rem]" />
            </span>
            <div className="flex flex-col gap-1.5">
              <strong className="text-[1.0625rem] font-extrabold">Looking for cover instead?</strong>
              <span className="text-ink-soft text-[0.9375rem]/[1.375rem]">
                Insurance deals are rare. Compare regular policies and what they cover.
              </span>
              <Link
                href="/insurance"
                className="text-accent flex min-h-11 items-center text-sm font-extrabold underline underline-offset-2"
              >
                Compare travel insurance
              </Link>
            </div>
          </div>
          <div className="bg-band-sand flex flex-col gap-2 rounded-lg p-6 sm:p-7">
            <strong className="text-[1.0625rem] font-extrabold">How we pick deals</strong>
            <ul className="text-ink-soft list-disc pl-5 text-[0.9375rem]/6">
              <li>The discount must be visible on the partner&rsquo;s own site.</li>
              <li>Every deal has an end date. Expired deals are removed.</li>
              <li>Sponsored placements are labelled and never ranked first by default.</li>
            </ul>
          </div>
        </section>
      </Container>
    </>
  );
}
