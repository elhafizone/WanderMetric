import Image from "next/image";

import { SearchForm } from "@/components/search/search-form";
import { brandImage } from "@/core/media/imagery";

/**
 * Home hero.
 *
 * A Server Component with no JavaScript at all. The entrance is a CSS keyframe
 * sequence — see the `.intro-*` classes in globals.css — which starts at first
 * paint instead of waiting for hydration, so the headline never appears, blink
 * out and re-enter. `prefers-reduced-motion` cancels it in one rule.
 *
 * The photograph is the LCP element: `priority` with a real `sizes` and its
 * intrinsic dimensions, inside an aspect-locked box, so it is fetched early and
 * nothing below it moves when it lands.
 */
export function HomeHero() {
  const image = brandImage("hero");

  return (
    <section className="relative isolate flex min-h-[86svh] flex-col justify-end overflow-hidden sm:min-h-[92svh]">
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={image.src}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={72}
          style={{ objectPosition: image.focus }}
          className="intro-media object-cover"
        />
        <div className="scrim absolute inset-0" />
      </div>

      <div className="mx-auto w-full max-w-[84rem] px-5 pt-32 pb-14 sm:px-8 sm:pb-20 lg:px-10">
        <div className="flex max-w-3xl flex-col gap-6">
          <p className="intro intro-1 eyebrow text-on-media-muted">
            Travel discovery, measured
          </p>

          <h1 className="intro intro-2 display text-on-media text-[2.75rem] sm:text-[4.5rem] lg:text-[5.25rem]">
            Find your next unforgettable trip.
          </h1>

          <p className="intro intro-3 text-on-media-muted max-w-[52ch] text-lg/[1.6] sm:text-xl/[1.6]">
            Discover remarkable places, inspiring stays and unforgettable experiences —
            with the practical information you need to actually plan the journey.
          </p>
        </div>

        <div className="intro intro-4 mt-10 max-w-4xl">
          <SearchForm variant="hero" />
        </div>
      </div>

      {/* Credit for a full-bleed photograph, sized so it never competes with
          the headline but is genuinely readable. */}
      <p className="text-on-media-muted/70 absolute right-4 bottom-2 text-[10px] tracking-wide sm:right-8">
        Photograph: {image.credit.photographer} / {image.credit.source}
      </p>
    </section>
  );
}
