import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { DestinationPicture } from "@/components/home/destination-image";

export interface MosaicDestination {
  slug: string;
  name: string;
  offerCount: number;
  cityCount: number;
  picture: DestinationPicture;
}

const plural = (count: number, word: string) =>
  `${count} ${count === 1 ? word : word === "city" ? "cities" : `${word}s`}`;

/** Where one tile sits in the grid (`cell`) and how tall it is (`shape`). */
function placement(index: number, count: number): { cell: string; shape: string } {
  if (count === 1) {
    return { cell: "lg:col-span-12", shape: "aspect-[4/3] sm:aspect-[21/9]" };
  }
  if (count === 2) {
    return {
      cell: index === 0 ? "lg:col-span-7" : "lg:col-span-5",
      shape: "aspect-[4/3] lg:aspect-auto lg:min-h-[28rem]",
    };
  }
  if (index === 0) {
    return {
      cell: "sm:col-span-2 lg:col-span-7 lg:row-span-2",
      shape: "aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[36rem]",
    };
  }
  if (index <= 2) {
    return {
      cell: "lg:col-span-5",
      shape: "aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[17rem]",
    };
  }
  return { cell: "lg:col-span-4", shape: "aspect-[4/3]" };
}

/**
 * Where the guides are, led by photographs.
 *
 * Deliberately not a grid of identical cards: the busiest country is the large
 * tile, the next two sit beside it, and any others run underneath at a smaller
 * size. The arrangement follows how many destinations really exist - one is a
 * single wide tile, two a pair - so it never shows a gap or a stand-in.
 */
export function DestinationMosaic({ destinations }: { destinations: MosaicDestination[] }) {
  if (destinations.length === 0) return null;

  const count = destinations.length;

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
      {destinations.map((destination, index) => {
        const { cell, shape } = placement(index, count);
        const feature = index === 0;

        return (
          <li key={destination.slug} className={`flex ${cell}`}>
            <Link
              href={`/countries/${destination.slug}`}
              className={`group bg-surface-2 relative isolate flex w-full overflow-hidden rounded-xl ${shape}`}
            >
              <Image
                src={destination.picture.src}
                alt={destination.picture.alt}
                fill
                sizes={feature ? "(max-width: 1024px) 100vw, 58vw" : "(max-width: 1024px) 100vw, 42vw"}
                unoptimized={destination.picture.remote}
                referrerPolicy={destination.picture.remote ? "no-referrer" : undefined}
                style={destination.picture.focus ? { objectPosition: destination.picture.focus } : undefined}
                className="card-media -z-20 object-cover"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-t from-[rgba(31,25,20,0.74)] via-[rgba(31,25,20,0.14)] to-transparent to-62%"
              />
              <div className="mt-auto flex w-full items-end justify-between gap-4 p-5 sm:p-6 lg:p-7">
                <div className="text-white">
                  <h3
                    className={`display ${
                      feature
                        ? "text-[2.75rem]/[0.98] sm:text-[3.5rem] lg:text-[4.5rem]"
                        : "text-[2.25rem]/[1] sm:text-[2.75rem]"
                    }`}
                  >
                    {destination.name}
                  </h3>
                  <p className="mt-2 text-[0.9375rem] font-medium text-white/90">
                    {plural(destination.offerCount, "guide")}
                    {destination.cityCount > 0 && ` · ${plural(destination.cityCount, "city")}`}
                  </p>
                </div>
                <span className="text-ink grid size-12 shrink-0 place-items-center rounded-full bg-white transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1">
                  <ArrowUpRight aria-hidden="true" className="size-5" />
                  <span className="sr-only">Explore {destination.name}</span>
                </span>
              </div>
              <span className="absolute top-4 left-4 rounded-full bg-[rgba(31,25,20,0.42)] px-2.5 py-1 text-[0.6875rem] text-white/90 backdrop-blur-sm">
                Photo: {destination.picture.credit}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
