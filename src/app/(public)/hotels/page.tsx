import type { Metadata } from "next";

import { Container, PageShell, Stack } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ContentCard, EmptyState } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section";
import { listHotels } from "@/core/content/queries";
import { buildMetadata } from "@/core/seo/metadata";
import { hotelPath } from "@/lib/paths";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Hotels",
  description:
    "Places to stay, written up by city. We describe the hotel and the neighbourhood; live prices and availability come from booking partners.",
  path: "/hotels",
});

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const db = createSupabasePublicClient();
  const result = await listHotels(db, { page: Number(page) || 1, perPage: 12 });

  const items = result.ok ? result.data.items : [];
  const meta = result.ok ? result.data.meta : null;

  return (
    <PageShell>
      <Container width="wide">
        <Stack gap="tight">
          <div className="flex flex-col gap-6">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Hotels" }]} />
            <PageHeader
              eyebrow="Hotels"
              title="Where to stay"
              description="We write about the hotel and the neighbourhood around it. Prices and availability are never stored here - those come live from booking partners."
            />
            <div aria-hidden="true" className="rule w-full" />
          </div>

          {items.length > 0 ? (
            <>
              <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((hotel, index) => (
                  <ContentCard
                    key={hotel.id}
                    href={hotelPath(hotel)}
                    title={hotel.name}
                    summary={hotel.summary}
                    media={hotel.hero}
                    eyebrow={hotel.city.name}
                    meta={hotel.star_rating ? `${hotel.star_rating}-star` : null}
                    priority={index < 3}
                  />
                ))}
              </Reveal>
              {meta && <Pagination meta={meta} basePath="/hotels" />}
            </>
          ) : (
            <EmptyState
              title="No hotels published yet"
              description="Hotel write-ups appear here once they are published from the admin dashboard."
            />
          )}
        </Stack>
      </Container>
    </PageShell>
  );
}
