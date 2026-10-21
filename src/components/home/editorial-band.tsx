import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { brandImage } from "@/core/media/imagery";

const PRINCIPLES: Array<{ title: string; text: string }> = [
  {
    title: "Real numbers or none",
    text: "A price appears only when the partner’s own page shows one. We never fill a gap with a guess.",
  },
  {
    title: "Independent of the partners",
    text: "Partners pay us when you book through a link. They can’t buy a recommendation.",
  },
  {
    title: "Dated, so you can judge it",
    text: "Each guide says when its details were read from the listing. Details change; the date tells you how current they are.",
  },
];

/**
 * Why a reader should trust a guide here. The honest version of "about us":
 * three plain commitments the rest of the site is built to keep, set beside a
 * photograph of the kind of street the guides are for.
 */
export function EditorialBand() {
  const photo = brandImage("village");

  return (
    <section aria-labelledby="how-we-write" className="bg-band-sand">
      <Container className="grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
        <figure className="flex flex-col gap-2">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 1024px) 92vw, 42vw"
              className="object-cover"
            />
          </div>
          <figcaption className="text-ink-muted text-[0.75rem]">
            Photo: {photo.credit.photographer} / {photo.credit.source}
          </figcaption>
        </figure>

        <div className="flex flex-col gap-8">
          <h2 id="how-we-write" className="display text-[2.5rem]/[1.02] sm:text-[3.5rem]/[1] lg:text-[4rem]">
            Written from the listing, not the brochure.
          </h2>
          <ul className="flex flex-col gap-6">
            {PRINCIPLES.map((principle) => (
              <li key={principle.title} className="border-border-strong max-w-[52ch] border-t pt-5">
                <h3 className="text-ink text-[1.0625rem] font-bold">{principle.title}</h3>
                <p className="text-ink-soft mt-1.5 text-base/[1.65]">{principle.text}</p>
              </li>
            ))}
          </ul>
          <Link
            href="/affiliate-disclosure"
            className="text-accent hover:text-accent-hover decoration-accent/40 inline-flex min-h-11 w-fit items-center text-[0.9375rem] font-bold underline decoration-1 underline-offset-[6px]"
          >
            How we make money
          </Link>
        </div>
      </Container>
    </section>
  );
}
