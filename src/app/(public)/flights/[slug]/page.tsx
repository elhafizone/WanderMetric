import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { Container, Stack } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
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

  return (
    <Container width="narrow">
      <Stack>
        <div className="flex flex-col gap-5">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Flights", href: "/flights" },
              { label: route.title },
            ]}
          />

          <header className="flex flex-col gap-3">
            {route.origin.iata_code && route.destination.iata_code && (
              <p className="text-accent font-mono text-xs tracking-[0.16em] uppercase">
                {route.origin.iata_code} → {route.destination.iata_code}
              </p>
            )}
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {route.title}
            </h1>
          </header>

          {/* No fare is shown. Prices are provider-owned, change constantly, and
              are never persisted -- quoting one here would be fabrication. */}
          <dl className="border-border bg-surface grid gap-4 rounded-xl border p-5 sm:grid-cols-2">
            <div>
              <dt className="text-ink-muted text-sm">From</dt>
              <dd className="font-medium">
                {route.origin.country ? (
                  <a
                    className="hover:text-accent hover:underline"
                    href={cityPath(route.origin.country.slug, route.origin.slug)}
                  >
                    {route.origin.name}
                  </a>
                ) : (
                  route.origin.name
                )}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted text-sm">To</dt>
              <dd className="font-medium">
                {route.destination.country ? (
                  <a
                    className="hover:text-accent hover:underline"
                    href={cityPath(
                      route.destination.country.slug,
                      route.destination.slug,
                    )}
                  >
                    {route.destination.name}
                  </a>
                ) : (
                  route.destination.name
                )}
              </dd>
            </div>
          </dl>
        </div>

        <Prose text={route.body} />
        <AffiliateDisclosure />
      </Stack>
    </Container>
  );
}
