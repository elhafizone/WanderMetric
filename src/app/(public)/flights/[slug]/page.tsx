import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { Container } from "@/components/layout/container";
import { DetailHero } from "@/components/ui/detail-hero";
import { Prose } from "@/components/ui/prose";
import { getFlightRouteBySlug } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { cityPath, flightRoutePath } from "@/lib/paths";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 86400;

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const db = createSupabasePublicClient();
  const { data } = await db
    .from("flight_routes")
    .select("slug")
    .is("deleted_at", null)
    .limit(200);

  return (data ?? []).map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const db = createSupabasePublicClient();
  const result = await getFlightRouteBySlug(db, slug);

  if (!result.ok) {
    return buildMetadata({
      title: "Not found",
      description: "This route could not be found.",
      path: flightRoutePath({ slug }),
      noIndex: true,
    });
  }

  const route = result.data;
  return buildMetadata({
    title: route.title,
    description: `Flying from ${route.origin.name} to ${route.destination.name}: journey time, airports and whether flying is the right call.`,
    path: flightRoutePath(route),
    type: "article",
  });
}

export default async function FlightRoutePage({ params }: Params) {
  const { slug } = await params;
  const db = createSupabasePublicClient();

  const result = await getFlightRouteBySlug(db, slug);
  if (!result.ok) notFound();
  const route = result.data;

  const codes =
    route.origin.iata_code && route.destination.iata_code
      ? `${route.origin.iata_code} → ${route.destination.iata_code}`
      : null;

  return (
    <>
      <DetailHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Flights", href: "/flights" },
          { label: route.title },
        ]}
        eyebrow={codes ?? "Route guide"}
        title={route.title}
        media={null}
        imageKeys={[route.destination.slug, route.origin.slug]}
      />

      <Container width="wide">
        <div className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <article>
            <Prose text={route.body} />
          </article>

          <aside className="flex h-fit flex-col gap-6 lg:sticky lg:top-28">
            {/* No fare is shown. Prices are provider-owned, change constantly,
                and are never persisted — quoting one here would be fabrication. */}
            <div className="border-border bg-surface rounded-xl border p-6">
              <h2 className="eyebrow text-ink-muted mb-4">The route</h2>
              <dl className="flex flex-col gap-5 text-sm">
                <Endpoint label="From" city={route.origin} />
                <div aria-hidden="true" className="rule" />
                <Endpoint label="To" city={route.destination} />
              </dl>
            </div>
            <AffiliateDisclosure />
          </aside>
        </div>
      </Container>
    </>
  );
}

/** One end of a route. Links through to the city guide where one exists. */
function Endpoint({
  label,
  city,
}: {
  label: string;
  city: {
    name: string;
    slug: string;
    iata_code?: string | null;
    country?: { name: string; slug: string } | null;
  };
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-ink-muted eyebrow">{label}</dt>
      <dd className="flex items-baseline justify-between gap-3">
        <span className="display-sm text-lg">
          {city.country ? (
            <Link
              className="hover:text-accent transition-colors"
              href={cityPath(city.country.slug, city.slug)}
            >
              {city.name}
            </Link>
          ) : (
            city.name
          )}
        </span>
        {city.iata_code && (
          <span className="text-ink-muted font-mono text-xs tracking-wider">
            {city.iata_code}
          </span>
        )}
      </dd>
    </div>
  );
}
