import type { ReactNode } from "react";

import type { PartnerSearch, PartnerSearchKey } from "@/core/affiliate/search";
import { routes } from "@/core/seo/site";

/**
 * The home search: our own content first, then a tab per partner search.
 *
 * One solid card rather than glass. The earlier version laid a translucent
 * panel over the photograph and then a second bordered pill inside it, which
 * read as two nested containers and left the tab labels at low contrast. A
 * single white surface carries the tabs and the fields, and everything on it is
 * charcoal on white.
 *
 * No JavaScript. The tabs are radio inputs and each panel is its own GET form;
 * a `:has()` rule in globals.css shows the panel whose radio is checked. With no
 * `:has()` support every panel simply shows, stacked, which still works.
 *
 * Partner tabs submit to `/go/{slug}`, never to a partner URL: the redirector
 * resolves the brand's search from the database and attaches attribution
 * server-side, so no affiliate URL appears in this markup. The partner's name is
 * on the button and repeated in a note, because a reader should know before
 * clicking that a search leaves the site and may earn us a commission.
 *
 * Tabs appear only for partner searches whose link is live; the caller passes
 * that list.
 */

interface Airport {
  code: string;
  city: string;
}

type TabKey = "site" | PartnerSearchKey;

export function HeroSearch({
  partners,
  airports,
}: {
  partners: PartnerSearch[];
  airports: Airport[];
}) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "site", label: "Guides & places" },
    ...partners.map(({ key, label }) => ({ key, label })),
  ];

  return (
    <div className="search-tabs bg-surface rounded-lg shadow-lg">
      {tabs.length > 1 && (
        <div
          role="radiogroup"
          aria-label="What to search"
          className="flex gap-0.5 overflow-x-auto p-2 pb-0 [scrollbar-width:none] sm:p-3 sm:pb-0"
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
              <TabIcon name={tab.key} />
              {tab.label}
            </label>
          ))}
        </div>
      )}

      <div className="p-3 sm:p-4">
        <div data-panel="site" className="search-panel">
          <SiteForm />
        </div>

        {partners.map((partner) => (
          <div key={partner.key} data-panel={partner.key} className="search-panel">
            <PartnerForm partner={partner} airports={airports} />
          </div>
        ))}
      </div>
    </div>
  );
}

const FIELDS = "grid gap-2";
const FIELD =
  "bg-surface border-field focus-within:border-accent flex min-w-0 items-center gap-3 rounded-md border px-3.5 py-2.5 transition-colors";
const LABEL = "text-ink-muted block text-xs/4 font-semibold";
const INPUT =
  "text-ink placeholder:text-ink-muted/70 w-full min-w-0 bg-transparent text-[0.9375rem] font-bold outline-none placeholder:font-medium";
const BUTTON =
  "bg-cta text-on-cta hover:bg-cta-hover inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md px-7 py-3 text-base font-extrabold transition-colors duration-200";

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={FIELD}>
      <span aria-hidden="true" className="text-ink-muted shrink-0">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}

function SiteForm() {
  return (
    <form
      action="/search"
      method="get"
      role="search"
      className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
    >
      <div className={`${FIELDS} flex-1`}>
        <Field id="hero-site-q" label="Where do you want to go?" icon={<Icon name="search" />}>
          <input
            id="hero-site-q"
            name="q"
            type="search"
            placeholder="Lisbon, Kyoto, the Amalfi Coast…"
            className={INPUT}
          />
        </Field>
      </div>
      <button type="submit" className={BUTTON}>
        <Icon name="search" />
        Search
      </button>
    </form>
  );
}

function PartnerForm({ partner, airports }: { partner: PartnerSearch; airports: Airport[] }) {
  const id = (name: string) => `hero-${partner.key}-${name}`;
  // Every partner except flights is a single free-text field. Narrowing here,
  // once, keeps the JSX below free of casts.
  const prompt = partner.key === "flights" ? null : PROMPTS[partner.key];

  return (
    <div className="flex flex-col gap-3">
      <form
        action={routes.affiliateRedirect(partner.linkSlug)}
        method="get"
        target="_blank"
        rel="sponsored nofollow noopener"
        className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
      >
        <input type="hidden" name="c" value={`home-search-${partner.key}`} />
        <input type="hidden" name="from" value="/" />

        {prompt === null ? (
          <div className={`${FIELDS} flex-1 grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_1.2fr]`}>
            <Field id={id("origin")} label="From" icon={<Icon name="takeoff" />}>
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
                autoComplete="off"
                className={`${INPUT} uppercase`}
              />
            </Field>
            <Field id={id("destination")} label="To" icon={<Icon name="landing" />}>
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
                autoComplete="off"
                className={`${INPUT} uppercase`}
              />
            </Field>
            <Field id={id("date")} label="Depart" icon={<Icon name="calendar" />}>
              <input id={id("date")} name="date" type="date" required className={INPUT} />
            </Field>
            <Field id={id("return")} label="Return" icon={<Icon name="calendar" />}>
              <input id={id("return")} name="return" type="date" className={INPUT} />
            </Field>
            {airports.length > 0 && (
              <datalist id={id("airports")}>
                {airports.map((airport) => (
                  <option key={airport.code} value={airport.code}>
                    {airport.city}
                  </option>
                ))}
              </datalist>
            )}
          </div>
        ) : (
          <div className={`${FIELDS} flex-1`}>
            <Field
              id={id("q")}
              label={prompt.label}
              icon={<Icon name={partner.key === "esim" ? "sim" : "pin"} />}
            >
              <input
                id={id("q")}
                name="q"
                required
                maxLength={80}
                placeholder={prompt.placeholder}
                className={INPUT}
              />
            </Field>
          </div>
        )}

        <button type="submit" className={BUTTON}>
          Search {partner.partner}
          <Icon name="external" />
        </button>
      </form>

      <p className="text-ink-muted flex items-start gap-2 px-1 text-xs/[1.5]">
        <Icon name="info" className="mt-px h-3.5 w-3.5 shrink-0" />
        Opens {partner.partner} in a new tab. We may earn a commission if you book.
      </p>
    </div>
  );
}

const PROMPTS: Record<Exclude<PartnerSearchKey, "flights">, { label: string; placeholder: string }> =
  {
    activities: { label: "Where are you going?", placeholder: "Paris, Kyoto, Lisbon…" },
    transfers: { label: "Arriving in which city?", placeholder: "Paris, Rome, Athens…" },
    esim: { label: "Which country?", placeholder: "France, Japan, United States…" },
  };

/* -------------------------------------------------------------------------
   Icons. Inline, 1.5px stroke, currentColor — no icon library for eleven
   glyphs. Decorative only: every one sits beside a text label.
   ------------------------------------------------------------------------- */

type IconName =
  | "search"
  | "takeoff"
  | "landing"
  | "calendar"
  | "pin"
  | "sim"
  | "external"
  | "info"
  | "ticket"
  | "car"
  | "plane";

const PATHS: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.5 13.5 3 3" />
    </>
  ),
  takeoff: <path d="M3 15.5h14M4.5 11.5l9.6-3.1a1.6 1.6 0 0 0-.9-3.1L9 6.4 5.6 3.5 4.3 4l2 3.6-3 1z" />,
  landing: <path d="M3 15.5h14M3.7 8.6l1.4-1 9 2.2 2.3-.6a1.6 1.6 0 0 1 .8 3.1L4.6 14.4 3.7 8.6z" />,
  calendar: (
    <>
      <rect x="3.5" y="4.5" width="13" height="12" rx="2" />
      <path d="M3.5 8.5h13M7 3v3M13 3v3" />
    </>
  ),
  pin: (
    <>
      <path d="M10 17s5.5-4.6 5.5-9A5.5 5.5 0 0 0 4.5 8c0 4.4 5.5 9 5.5 9z" />
      <circle cx="10" cy="8" r="2" />
    </>
  ),
  sim: (
    <>
      <path d="M6 2.5h6l3.5 3.5v10a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 16V4A1.5 1.5 0 0 1 6 2.5z" />
      <rect x="7.5" y="9" width="5" height="5" rx="1" />
    </>
  ),
  external: <path d="M8 4.5H5A1.5 1.5 0 0 0 3.5 6v9A1.5 1.5 0 0 0 5 16.5h9a1.5 1.5 0 0 0 1.5-1.5v-3M11 3.5h5.5V9M16.5 3.5 9 11" />,
  info: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 9v4.5M10 6.6v.01" />
    </>
  ),
  ticket: <path d="M3 7.5V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1.5a2.5 2.5 0 0 0 0 5V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1.5a2.5 2.5 0 0 0 0-5zM12 5v10" />,
  car: (
    <>
      <path d="M4 13.5v-3l1.4-3.7A1.5 1.5 0 0 1 6.8 6h6.4a1.5 1.5 0 0 1 1.4 1l1.4 3.5v3M4 13.5h12M4 13.5v1.8M16 13.5v1.8" />
      <circle cx="7" cy="11.2" r=".6" />
      <circle cx="13" cy="11.2" r=".6" />
    </>
  ),
  plane: <path d="M17 9.5 11.5 8 7 3.5l-1.5.5 2 4.5L4.5 9.5 3 8l-1 .5 1.5 3 3 1.5.5-1 3-1.5 4.5 2 .5-1.5L11.5 10l5.5-.5z" />,
};

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

const TAB_ICON: Record<TabKey, IconName> = {
  site: "search",
  flights: "plane",
  activities: "ticket",
  transfers: "car",
  esim: "sim",
};

function TabIcon({ name }: { name: TabKey }) {
  return <Icon name={TAB_ICON[name]} className="h-[1.125rem] w-[1.125rem]" />;
}
