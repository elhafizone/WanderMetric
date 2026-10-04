"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export interface HeroSlide {
  id: string;
  href: string;
  name: string;
  summary: string | null;
  where: string;
  sectionName: string | null;
  program: string;
  duration: string | null;
  image: { src: string; alt: string; focus: string | null } | null;
}

const INTERVAL_MS = 6500;

function Photo({
  slide,
  sizes,
  priority = false,
}: {
  slide: HeroSlide;
  sizes: string;
  priority?: boolean;
}) {
  if (!slide.image) {
    return <div aria-hidden="true" className="bg-surface-2 absolute inset-0" />;
  }
  return (
    <Image
      src={slide.image.src}
      alt={slide.image.alt || slide.name}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "eager"}
      style={slide.image.focus ? { objectPosition: slide.image.focus } : undefined}
      className="object-cover"
    />
  );
}

/**
 * The home page opening: a large guide that fades to the next one, with the
 * three guides that come next on the right.
 *
 * Every card is a real guide. The slides sit stacked in one grid cell and only
 * their opacity changes, so the height never jumps; inactive slides are `inert`,
 * so they cannot be tabbed to or read out. It advances by itself, pauses while
 * the pointer or keyboard focus is inside, and does not advance at all for
 * visitors who ask for reduced motion (the arrows and dots still work).
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const count = slides.length;
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const go = useCallback((index: number) => setActive((index + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || reduced) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % count), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, reduced]);

  if (count === 0) return null;

  const next = Array.from({ length: Math.min(3, count - 1) }, (_, i) => slides[(active + 1 + i) % count]).filter(
    (slide): slide is HeroSlide => slide !== undefined,
  );

  return (
    <div
      ref={root}
      className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!root.current?.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Featured guides"
        className="border-border bg-surface relative overflow-hidden rounded-lg border"
      >
        <div className="grid">
          {slides.map((slide, index) => {
            const isActive = index === active;
            return (
              <article
                key={slide.id}
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${count}`}
                aria-hidden={!isActive}
                inert={!isActive}
                className={`relative col-start-1 row-start-1 flex flex-col transition-opacity duration-700 ease-in-out motion-reduce:transition-none ${
                  isActive ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <div className="bg-surface-2 relative aspect-[16/9] w-full overflow-hidden">
                  <Photo slide={slide} sizes="(max-width: 1024px) 92vw, 56vw" priority={index === 0} />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5 sm:p-6">
                  <p className="text-secondary flex flex-wrap items-center gap-x-1.5 text-xs/4 font-extrabold tracking-[0.06em] uppercase">
                    <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                    {slide.where}
                    {slide.sectionName && <span className="text-ink-muted">· {slide.sectionName}</span>}
                  </p>
                  <h2 className="display text-[1.5rem]/[1.75rem] text-pretty sm:text-[1.875rem]/[2.125rem]">
                    <Link href={slide.href} className="after:absolute after:inset-0">
                      {slide.name}
                    </Link>
                  </h2>
                  {slide.summary && (
                    <p className="text-ink-soft line-clamp-3 text-base/6">{slide.summary}</p>
                  )}
                  <p className="text-ink-muted mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm font-semibold">
                    <span>{slide.program}</span>
                    {slide.duration && (
                      <span className="flex items-center gap-1.5">
                        <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                        {slide.duration}
                      </span>
                    )}
                    <span className="text-accent ml-auto flex items-center gap-1.5 font-extrabold">
                      Read the guide
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </span>
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {count > 1 && (
          <div className="border-border flex items-center justify-between gap-3 border-t px-4 py-2.5">
            <ul className="flex items-center gap-1.5" aria-label="Choose a guide">
              {slides.map((slide, index) => (
                <li key={slide.id}>
                  <button
                    type="button"
                    onClick={() => go(index)}
                    aria-label={`Show guide ${index + 1}: ${slide.name}`}
                    aria-current={index === active ? "true" : undefined}
                    className="flex h-8 w-6 items-center justify-center"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-300 ${
                        index === active ? "bg-accent w-6" : "bg-border-strong w-1.5"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => go(active - 1)}
                aria-label="Previous guide"
                className="hover:bg-bg-tint flex h-9 w-9 items-center justify-center rounded-md transition-colors"
              >
                <ChevronLeft aria-hidden="true" className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(active + 1)}
                aria-label="Next guide"
                className="hover:bg-bg-tint flex h-9 w-9 items-center justify-center rounded-md transition-colors"
              >
                <ChevronRight aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {next.length > 0 && (
        <ul className="flex flex-col gap-4" aria-label="Up next">
          {next.map((slide) => (
            <li key={slide.id} className="flex-1">
              <article className="border-border bg-surface relative flex h-full gap-4 overflow-hidden rounded-lg border p-3 motion-safe:animate-[hero-fade_700ms_ease-out]">
                <div className="bg-surface-2 relative min-h-32 w-24 shrink-0 self-stretch overflow-hidden rounded-md sm:w-36">
                  <Photo slide={slide} sizes="144px" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-1">
                  <p className="text-secondary text-xs/4 font-extrabold tracking-[0.06em] uppercase">
                    {slide.where}
                  </p>
                  <h3 className="display-sm text-[1.0625rem]/[1.375rem] text-pretty">{slide.name}</h3>
                  {slide.summary && (
                    <p className="text-ink-soft line-clamp-2 text-[0.8125rem]/[1.3]">{slide.summary}</p>
                  )}
                  <p className="text-ink-muted text-[0.8125rem]">
                    {slide.program}
                    {slide.duration && ` · ${slide.duration}`}
                  </p>
                  <Link
                    href={slide.href}
                    className="border-accent text-accent hover:bg-accent-soft mt-2 inline-flex min-h-9 w-fit items-center whitespace-nowrap gap-1.5 rounded-md border-[1.5px] px-3.5 text-sm font-extrabold transition-colors"
                  >
                    Read the guide
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    <span className="sr-only">: {slide.name}</span>
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
