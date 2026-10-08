"use client";

import { ArrowUpRight, Camera, MapPin, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export interface DestinationImage {
  src: string;
  alt: string;
  /** The partner the photograph comes from. */
  credit: string;
}

export interface DestinationCity {
  slug: string;
  name: string;
  offerCount: number;
  image: DestinationImage | null;
}

export interface DestinationCountryView {
  slug: string;
  name: string;
  offerCount: number;
  image: DestinationImage | null;
  cities: DestinationCity[];
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * The destinations page. Each country is a row: one large photograph card for
 * the country and, beside it, small cards for its cities. A search box filters
 * countries and cities as you type, and the chips under it jump to a country.
 *
 * Data arrives already shaped by the server; this component only filters and
 * lays it out, so a country with no match simply disappears and nothing is
 * invented to fill the gap.
 */
export function DestinationsExplorer({ countries }: { countries: DestinationCountryView[] }) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();

  const visible = useMemo(() => {
    if (!term) return countries;
    return countries
      .map((country) => {
        const countryMatches = country.name.toLowerCase().includes(term);
        const cities = countryMatches
          ? country.cities
          : country.cities.filter((city) => city.name.toLowerCase().includes(term));
        return countryMatches || cities.length > 0 ? { ...country, cities } : null;
      })
      .filter((country): country is DestinationCountryView => country !== null);
  }, [countries, term]);

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <div className="flex flex-col gap-4">
        <label className="border-border bg-surface focus-within:border-accent flex max-w-xl items-center gap-3 rounded-full border px-5 py-3 shadow-sm transition-colors">
          <Search aria-hidden className="text-ink-muted size-5 shrink-0" />
          <span className="sr-only">Search countries and cities</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a country or a city"
            className="placeholder:text-ink-muted min-w-0 flex-1 bg-transparent text-base outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-ink-muted hover:text-ink grid size-6 place-items-center rounded-full"
            >
              <X aria-hidden className="size-4" />
            </button>
          )}
        </label>

        {countries.length > 1 && (
          <nav aria-label="Jump to a country" className="flex flex-wrap gap-2">
            {countries.map((country) => (
              <a
                key={country.slug}
                href={`#${country.slug}`}
                className="border-border bg-surface hover:border-accent hover:text-accent rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors"
              >
                {country.name}
              </a>
            ))}
          </nav>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="border-border bg-surface text-ink-soft rounded-xl border p-8 text-center">
          No destination matches &ldquo;{query}&rdquo;. Try a country name or clear the search.
        </p>
      ) : (
        <ul className="flex flex-col gap-8 sm:gap-10">
          {visible.map((country) => (
            <li
              key={country.slug}
              id={country.slug}
              className="grid scroll-mt-24 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-5"
            >
              <CountryCard country={country} />
              <CityGrid country={country} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CountryCard({ country }: { country: DestinationCountryView }) {
  return (
    <Link
      href={`/countries/${country.slug}`}
      className="group bg-surface-2 relative isolate flex min-h-[18rem] flex-col justify-end overflow-hidden rounded-2xl sm:min-h-[22rem] lg:min-h-[26rem]"
    >
      {country.image ? (
        <Image
          src={country.image.src}
          alt={country.image.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 58vw"
          unoptimized
          referrerPolicy="no-referrer"
          className="-z-10 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <MapPin aria-hidden className="text-ink-muted/40 absolute top-6 right-6 -z-10 size-16" />
      )}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
      />
      <div className="flex items-end justify-between gap-4 p-5 sm:p-7">
        <div className="text-on-media flex flex-col gap-1.5">
          <h2 className="display text-[2rem]/[2.25rem] sm:text-[2.75rem]/[3rem]">{country.name}</h2>
          <p className="text-on-media-muted text-sm sm:text-base">
            {plural(country.offerCount, "guide")}
            {country.cities.length > 0 && ` in ${plural(country.cities.length, "city").replace("citys", "cities")}`}
          </p>
        </div>
        <span className="bg-on-media text-ink grid size-12 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1">
          <ArrowUpRight aria-hidden className="size-5" />
          <span className="sr-only">Explore {country.name}</span>
        </span>
      </div>
      {country.image && (
        <span className="text-on-media-muted absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[0.6875rem] backdrop-blur-sm">
          <Camera aria-hidden className="size-3" />
          Photo from {country.image.credit}
        </span>
      )}
    </Link>
  );
}

function CityGrid({ country }: { country: DestinationCountryView }) {
  if (country.cities.length === 0) {
    return (
      <div className="border-border bg-surface text-ink-soft flex flex-col justify-center gap-2 rounded-2xl border border-dashed p-6 text-sm/[1.6]">
        <p className="text-ink font-semibold">City guides are on the way</p>
        <p>
          Guides in {country.name} are not tied to a single city yet. They are all on the
          country page.
        </p>
      </div>
    );
  }

  const top = country.cities.slice(0, 2);

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 lg:gap-5">
      {top.map((city) => (
        <li key={city.slug} className="min-h-[13rem] lg:min-h-0">
          <Link
            href={`/countries/${country.slug}/${city.slug}`}
            className="group bg-surface-2 relative isolate flex h-full min-h-[13rem] flex-col justify-end overflow-hidden rounded-2xl lg:min-h-0"
          >
            {city.image ? (
              <Image
                src={city.image.src}
                alt={city.image.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                unoptimized
                referrerPolicy="no-referrer"
                className="-z-10 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <MapPin aria-hidden className="text-ink-muted/40 absolute top-5 right-5 -z-10 size-12" />
            )}
            <span
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
            />
            <div className="flex items-end justify-between gap-3 p-4 sm:p-5">
              <div className="text-on-media flex flex-col">
                <h3 className="display text-[1.5rem]/[1.75rem] sm:text-[1.75rem]/[2rem]">{city.name}</h3>
                <p className="text-on-media-muted text-sm">{plural(city.offerCount, "guide")}</p>
              </div>
              <span className="bg-on-media text-ink grid size-10 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1">
                <ArrowUpRight aria-hidden className="size-4" />
                <span className="sr-only">Explore {city.name}</span>
              </span>
            </div>
            {city.image && (
              <span className="text-on-media-muted absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[0.6875rem] backdrop-blur-sm">
                <Camera aria-hidden className="size-3" />
                Photo from {city.image.credit}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
