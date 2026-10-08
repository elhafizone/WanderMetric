"use client";

import { Clock, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { SectionIcon } from "@/components/section/section-icon";
import { SECTIONS } from "@/core/sections/sections";

export interface StripOffer {
  id: string;
  name: string;
  href: string;
  /** City name, or the country name when the offer has no city. */
  place: string;
  /** The filter this offer belongs to. */
  placeKey: string;
  /** Section slug, used to choose the icon and tint of a card with no photograph. */
  section: string;
  duration: string | null;
  provider: string;
  photo: { url: string; alt: string; credit: string } | null;
}

/**
 * A "Things to do" grid: choice chips on top (every place that has offers) and
 * a grid of photo cards. Picking a chip filters the grid immediately.
 */
const TINTS = [
  "bg-accent-soft text-accent",
  "bg-ember-soft text-ember",
  "bg-secondary-soft text-secondary",
  "bg-success-soft text-success",
  "bg-info-soft text-info",
  "bg-warning-soft text-ink",
] as const;

function tintFor(section: string): string {
  const index = Math.max(0, SECTIONS.findIndex((item) => item.slug === section));
  return TINTS[index % TINTS.length] as string;
}

function sectionIcon(section: string) {
  return SECTIONS.find((item) => item.slug === section)?.icon ?? "ticket";
}

export function ThingsToDoStrip({
  offers,
  title = "Things to do",
}: {
  offers: StripOffer[];
  title?: string;
}) {
  const [active, setActive] = useState<string>("all");

  const places = [...new Map(offers.map((o) => [o.placeKey, o.place])).entries()]
    .map(([key, name]) => ({ key, name, count: offers.filter((o) => o.placeKey === key).length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const shown = active === "all" ? offers : offers.filter((o) => o.placeKey === active);

  const chip =
    "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-bold whitespace-nowrap transition-colors";
  const on = "border-ink bg-ink text-on-media";
  const off = "border-border-strong bg-surface text-ink-soft hover:border-ink hover:text-ink";

  return (
    <section aria-labelledby="things-to-do" className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <h2 id="things-to-do" className="display text-[1.75rem]/[2rem] sm:text-[2.25rem]/[2.5rem]">
          {title}
        </h2>
      </div>

      <div
        role="group"
        aria-label="Choose a place"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        <button
          type="button"
          onClick={() => setActive("all")}
          aria-pressed={active === "all"}
          className={`${chip} ${active === "all" ? on : off}`}
        >
          All places
          <span className="tabular-nums opacity-70">{offers.length}</span>
        </button>
        {places.map((place) => (
          <button
            key={place.key}
            type="button"
            onClick={() => setActive(place.key)}
            aria-pressed={active === place.key}
            className={`${chip} ${active === place.key ? on : off}`}
          >
            {place.name}
            <span className="tabular-nums opacity-70">{place.count}</span>
          </button>
        ))}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((offer) => (
          <li key={offer.id}>
            {offer.photo ? (
              <article className="group bg-surface-2 relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl">
                <Image
                  src={offer.photo.url}
                  alt={offer.photo.alt || offer.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  unoptimized
                  referrerPolicy="no-referrer"
                  className="-z-10 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
                />
                <div className="text-on-media flex flex-col gap-2 p-5">
                  <p className="text-on-media-muted flex items-center gap-1.5 text-sm font-semibold">
                    <MapPin aria-hidden className="size-4 shrink-0" />
                    {offer.place}
                  </p>
                  <h3 className="display-sm text-[1.25rem]/[1.5rem] text-pretty">
                    <Link href={offer.href} className="after:absolute after:inset-0">
                      {offer.name}
                    </Link>
                  </h3>
                  <p className="text-on-media-muted flex items-center gap-3 text-[0.8125rem] font-semibold">
                    <span>{offer.provider}</span>
                    {offer.duration && (
                      <span className="flex items-center gap-1.5">
                        <Clock aria-hidden className="size-3.5 shrink-0" />
                        {offer.duration}
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-on-media-muted absolute top-3 left-3 rounded-full bg-black/35 px-2.5 py-1 text-[0.6875rem] backdrop-blur-sm">
                  Photo from {offer.photo.credit}
                </span>
              </article>
            ) : (
              <article
                className={`group relative flex h-full min-h-[16rem] flex-col justify-between gap-6 overflow-hidden rounded-2xl p-5 transition-shadow duration-200 hover:shadow-lg ${tintFor(offer.section)}`}
              >
                <span className="bg-surface/70 grid size-14 place-items-center rounded-2xl backdrop-blur-sm">
                  <SectionIcon icon={sectionIcon(offer.section)} className="size-7" />
                </span>
                <div className="text-ink flex flex-col gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-semibold opacity-80">
                    <MapPin aria-hidden className="size-4 shrink-0" />
                    {offer.place}
                  </p>
                  <h3 className="display-sm text-[1.25rem]/[1.5rem] text-pretty">
                    <Link href={offer.href} className="after:absolute after:inset-0">
                      {offer.name}
                    </Link>
                  </h3>
                  <p className="flex items-center gap-3 text-[0.8125rem] font-semibold opacity-80">
                    <span>{offer.provider}</span>
                    {offer.duration && (
                      <span className="flex items-center gap-1.5">
                        <Clock aria-hidden className="size-3.5 shrink-0" />
                        {offer.duration}
                      </span>
                    )}
                  </p>
                </div>
              </article>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
