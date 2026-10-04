import { Container } from "@/components/layout/container";
import { HeroSlider, type HeroSlide } from "@/components/home/hero-slider";
import type { OfferCard } from "@/core/offers/offers";
import { getSection, offerPath } from "@/core/sections/sections";
import { formatDuration } from "@/lib/format";
import { resolveImage } from "@/lib/media";

/**
 * The home page opening: real guides, no search box.
 *
 * The page's one `h1` is kept for screen readers and search engines but is not
 * drawn above the cards; the line that explains the guides sits under them. The
 * server resolves each photograph (by the offer's slug, then its city, then its
 * country) and hands the slider plain data, so a card never shows a picture of
 * somewhere else.
 */
function toSlide(offer: OfferCard): HeroSlide {
  const image = resolveImage(null, [offer.slug, offer.city?.slug, offer.country.slug]);
  return {
    id: offer.id,
    href: offerPath(offer.section, offer.country.slug, offer.slug),
    name: offer.name,
    summary: offer.summary,
    where: offer.city ? `${offer.city.name}, ${offer.country.name}` : offer.country.name,
    sectionName: getSection(offer.section)?.name ?? null,
    program: offer.program.name,
    duration: formatDuration(offer.duration_minutes),
    image: image ? { src: image.src, alt: image.alt, focus: image.focus } : null,
  };
}

export function FeaturedHero({ offers }: { offers: OfferCard[] }) {
  if (offers.length === 0) return null;

  return (
    <section className="bg-bg-tint border-border border-b">
      <Container className="flex flex-col gap-5 pt-6 pb-8 sm:pt-8 sm:pb-10 lg:pt-10 lg:pb-12">
        <h1 className="sr-only">WanderMetric: guides written from the real listing</h1>
        <HeroSlider slides={offers.map(toSlide)} />
        <p className="text-ink-soft max-w-[62ch] text-sm/[1.55] sm:text-base/6">
          Guides written from the real listing: what each tour, ticket and service includes, set
          out plainly, with the partner link when you are ready to book. No invented prices.
        </p>
      </Container>
    </section>
  );
}
