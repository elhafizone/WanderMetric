import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/section";
import { listCountriesWithOffers } from "@/core/offers/offers";
import { countryHubPath } from "@/core/sections/sections";
import { buildMetadata } from "@/core/seo/metadata";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = buildMetadata({
  title: "Destinations",
  description: "Pick a country to see every guide we have published for it, across all sections.",
  path: "/countries",
});

export const revalidate = 3600;

export default async function DestinationsPage() {
  const countries = await listCountriesWithOffers(createSupabasePublicClient());
  const items = countries.ok ? countries.data : [];

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Destinations" }]}
        title="Destinations"
        description="Pick a country to see every guide we have published for it, across all sections."
      />
      <Container className="pt-6 pb-16 sm:pt-8 sm:pb-24">
        {items.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((country) => (
              <li key={country.id}>
                <Link
                  href={countryHubPath(country.slug)}
                  className="border-border bg-surface hover:border-border-strong flex h-full flex-col gap-2 rounded-lg border p-5 transition-colors"
                >
                  <MapPin aria-hidden="true" className="text-accent h-5 w-5" />
                  <span className="display-sm text-[1.25rem]/6">{country.name}</span>
                  <span className="text-ink-muted text-sm tabular-nums">
                    {country.offerCount} {country.offerCount === 1 ? "guide" : "guides"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Destinations are on the way"
            description="A country appears here once we have published a guide for it."
          />
        )}
      </Container>
    </>
  );
}
