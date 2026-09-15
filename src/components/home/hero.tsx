import Image from "next/image";

import { SearchForm } from "@/components/search/search-form";
import { brandImage } from "@/core/media/imagery";

/**
 * Home hero.
 *
 * A Server Component with no JavaScript. The entrance is a CSS keyframe
 * sequence — the `.intro-*` classes in globals.css — which starts at first
 * paint rather than waiting for hydration, so nothing appears, blinks out and
 * re-enters. `prefers-reduced-motion` cancels it in one rule.
 *
 * The composition is a photographic band with an ivory plate laid over its
 * lower edge, and that is a correctness decision as much as an aesthetic one.
 *
 * The previous hero set white type directly on the photograph. That only works
 * if the photograph is dark, and the whole problem with the first revision was
 * that it was: the image was picked for its darkness so the type would read.
 * Choosing a bright, warm photograph instead inverted the failure — measured
 * against the sunlit sky, the headline came out at 1.13:1 contrast and the
 * supporting line at 1.71:1, where AA wants 3:1 and 4.5:1. The only ways to
 * rescue white-on-photo were to darken the image again or to crop to its
 * gloomiest third, both of which give back exactly what this redesign was for.
 *
 * So the type moved off the photograph. Charcoal on ivory is about 13:1, the
 * image keeps every bit of its light, the scrim can stay almost nothing, and
 * the first viewport now contains a large warm photograph *and* a panel of
 * warm ivory — which is what makes the site read as light within a second.
 */
export function HomeHero() {
  const image = brandImage("hero");

  return (
    <section className="relative">
      <div className="relative h-[44svh] min-h-[19rem] overflow-hidden sm:h-[54svh] lg:h-[60svh]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={74}
          style={{ objectPosition: image.focus }}
          className="intro-media object-cover"
        />
      </div>

      <div className="mx-auto w-full max-w-[84rem] px-5 sm:px-8 lg:px-10">
        <div className="bg-bg relative -mt-14 rounded-t-2xl px-6 pt-10 pb-12 shadow-[0_-24px_60px_-40px_rgba(45,37,24,0.45)] sm:-mt-20 sm:px-12 sm:pt-14 sm:pb-16 lg:-mt-24 lg:px-16">
          <div className="flex max-w-3xl flex-col gap-5">
            <p className="intro intro-1 eyebrow text-ember">Travel discovery, measured</p>

            <h1 className="intro intro-2 display text-[2.5rem] sm:text-[3.75rem] lg:text-[4.5rem]">
              Find your next unforgettable trip.
            </h1>

            <p className="intro intro-3 text-ink-soft max-w-[52ch] text-lg/[1.6] sm:text-xl/[1.6]">
              Discover remarkable places, inspiring stays and unforgettable experiences —
              with the practical information you need to actually plan the journey.
            </p>
          </div>

          <div className="intro intro-4 mt-9 max-w-4xl">
            <SearchForm variant="hero" />
          </div>

          {/* Attribution sits on the plate, not on the photograph: the plate
              now overlaps the lower edge of the image where a credit used to
              go, and muted charcoal on ivory is legible where small white type
              over a picture never reliably is. */}
          <p className="text-ink-muted/80 mt-8 text-right text-[10px] tracking-wide">
            Photograph: {image.credit.photographer} / {image.credit.source}
          </p>
        </div>
      </div>
    </section>
  );
}
