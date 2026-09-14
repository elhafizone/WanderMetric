import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { Container, Stack } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { MediaImage } from "@/components/ui/media-image";
import { Prose } from "@/components/ui/prose";
import { getActivityBySlug } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { site } from "@/core/seo/site";
import { activityCityPath, activityPath } from "@/lib/paths";
import { publicMediaUrl } from "@/lib/media";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 86400;

interface Params {
  params: Promise<{ city: string; slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city, slug } = await params;
  const db = createSupabasePublicClient();
  const result = await getActivityBySlug(db, "activity", city, slug);

  if (!result.ok) {
    return buildMetadata({
      title: "Not found",
      description: "This activity could not be found.",
      path: `/activities/${city}/${slug}`,
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

export default async function ActivitiesDetailPage({ params }: Params) {
  const { city, slug } = await params;
  const db = createSupabasePublicClient();

  const result = await getActivityBySlug(db, "activity", city, slug);
  if (!result.ok) notFound();
  const item = result.data;

  return (
    <Container width="narrow">
      <Stack>
        {/* Only facts we hold. No rating or price is emitted, because none is
            stored -- that data is provider-owned and fetched live. */}
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

        <div className="flex flex-col gap-5">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Things to do", href: "/activities" },
              {
                label: item.city.name,
                href: activityCityPath("activity", item.city.slug),
              },
              { label: item.name },
            ]}
          />

          <div className="bg-surface-2 relative aspect-[16/9] w-full max-w-full overflow-hidden rounded-2xl">
            <MediaImage
              media={item.hero}
              label={item.name}
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-full w-full"
            />
          </div>

          <header className="flex flex-col gap-3">
            <p className="text-accent font-mono text-xs tracking-[0.16em] uppercase">
              {item.city.name}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {item.name}
            </h1>
            {item.summary && (
              <p className="text-ink-muted text-lg/relaxed">{item.summary}</p>
            )}
            {item.duration_minutes && (
              <p className="text-ink-muted text-sm">
                Typically about {Math.round(item.duration_minutes / 60)} hours
              </p>
            )}
          </header>
        </div>

        <Prose text={item.body} />
        <AffiliateDisclosure />
      </Stack>
    </Container>
  );
}
