import Image from "next/image";

import { ButtonLink } from "@/components/ui/button";
import { Parallax } from "@/components/motion/parallax";
import { brandImage } from "@/core/media/imagery";

/**
 * Closing invitation.
 *
 * Inspirational rather than commercial by design: it sends the reader to the
 * destinations index, not to a partner. The last thing a visitor sees on the
 * homepage should be somewhere to go, not something to buy.
 */
export function FinalCta() {
  const image = brandImage("hills");

  return (
    <section className="relative isolate flex min-h-[32rem] items-end overflow-hidden sm:min-h-[38rem]">
      <Parallax className="absolute inset-0 -z-10" strength={7}>
        <Image
          src={image.src}
          alt=""
          fill
          sizes="100vw"
          quality={70}
          style={{ objectPosition: image.focus }}
          className="object-cover"
        />
      </Parallax>

      <div className="veil w-full pt-32 sm:pt-40">
        <div className="mx-auto w-full max-w-[84rem] px-5 pb-16 text-center sm:px-8 sm:pb-20 lg:px-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
            <p className="eyebrow text-ink-soft">Start planning</p>
            <h2 className="display text-ink text-[2.5rem] sm:text-[3.75rem]">
              Where will you go next?
            </h2>
            <p className="text-ink-soft max-w-[46ch] text-lg/[1.65]">
              Every destination here has been researched properly — when to go, what is
              worth your time, and what quietly is not.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/destinations" variant="primary" size="lg">
                Explore destinations
              </ButtonLink>
              <ButtonLink href="/guides" variant="secondary" size="lg">
                Read the guides
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
