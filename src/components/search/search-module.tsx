import {
  ArrowRight,
  BedDouble,
  Bus,
  Calendar,
  Car,
  Check,
  ExternalLink,
  Info,
  MapPin,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Search,
  Smartphone,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import type { PartnerSearch, PartnerSearchKey } from "@/core/affiliate/search";
import { routes } from "@/core/seo/site";

/**
 * The tabbed search module: the identity's centrepiece, and the first thing a
 * visitor uses.
 *
 * No JavaScript. The tabs are radio inputs and each panel is its own GET form;
 * a `:has()` rule in globals.css shows the panel whose radio is checked, and
 * with no `:has()` support every panel simply shows, stacked, which still
 * works.
 *
 * Partner tabs submit to `/go/{slug}`, never to a partner URL: the redirector
 * resolves the brand's search from the database and attaches attribution
 * server-side, so no affiliate URL appears in this markup. The button names the
 * partner and a note repeats it, because a reader should know before clicking
 * that a search leaves the site and may earn us a commission.
 *
 * A tab appears only when its link is live. "Car hire" is different: there is
 * no verified way to deep-link a car search into a partner (their location IDs
 * are their own), so that tab leads to our own comparison page instead of
 * pretending to be a form. "Stays" is shown disabled with a "Soon" badge until
 * a hotel programme is approved.
 */

interface Airport {
  code: string;
  city: string;
}

export type TabKey = PartnerSearchKey | "cars";

const TABS: Array<{ key: TabKey; label: string; icon: LucideIcon }> = [
  { key: "flights", label: "Flights", icon: Plane },
  { key: "cars", label: "Car hire", icon: Car },
  { key: "transfers", label: "Transfers", icon: Bus },
  { key: "activities", label: "Things to do", icon: Ticket },
  { key: "esim", label: "eSIM", icon: Smartphone },
];

const PROMPTS: Record<
  Exclude<PartnerSearchKey, "flights">,
  { label: string; placeholder: string; cta: string; icon: LucideIcon }
> = {
  transfers: {
    label: "Arriving in",
    placeholder: "City, e.g. Paris",
    cta: "Find transfers",
    icon: MapPin,
  },
  activities: {
    label: "Where",
    placeholder: "City or attraction",
    cta: "Find things to do",
    icon: MapPin,
  },
  esim: {
    label: "Destination",
    placeholder: "Country, e.g. Japan",
    cta: "Compare eSIMs",
    icon: Smartphone,
  },
};

const FIELD =
  "bg-surface border-field hover:border-ink focus-within:border-accent focus-within:ring-accent/25 flex min-h-[3.75rem] min-w-0 items-center gap-3 rounded-md border px-3.5 py-2 transition-colors focus-within:ring-2";
const LABEL = "text-ink-muted block text-xs/4 font-bold";
const INPUT =
  "text-ink placeholder:text-ink-muted w-full min-w-0 bg-transparent text-base/[1.375rem] font-bold tabular-nums outline-none placeholder:font-medium";
const CTA =
  "bg-cta text-on-cta hover:bg-cta-hover inline-flex h-[3.25rem] shrink-0 items-center justify-center gap-2 rounded-full px-7 text-[1.0625rem] font-bold transition-colors active:translate-y-px lg:h-[3.75rem]";

export function SearchModule({
  partners,
  airports,
  initialTab,
}: {
  partners: PartnerSearch[];
  airports: Airport[];
  /** The tab to open on, when the page is about one thing (car hire, eSIMs). */
  initialTab?: TabKey;
}) {
  const live = new Map(partners.map((partner) => [partner.key, partner]));
  const tabs = TABS.filter((tab) => tab.key === "cars" || live.has(tab.key as PartnerSearchKey));
  const first = tabs.some((tab) => tab.key === initialTab) ? initialTab : (tabs[0]?.key ?? "cars");

  return (
    <div className="search-tabs bg-surface border-border overflow-hidden rounded-xl border shadow-md">
      <div
        role="radiogroup"
        aria-label="What are you searching for?"
        className="border-border flex gap-1 overflow-x-auto border-b px-2 pt-2 [scrollbar-width:none]"
      >
        {tabs.map((tab) => (
          <label key={tab.key} className="search-tab">
            <input
              type="radio"
              name="search-tab"
              value={tab.key}
              defaultChecked={tab.key === first}
              className="sr-only"
            />
            <tab.icon aria-hidden="true" className="h-[1.125rem] w-[1.125rem]" />
            {tab.label}
          </label>
        ))}
        <span
          aria-disabled="true"
          title="Stays is coming soon"
          className="text-ink-muted flex h-12 shrink-0 cursor-not-allowed items-center gap-2 px-3.5 text-[0.9375rem] font-semibold"
        >
          <BedDouble aria-hidden="true" className="h-[1.125rem] w-[1.125rem]" />
          Stays
          <span className="bg-bg-tint text-ink-soft rounded-full px-[0.4375rem] py-0.5 text-[0.6875rem]/4 font-extrabold tracking-[0.04em] uppercase">
            Soon
          </span>
        </span>
      </div>

      {tabs.map((tab) => (
        <div key={tab.key} data-panel={tab.key} className="search-panel">
          {tab.key === "flights" && live.has("flights") ? (
            <FlightsForm partner={live.get("flights")!} airports={airports} />
          ) : tab.key === "cars" ? (
            <CarHirePanel />
          ) : (
            <TextForm
              partner={live.get(tab.key as PartnerSearchKey)!}
              prompt={PROMPTS[tab.key as Exclude<PartnerSearchKey, "flights">]}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Field({
  id,
  label,
  icon: FieldIcon,
  className,
  children,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${FIELD} ${className ?? ""}`}>
      <FieldIcon aria-hidden="true" className="text-ink-muted h-5 w-5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}

function PartnerNote({ partner }: { partner: string }) {
  return (
    <p className="text-ink-muted flex items-start gap-1.5 text-[0.8125rem]/[1.125rem] font-medium">
      <Info aria-hidden="true" className="mt-px h-4 w-4 shrink-0" />
      <span>
        Opens {partner} in a new tab. You book with them.
      </span>
    </p>
  );
}

function FlightsForm({ partner, airports }: { partner: PartnerSearch; airports: Airport[] }) {
  return (
    <form
      action={routes.affiliateRedirect(partner.linkSlug)}
      method="get"
      target="_blank"
      rel="sponsored nofollow noopener"
      className="flight-form"
    >
      <input type="hidden" name="c" value="home-search-flights" />
      <input type="hidden" name="from" value="/" />

      <div className="flex flex-col gap-2 p-3 lg:flex-row lg:p-4">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2 lg:flex-nowrap">
          <Field
            id="flights-origin"
            label="From"
            icon={PlaneTakeoff}
            className="basis-full lg:basis-0 lg:flex-1"
          >
            <input
              id="flights-origin"
              name="origin"
              required
              minLength={3}
              maxLength={3}
              pattern="[A-Za-z]{3}"
              placeholder="Airport code, e.g. CAI"
              list={airports.length ? "flights-airports" : undefined}
              autoCapitalize="characters"
              autoComplete="off"
              className={`${INPUT} uppercase`}
            />
          </Field>
          <Field
            id="flights-destination"
            label="To"
            icon={PlaneLanding}
            className="basis-full lg:basis-0 lg:flex-1"
          >
            <input
              id="flights-destination"
              name="destination"
              required
              minLength={3}
              maxLength={3}
              pattern="[A-Za-z]{3}"
              placeholder="Airport code, e.g. PAR"
              list={airports.length ? "flights-airports" : undefined}
              autoCapitalize="characters"
              autoComplete="off"
              className={`${INPUT} uppercase`}
            />
          </Field>
          <Field
            id="flights-date"
            label="Depart"
            icon={Calendar}
            className="basis-[calc(50%-0.25rem)] lg:basis-0 lg:flex-1"
          >
            <input id="flights-date" name="date" type="date" required className={INPUT} />
          </Field>
          <Field
            id="flights-return"
            label="Return"
            icon={Calendar}
            className="field-return basis-[calc(50%-0.25rem)] lg:basis-0 lg:flex-1"
          >
            <input id="flights-return" name="return" type="date" className={INPUT} />
          </Field>
        </div>

        <button type="submit" className={CTA}>
          <Search aria-hidden="true" className="h-5 w-5" />
          Search flights
          <ExternalLink aria-hidden="true" className="h-4 w-4 opacity-70" />
        </button>
      </div>

      <div className="flex flex-col gap-2 px-3 pb-3 lg:flex-row lg:items-center lg:justify-between lg:px-4 lg:pb-3.5">
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Trip type">
          <label className="trip-chip">
            <input type="radio" name="trip" value="return" defaultChecked className="sr-only" />
            <Check aria-hidden="true" className="trip-check h-3.5 w-3.5" />
            Return
          </label>
          <label className="trip-chip">
            <input type="radio" name="trip" value="oneway" className="sr-only" />
            <Check aria-hidden="true" className="trip-check h-3.5 w-3.5" />
            One-way
          </label>
        </div>
        <PartnerNote partner={partner.partner} />
      </div>

      {airports.length > 0 && (
        <datalist id="flights-airports">
          {airports.map((airport) => (
            <option key={airport.code} value={airport.code}>
              {airport.city}
            </option>
          ))}
        </datalist>
      )}
    </form>
  );
}

function TextForm({
  partner,
  prompt,
}: {
  partner: PartnerSearch;
  prompt: { label: string; placeholder: string; cta: string; icon: LucideIcon };
}) {
  const id = `${partner.key}-q`;
  return (
    <form
      action={routes.affiliateRedirect(partner.linkSlug)}
      method="get"
      target="_blank"
      rel="sponsored nofollow noopener"
    >
      <input type="hidden" name="c" value={`home-search-${partner.key}`} />
      <input type="hidden" name="from" value="/" />

      <div className="flex flex-col gap-2 p-3 lg:flex-row lg:p-4">
        <Field id={id} label={prompt.label} icon={prompt.icon} className="lg:flex-1">
          <input
            id={id}
            name="q"
            required
            maxLength={80}
            placeholder={prompt.placeholder}
            autoComplete="off"
            className={INPUT}
          />
        </Field>
        <button type="submit" className={CTA}>
          <Search aria-hidden="true" className="h-5 w-5" />
          {prompt.cta}
          <ExternalLink aria-hidden="true" className="h-4 w-4 opacity-70" />
        </button>
      </div>
      <div className="px-3 pb-3 lg:px-4 lg:pb-3.5">
        <PartnerNote partner={partner.partner} />
      </div>
    </form>
  );
}

function CarHirePanel() {
  return (
    <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between lg:p-4">
      <div className="flex items-start gap-3 lg:max-w-[42rem]">
        <span className="bg-accent-soft text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.625rem]">
          <Car aria-hidden="true" className="h-[1.375rem] w-[1.375rem]" />
        </span>
        <p className="text-ink-soft text-[0.9375rem]/[1.5rem]">
          <strong className="text-ink">Compare car hire providers.</strong> We list the
          providers we work with, what each is best at, and what to check before you
          book: deposit, insurance excess and fuel policy.
        </p>
      </div>
      <Link href="/car-hire" className={CTA}>
        Compare car hire
        <ArrowRight aria-hidden="true" className="h-5 w-5" />
      </Link>
    </div>
  );
}
