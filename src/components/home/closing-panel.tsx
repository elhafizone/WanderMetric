import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { buttonClass } from "@/components/ui/button";
import { brandImage } from "@/core/media/imagery";

/**
 * The last thing on the home page: one photograph, one sentence, one action.
 * It sends the reader to the destinations page, the widest door the site has.
 */
export function ClosingPanel() {
  const photo = brandImage("hills");

  return (
    <section aria-labelledby="closing-title" className="py-16 sm:py-24">
      <Container>
        <div className="relative isolate flex min-h-[26rem] flex-col justify-end overflow-hidden rounded-2xl p-6 sm:min-h-[30rem] sm:p-12 lg:p-16">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 1280px) 96vw, 1200px"
            className="-z-20 object-cover"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(31,25,20,0.74)_0%,rgba(31,25,20,0.4)_45%,rgba(31,25,20,0.06)_100%)]"
          />
          <h2
            id="closing-title"
            className="display max-w-[18ch] text-[2rem]/[1.08] text-white sm:text-[3rem]/[1.05] lg:text-[3.75rem]/[1.03]"
          >
            Pick a country and start reading.
          </h2>
          <p className="mt-4 max-w-[46ch] text-base/[1.65] text-white/90 sm:text-lg/[1.65]">
            Every guide sets out what the listing includes and links to the partner when you’re
            ready.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/countries" className={buttonClass("cta", "lg")}>
              See all destinations
            </Link>
          </div>
          <p className="absolute top-4 right-5 text-[0.75rem] text-white/80">
            Photo: {photo.credit.photographer} / {photo.credit.source}
          </p>
        </div>
      </Container>
    </section>
  );
}
