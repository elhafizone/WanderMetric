import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { buttonClass } from "@/components/ui/button";
import { brandImage } from "@/core/media/imagery";

/**
 * The home page opening: one photograph, one line, two ways in.
 *
 * The photograph is brand scenery from our own origin, not a claim about a
 * destination (see `brandImage`). Type sits low-left on the darkest part of the
 * frame, the asphalt, with a restrained warm-espresso veil underneath it, so
 * the sun and the sky keep all their light. The entrance is CSS and transform
 * only (see `.hero-*` in globals.css), so a slow or backgrounded tab never
 * leaves the headline invisible.
 *
 * The line states what the site actually does. There is no search box inside
 * the photograph: the discovery bar sits directly beneath it, clear of the image.
 */
export function HomeHero() {
  const photo = brandImage("hero");

  return (
    <section aria-labelledby="home-title" className="relative isolate overflow-hidden bg-ink">
      <div className="relative min-h-[34rem] h-[78svh] max-h-[50rem] lg:min-h-[40rem]">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="100vw"
          // On a phone the frame is a narrow slice of a wide photograph. Keep the
          // slice on the dark road and trees, away from the sun, so the white
          // headline never sits on blown-out sky; from tablet up the whole
          // scene fits and the sun balances the type.
          className="hero-photo -z-20 object-cover object-[36%_50%] sm:object-[70%_46%]"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(31,25,20,0.82)_0%,rgba(31,25,20,0.6)_50%,rgba(31,25,20,0.14)_82%)] sm:bg-[linear-gradient(to_top,rgba(31,25,20,0.78)_0%,rgba(31,25,20,0.42)_34%,rgba(31,25,20,0)_68%),linear-gradient(to_right,rgba(31,25,20,0.4)_0%,rgba(31,25,20,0)_58%)]"
        />

        <Container className="flex h-full flex-col justify-end pb-14 sm:pb-16 lg:pb-20">
          <h1
            id="home-title"
            className="display-xl hero-rise hero-rise-1 max-w-[20ch] text-white"
          >
            <span className="block">Find the trip.</span>
            <span className="block">Read what’s really included.</span>
          </h1>
          <p className="hero-rise hero-rise-2 mt-5 max-w-[44ch] text-[1.0625rem]/[1.6] text-white/90 sm:mt-6 sm:text-lg/[1.65]">
            Guides written from each partner’s own listing, with the partner link when you’re
            ready to book. No invented prices, no made-up reviews.
          </p>
          <div className="hero-rise hero-rise-3 mt-7 flex flex-wrap gap-3 sm:mt-8">
            <Link href="/tours-activities" className={buttonClass("cta", "lg")}>
              Browse tours and activities
            </Link>
            <Link
              href="/countries"
              className={`${buttonClass("secondary", "lg")} border-white/70 text-white hover:border-white hover:bg-white hover:text-ink`}
            >
              Choose a country
            </Link>
          </div>
        </Container>

        <p className="absolute top-3 right-4 text-[0.75rem] text-white/85 sm:right-8 lg:right-10">
          Photo: {photo.credit.photographer} / {photo.credit.source}
        </p>
      </div>
    </section>
  );
}
