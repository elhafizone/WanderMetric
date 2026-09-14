import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, Stack } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CardGrid, ContentCard, EmptyState } from "@/components/ui/card";
import { MediaImage } from "@/components/ui/media-image";
import { Prose } from "@/components/ui/prose";
import { SectionHeader } from "@/components/ui/section";
import {
  getCountryBySlug,
  getDestinationByPath,
  listCities,
} from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { cityPath } from "@/lib/paths";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 86400;

interface Params {
  params: Promise<{ country: string }>;
}

export async function generateStaticParams() {
  const db = createSupabasePublicClient();
  const { data } = await db
    .from("countries")
    .select("slug")
    .is("deleted_at", null)
    .limit(200);

  return (data ?? []).map((row) => ({ country: row.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { country } = await params;
  const db = createSupabasePublicClient();
  const result = await getCountryBySlug(db, country);

  if (!result.ok) {
    return buildMetadata({
      title: "Not found",
      description: "This country could not be found.",
      path: `/destinations/${country}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${result.data.name} travel guide`,
    description:
      result.data.summary ??
      `Where to go in ${result.data.name}, when to visit, and what is worth your time.`,
    path: `/destinations/${country}`,
    type: "article",
  });
}

export default async function CountryPage({ params }: Params) {
  const { country } = await params;
  const db = createSupabasePublicClient();

  const countryResult = await getCountryBySlug(db, country);
  if (!countryResult.ok) notFound();
  const record = countryResult.data;

  // A country may also have an editorial destination page. When one exists its
  // body is richer than the country record's, so it wins.
  const [cities, destination] = await Promise.all([
    listCities(db, { countrySlug: country, perPage: 60 }),
    getDestinationByPath(db, country),
  ]);

  const cityItems = cities.ok ? cities.data.items : [];
  const body = destination.ok ? (destination.data.body ?? record.body) : record.body;
  const bestTime = destination.ok ? destination.data.best_time : null;

  return (
    <Container>
      <Stack>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Country",
            name: record.name,
            description: record.summary ?? undefined,
            url: new URL(`/destinations/${country}`, site.url).toString(),
          }}
        />

        <div className="flex flex-col gap-5">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Destinations", href: "/destinations" },
              { label: record.name },
            ]}
          />

          <div className="bg-surface-2 relative aspect-[21/9] w-full max-w-full overflow-hidden rounded-2xl">
            <MediaImage
              media={record.hero}
              label={record.name}
              priority
              sizes="(max-width: 1024px) 100vw, 1152px"
              className="h-full w-full"
            />
          </div>

          <header className="flex flex-col gap-3 pt-2">
            <p className="text-accent font-mono text-xs tracking-[0.16em] uppercase">
              {record.continent?.replace(/_/g, " ")}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              {record.name}
            </h1>
            {record.summary && (
              <p className="text-ink-muted max-w-[65ch] text-lg/relaxed">
                {record.summary}
              </p>
            )}
          </header>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="flex flex-col gap-8">
            <Prose text={body} />
            {bestTime && (
              <section className="border-border bg-surface rounded-xl border p-6">
                <h2 className="mb-2 text-lg font-semibold">When to visit</h2>
                <p className="text-ink-muted">{bestTime}</p>
              </section>
            )}
          </article>

          <aside className="border-border bg-surface h-fit rounded-xl border p-5 lg:sticky lg:top-24">
            <h2 className="mb-3 text-sm font-medium">Country facts</h2>
            <dl className="flex flex-col gap-2 text-sm">
              {record.capital && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Capital</dt>
                  <dd>{record.capital}</dd>
                </div>
              )}
              {record.currency_code && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Currency</dt>
                  <dd className="font-mono">{record.currency_code}</dd>
                </div>
              )}
              {record.iso2 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Country code</dt>
                  <dd className="font-mono">{record.iso2}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Cities covered</dt>
                <dd>{cityItems.length}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <section className="flex flex-col gap-6">
          <SectionHeader
            title={`Cities in ${record.name}`}
            description="Each city page covers when to go and what is worth your time."
          />
          {cityItems.length > 0 ? (
            <CardGrid>
              {cityItems.map((city) => (
                <ContentCard
                  key={city.id}
                  href={cityPath(country, city.slug)}
                  title={city.name}
                  summary={city.summary}
                  media={city.hero}
                  eyebrow={record.name}
                />
              ))}
            </CardGrid>
          ) : (
            <EmptyState
              title="No cities published yet"
              description={`Cities in ${record.name} will appear here once published.`}
            />
          )}
        </section>
      </Stack>
    </Container>
  );
}
