import Image from "next/image";

import { HeroClouds } from "@/components/home/hero-clouds";
import { HeroSearch } from "@/components/search/hero-search";
import type { PartnerSearch } from "@/core/affiliate/search";
import { brandImage } from "@/core/media/imagery";

/**
 * Home hero.
 *
 * A Server Component with no JavaScript. The entrance is a CSS keyframe
 * sequence — the `.intro-*` classes in globals.css — which starts at first
 * paint rather than waiting for hydration, so nothing appears, blinks out and
 * re-enters. `prefers-reduced-motion` cancels it in one rule.
 *
 * A full-viewport photograph with the type anchored in its sky. That is only
 * possible because the type is charcoal, not white: the earlier white-on-photo
 * hero measured 1.13:1 against this same sunlit sky (see docs/design-system.md),
 * while charcoal against it is the easy direction. Three things keep it that
 * way whatever the crop does:
 *
 * - the type sits in the top of the frame, where the photograph is haze;
 * - `.hero-glow`, an ivory halo centred on the type, lifts whatever is behind
 *   it — including the sun, when a narrow crop pushes it towards the centre.
 *   It is what carries the supporting line past the horizon into the trees,
 *   and why that line is ink rather than ink-soft (measurements in
 *   globals.css);
 * - the drifting clouds are white and sit behind the type, so they can only
 *   add light under it.
 *
 * The foot of the frame dissolves into the page ground, so the photograph
 * hands over to the first ivory band instead of ending in a hard edge.
 */
export function HomeHero({
  partnerSearches = [],
  airports = [],
}: {
  /** Partner search tabs whose links are live. Empty means site search only. */
  partnerSearches?: PartnerSearch[];
  /** Airports we cover, offered as suggestions in the flights tab. */
  airports?: { code: string; city: string }[];
}) {
  const image = brandImage("hero");

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      <div className="absolute inset-0 -z-10">
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
        <HeroClouds />
        <div aria-hidden="true" className="hero-glow absolute inset-0" />
        <div aria-hidden="true" className="hero-foot absolute inset-x-0 bottom-0 h-[38%]" />
      </div>

      <div className="mx-auto flex w-full max-w-[84rem] flex-1 flex-col items-center px-5 pt-[clamp(7.5rem,21svh,12.5rem)] text-center sm:px-8 lg:px-10">
        <p className="intro intro-1 eyebrow text-ink-soft rounded-full border border-white/60 bg-white/45 px-4 py-1.5 backdrop-blur-md">
          Travel discovery, measured
        </p>

        <h1 className="intro intro-2 display mt-6 max-w-[15ch] text-[2.6rem] sm:text-[4rem] lg:text-[5.25rem]">
          Find your next unforgettable trip.
        </h1>

        <p className="intro intro-3 text-ink mt-6 max-w-[48ch] text-lg/[1.6] sm:text-xl/[1.6]">
          Remarkable places, inspiring stays and experiences worth the journey —
          with the practical detail you need to actually plan it.
        </p>

        <div
          className={`intro intro-4 hero-glass mt-10 w-full max-w-4xl text-left ${
            partnerSearches.length
              ? "rounded-[1.75rem] p-2"
              : "rounded-[1.75rem] p-1.5 sm:rounded-full"
          }`}
        >
          <HeroSearch partners={partnerSearches} airports={airports} />
        </div>

        <div className="mt-auto grid w-full grid-cols-[1fr_auto_1fr] items-end gap-4 pt-12 pb-6">
          <span aria-hidden="true" />
          <a
            href="#explore"
            className="text-ink-muted hover:text-ink eyebrow flex flex-col items-center gap-2 transition-colors"
          >
            Scroll to explore
            <span className="hero-cue bg-ink-muted/50 block h-8 w-px" />
          </a>
          {/* Credit on the ivory foot, not on the photograph's busy middle. */}
          <p className="text-ink-muted/80 justify-self-end text-right text-[10px] tracking-wide">
            Photograph: {image.credit.photographer} / {image.credit.source}
          </p>
        </div>
      </div>

      {/* Target for the scroll cue: the hero's bottom edge, offset for the
          fixed header so the next band starts clear of it. */}
      <span id="explore" aria-hidden="true" className="absolute bottom-0 scroll-mt-16" />
    </section>
  );
}
