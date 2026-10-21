"use client";

import { ArrowUpRight, Clock, MapPin } from "lucide-react";
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
 * a grid of cards. Picking a chip filters the grid immediately.
 *
 * Each card is a soft-cornered photograph with the words set on the page
 * beneath it; the partner who supplied the photograph is credited under the
 * facts. A card with no photograph gets a tinted plate and the section's icon,
 * never a picture of somewhere else.
 */
const TINTS = [
  "bg-accent-soft text-accent",
  "bg-secondary-soft text-secondary",
  "bg-warning-soft text-warning",
  "bg-success-soft text-success",
  "bg-info-soft text-info",
  "bg-band-sand text-ink-soft",
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
    "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors";
  const on = "border-ink bg-ink text-bg";
  const off = "border-border-strong bg-transparent text-ink-soft hover:border-ink hover:text-ink";

  return (
    <section aria-labelledby="things-to-do" className="flex flex-col gap-6 sm:gap-8">
      <h2 id="things-to-do" className="display text-[2.125rem]/[1.04] sm:text-[2.875rem]/[1.02]">
        {title}
      </h2>

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

      <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((offer) => (
          <li key={offer.id}>
            <article className="group relative flex h-full flex-col gap-4">
              <div className="bg-surface-2 relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                {offer.photo ? (
                  <Image
                    src={offer.photo.url}
                    alt={offer.photo.alt || offer.name}
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                    unoptimized
                    referrerPolicy="no-referrer"
                    className="card-media object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className={`grid h-full w-full place-items-center ${tintFor(offer.section)}`}
                  >
                    <SectionIcon icon={sectionIcon(offer.section)} className="size-10 opacity-80" />
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <p className="text-secondary flex items-center gap-1.5 text-[0.8125rem]/[1.125rem] font-bold">
                  <MapPin aria-hidden className="size-3.5 shrink-0" />
                  {offer.place}
                </p>
                <h3 className="display-sm text-[1.625rem]/[1.12] text-pretty">
                  <Link
                    href={offer.href}
                    className="decoration-transparent group-hover:decoration-ink underline decoration-1 underline-offset-[5px] transition-colors after:absolute after:inset-0"
                  >
                    {offer.name}
                  </Link>
                </h3>
                <p className="border-border text-ink-muted mt-auto flex items-center gap-3 border-t pt-3 text-[0.8125rem]/[1.125rem] font-semibold">
                  <span>{offer.provider}</span>
                  {offer.duration && (
                    <span className="flex items-center gap-1.5">
                      <Clock aria-hidden className="size-3.5 shrink-0" />
                      {offer.duration}
                    </span>
                  )}
                  <ArrowUpRight aria-hidden className="card-arrow text-ink ml-auto size-[1.125rem]" />
                </p>
                {offer.photo && (
                  <p className="text-ink-muted text-[0.75rem]">Photo from {offer.photo.credit}</p>
                )}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
