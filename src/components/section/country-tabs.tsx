import Link from "next/link";

import type { CountryWithOffers } from "@/core/offers/offers";

/**
 * The destination filter: one tab per country that has offers, plus "All".
 * Each tab is a real link, so it works without JavaScript and every country
 * page can be reached and indexed.
 */
export function CountryTabs({
  countries,
  allHref,
  hrefFor,
  activeSlug,
  label = "Filter by country",
}: {
  countries: CountryWithOffers[];
  allHref: string;
  hrefFor: (countrySlug: string) => string;
  activeSlug?: string;
  label?: string;
}) {
  if (countries.length === 0) return null;

  const base =
    "inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm font-bold whitespace-nowrap transition-colors";
  const on = "border-accent bg-accent-soft text-ink";
  const off = "border-border-strong bg-surface text-ink-soft hover:border-ink hover:text-ink";

  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto px-1 pb-1">
      <ul className="flex gap-2">
        <li>
          <Link href={allHref} className={`${base} ${activeSlug ? off : on}`} aria-current={activeSlug ? undefined : "page"}>
            All countries
          </Link>
        </li>
        {countries.map((country) => (
          <li key={country.id}>
            <Link
              href={hrefFor(country.slug)}
              className={`${base} ${activeSlug === country.slug ? on : off}`}
              aria-current={activeSlug === country.slug ? "page" : undefined}
            >
              {country.name}
              <span className="text-ink-muted ml-1.5 tabular-nums">{country.offerCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
