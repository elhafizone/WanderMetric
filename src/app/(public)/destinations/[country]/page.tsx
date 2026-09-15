import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, Stack } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { ContentCard, EmptyState } from "@/components/ui/card";
import { DetailHero } from "@/components/ui/detail-hero";
import { FactPanel } from "@/components/ui/fact-list";
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

  // The country's own photograph first; failing that, its leading city. A photo
  // of Lisbon on the Portugal page is a photograph of Portugal — a photo of
  // anywhere else would not be, which is why nothing broader is tried.
  const imageKeys = [record.slug, cityItems.find((city) => city.is_featured)?.slug];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Country",
          name: record.name,
          description: record.summary ?? undefined,
          url: new URL(`/destinations/${country}`, site.url).toString(),
        }}
      />

      <DetailHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Destinations", href: "/destinations" },
          { label: record.name },
        ]}
        eyebrow={record.continent?.replace(/_/g, " ")}
        title={record.name}
        description={record.summary}
        media={record.hero}
        imageKeys={imageKeys}
      />

      <Container width="wide">
        <Stack className="py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
            <article className="flex flex-col gap-10">
              <Prose text={body} />
              {bestTime && (
                <section className="border-border-strong border-l-2 pl-6">
                  <h2 className="display-sm mb-2 text-xl">When to visit</h2>
                  <p className="text-ink-soft max-w-[58ch] text-[1.0625rem]/[1.7]">
                    {bestTime}
                  </p>
                </section>
              )}
            </article>

            <aside className="h-fit lg:sticky lg:top-28">
              <FactPanel
                title="Country facts"
                facts={[
                  { label: "Capital", value: record.capital },
                  { label: "Currency", value: record.currency_code, mono: true },
                  { label: "Country code", value: record.iso2, mono: true },
                  { label: "Cities covered", value: String(cityItems.length) },
                ]}
              />
            </aside>
          </div>

          <section className="flex flex-col gap-10">
            <SectionHeader
              eyebrow="Where to go"
              title={`Cities in ${record.name}`}
              description="Each city page covers when to go and what is worth your time."
            />
            {cityItems.length > 0 ? (
              <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cityItems.map((city) => (
                  <ContentCard
                    key={city.id}
                    href={cityPath(country, city.slug)}
                    title={city.name}
                    summary={city.summary}
                    media={city.hero}
                    imageKeys={[city.slug]}
                    eyebrow={record.name}
                  />
                ))}
              </Reveal>
            ) : (
              <EmptyState
                title="No cities published yet"
                description={`Cities in ${record.name} will appear here once published.`}
              />
            )}
          </section>
        </Stack>
      </Container>
    </>
  );
}
