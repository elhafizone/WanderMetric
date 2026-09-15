import Image from "next/image";

import { Parallax } from "@/components/motion/parallax";
import { brandImage, type BrandImageKey } from "@/core/media/imagery";

/**
 * Full-bleed editorial break.
 *
 * One of exactly two parallax sections on the homepage. It exists to change the
 * page's pace — a listing, then a held image and a single idea, then another
 * listing — rather than for the effect itself. The photograph drifts at about a
 * fifth of scroll speed while the words stay put, which reads as depth.
 */
export function EditorialBand({
  imageKey = "horizon",
  eyebrow,
  title,
  body,
  minHeight = "min-h-[30rem] sm:min-h-[36rem]",
}: {
  imageKey?: BrandImageKey;
  eyebrow: string;
  title: string;
  body: string;
  minHeight?: string;
}) {
  const image = brandImage(imageKey);

  return (
    <section className={`relative isolate flex items-center ${minHeight}`}>
      <Parallax className="absolute inset-0 -z-10" strength={8}>
        <Image
          src={image.src}
          alt=""
          fill
          sizes="100vw"
          quality={70}
          style={{ objectPosition: image.focus }}
          className="object-cover"
        />
        <div className="scrim-soft absolute inset-0" />
      </Parallax>

      <div className="mx-auto w-full max-w-[84rem] px-5 py-20 sm:px-8 lg:px-10">
        <div className="flex max-w-2xl flex-col gap-5">
          <p className="eyebrow text-on-media-muted">{eyebrow}</p>
          <h2 className="display text-on-media text-[2rem] sm:text-[3rem]">{title}</h2>
          <p className="text-on-media-muted max-w-[54ch] text-lg/[1.7]">{body}</p>
        </div>
      </div>

      <p className="text-on-media-muted/60 absolute right-4 bottom-2 text-[10px] tracking-wide sm:right-8">
        Photograph: {image.credit.photographer} / {image.credit.source}
      </p>
    </section>
  );
}
