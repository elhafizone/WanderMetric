import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { DetailHero } from "@/components/ui/detail-hero";
import { FactPanel } from "@/components/ui/fact-list";
import { Prose } from "@/components/ui/prose";
import { getActivityBySlug } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { activityCityPath, activityPath } from "@/lib/paths";
import { publicMediaUrl } from "@/lib/media";
import { formatDuration } from "@/lib/format";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 86400;

interface Params {
  params: Promise<{ city: string; slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city, slug } = await params;
  const db = createSupabasePublicClient();
  const result = await getActivityBySlug(db, "tour", city, slug);

  if (!result.ok) {
    return buildMetadata({
      title: "Not found",
      description: "This tour could not be found.",
      path: `/tours/${city}/${slug}`,
      noIndex: true,
    });
  }

  const item = result.data;
  return buildMetadata({
    title: `${item.name}, ${item.city.name}`,
    description: item.summary ?? `${item.name} in ${item.city.name}.`,
    path: activityPath(item),
    type: "article",
    image: publicMediaUrl(item.hero) ?? undefined,
  });
}

export default async function ToursDetailPage({ params }: Params) {
  const { city, slug } = await params;
  const db = createSupabasePublicClient();

  const result = await getActivityBySlug(db, "tour", city, slug);
  if (!result.ok) notFound();
  const item = result.data;

  return (
    <>
      {/* Only facts we hold. No rating or price is emitted, because none is
          stored — that data is provider-owned and fetched live. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TouristAttraction",
          name: item.name,
          description: item.summary ?? undefined,
          url: new URL(activityPath(item), site.url).toString(),
          containedInPlace: { "@type": "City", name: item.city.name },
        }}
      />

      <DetailHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Tours", href: "/tours" },
          { label: item.city.name, href: activityCityPath("tour", item.city.slug) },
          { label: item.name },
        ]}
        eyebrow={item.city.name}
        title={item.name}
        description={item.summary}
        media={item.hero}
        imageKeys={[item.city.slug]}
      />

      <Container width="wide">
        <div className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <article>
            <Prose text={item.body} />
          </article>

          <aside className="flex h-fit flex-col gap-6 lg:sticky lg:top-28">
            <FactPanel
              title="Practical"
              facts={[
                { label: "City", value: item.city.name },
                { label: "Typical visit", value: formatDuration(item.duration_minutes) },
                { label: "Type", value: item.category?.name },
              ]}
            />
            <AffiliateDisclosure />
          </aside>
        </div>
      </Container>
    </>
  );
}
