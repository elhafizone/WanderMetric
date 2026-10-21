import { Search } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/layout/container";

export interface DiscoveryCountry {
  slug: string;
  name: string;
  offerCount: number;
}

/**
 * The discovery bar, set directly under the hero.
 *
 * It is the one place on the home page where a visitor can type. The search is
 * a plain GET form to /search (it works without JavaScript, and is linkable),
 * and the placeholder and the chips come from the countries that actually have
 * guides, so nothing suggests a place the site cannot answer for. There are no
 * dates, guest counts or price fields: the site has no inventory to search.
 */
export function DiscoveryBar({ countries }: { countries: DiscoveryCountry[] }) {
  const example = countries[0]?.name;
  const placeholder = example ? `Try “${example}”` : "Search by place or partner";

  return (
    <Container className="pt-8 sm:pt-10">
      <div className="border-border bg-surface flex flex-col gap-5 rounded-2xl border p-5 shadow-md sm:p-7 lg:flex-row lg:items-center lg:gap-10">
        <form action="/search" method="get" role="search" className="flex-1">
          <label htmlFor="home-search" className="text-ink mb-2 block text-[0.9375rem] font-bold">
            Where do you want to go?
          </label>
          <div className="border-field focus-within:border-ink flex items-center gap-2 rounded-full border bg-white p-1.5 pl-5 transition-colors">
            <Search aria-hidden="true" className="text-ink-muted h-5 w-5 shrink-0" />
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder={placeholder}
              className="text-ink placeholder:text-ink-muted min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none"
            />
            <button
              type="submit"
              className="bg-cta text-on-cta hover:bg-cta-hover shrink-0 rounded-full px-6 py-3 text-[0.9375rem] font-bold transition-colors duration-200"
            >
              Search
            </button>
          </div>
        </form>

        {countries.length > 0 && (
          <nav aria-label="Browse by country" className="lg:max-w-[26rem]">
            <p className="text-ink-muted mb-2 text-[0.8125rem] font-semibold">Or start from a country</p>
            <ul className="flex flex-wrap gap-2">
              {countries.map((country) => (
                <li key={country.slug}>
                  <Link
                    href={`/countries/${country.slug}`}
                    className="border-border-strong text-ink hover:border-ink hover:bg-bg-tint inline-flex min-h-10 items-center gap-1 rounded-full border px-4 text-sm font-semibold transition-colors"
                  >
                    {country.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </Container>
  );
}
