import { SearchForm } from "@/components/search/search-form";
import type { PartnerSearch, PartnerSearchKey } from "@/core/affiliate/search";
import { routes } from "@/core/seo/site";

/**
 * The home search: our own content first, then a tab per partner search.
 *
 * No JavaScript. The tabs are radio inputs and each panel is its own GET form;
 * a `:has()` rule in globals.css shows the panel whose radio is checked. With
 * no CSS support for `:has()` every panel simply shows, stacked — still usable.
 *
 * Partner tabs submit to `/go/{slug}`, never to a partner URL: the redirector
 * resolves the brand's search from the database and attaches attribution
 * server-side, so no affiliate URL appears in this markup. The partner's name
 * sits next to each button, because a reader should know before clicking that
 * a search leaves the site — and `rel=sponsored` has no equivalent on a form.
 *
 * Tabs appear only for partner searches whose link is live; the caller passes
 * that list. With none, this is exactly the site search it replaced.
 */

interface Airport {
  code: string;
  city: string;
}

export function HeroSearch({
  partners,
  airports,
}: {
  partners: PartnerSearch[];
  airports: Airport[];
}) {
  if (partners.length === 0) return <SearchForm variant="hero" />;

  const tabs: { key: "site" | PartnerSearchKey; label: string }[] = [
    { key: "site", label: "Guides & places" },
    ...partners.map(({ key, label }) => ({ key, label })),
  ];

  return (
    <div className="search-tabs flex flex-col gap-2">
      <div
        role="radiogroup"
        aria-label="What to search"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
      >
        {tabs.map((tab, index) => (
          <label key={tab.key} className="search-tab">
            <input
              type="radio"
              name="hero-search-tab"
              value={tab.key}
              defaultChecked={index === 0}
              className="sr-only"
            />
            {tab.label}
          </label>
        ))}
      </div>

      <div data-panel="site" className="search-panel">
        <SearchForm variant="hero" />
      </div>

      {partners.map((partner) => (
        <div key={partner.key} data-panel={partner.key} className="search-panel">
          <PartnerForm partner={partner} airports={airports} />
          <PartnerNote partner={partner} />
        </div>
      ))}
    </div>
  );
}

const FIELD = "flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-2.5";
const INPUT =
  "text-ink placeholder:text-ink-muted/70 w-full min-w-0 bg-transparent text-base outline-none";
const DIVIDER = (
  <div aria-hidden="true" className="bg-border mx-1 hidden h-9 w-px shrink-0 sm:block" />
);

function PartnerForm({ partner, airports }: { partner: PartnerSearch; airports: Airport[] }) {
  const id = (name: string) => `hero-${partner.key}-${name}`;

  return (
    <form
      action={routes.affiliateRedirect(partner.linkSlug)}
      method="get"
      target="_blank"
      rel="sponsored nofollow noopener"
      className="bg-surface border-border focus-within:border-border-strong flex w-full flex-col gap-2 rounded-2xl border p-2 shadow-sm transition-colors sm:flex-row sm:items-center sm:gap-1 sm:rounded-full sm:p-1.5"
    >
      <input type="hidden" name="c" value={`home-search-${partner.key}`} />
      <input type="hidden" name="from" value="/" />

      {partner.key === "flights" ? (
        <>
          <div className={FIELD}>
            <label htmlFor={id("origin")} className="eyebrow text-ink-muted">
              From (airport code)
            </label>
            <input
              id={id("origin")}
              name="origin"
              required
              minLength={3}
              maxLength={3}
              pattern="[A-Za-z]{3}"
              placeholder="CAI"
              list={airports.length ? id("airports") : undefined}
              autoCapitalize="characters"
              className={`${INPUT} uppercase`}
            />
          </div>
          {DIVIDER}
          <div className={FIELD}>
            <label htmlFor={id("destination")} className="eyebrow text-ink-muted">
              To (airport code)
            </label>
            <input
              id={id("destination")}
              name="destination"
              required
              minLength={3}
              maxLength={3}
              pattern="[A-Za-z]{3}"
              placeholder="PAR"
              list={airports.length ? id("airports") : undefined}
              autoCapitalize="characters"
              className={`${INPUT} uppercase`}
            />
          </div>
          {DIVIDER}
          <div className={`${FIELD} sm:max-w-44`}>
            <label htmlFor={id("date")} className="eyebrow text-ink-muted">
              Departure
            </label>
            <input id={id("date")} name="date" type="date" required className={INPUT} />
          </div>
          {airports.length > 0 && (
            <datalist id={id("airports")}>
              {airports.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.city}
                </option>
              ))}
            </datalist>
          )}
        </>
      ) : (
        <div className={FIELD}>
          <label htmlFor={id("q")} className="eyebrow text-ink-muted">
            {PROMPTS[partner.key].label}
          </label>
          <input
            id={id("q")}
            name="q"
            required
            maxLength={80}
            placeholder={PROMPTS[partner.key].placeholder}
            className={INPUT}
          />
        </div>
      )}

      <button
        type="submit"
        className="bg-accent text-accent-contrast hover:bg-accent-hover shrink-0 rounded-full px-7 py-3.5 text-sm font-medium transition-colors duration-200 sm:py-4"
      >
        Search {partner.partner}
      </button>
    </form>
  );
}

/** Disclosure in context, under whichever partner panel is showing. */
function PartnerNote({ partner }: { partner: PartnerSearch }) {
  return (
    <p className="text-ink-muted px-4 text-[11px] sm:text-center">
      Opens {partner.partner} in a new tab. We may earn a commission if you book.
    </p>
  );
}

const PROMPTS: Record<Exclude<PartnerSearchKey, "flights">, { label: string; placeholder: string }> =
  {
    activities: { label: "Where are you going?", placeholder: "Paris, Kyoto, Lisbon…" },
    transfers: { label: "Arriving in which city?", placeholder: "Paris, Rome, Athens…" },
    esim: { label: "Which country?", placeholder: "France, Japan, United States…" },
  };
