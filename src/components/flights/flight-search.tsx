"use client";

import { ArrowRightLeft, Calendar, ExternalLink, Info, PlaneLanding, PlaneTakeoff, Search } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState } from "react";

export interface Airport {
  code: string;
  city: string;
}

export interface DestinationCard {
  code: string;
  city: string;
  country: string;
  offerCount: number;
  photo: { url: string; alt: string; credit: string } | null;
}

const INPUT =
  "text-ink placeholder:text-ink-muted w-full min-w-0 bg-transparent text-base/[1.375rem] font-bold outline-none focus-visible:outline-none! placeholder:font-medium";
const FIELD =
  "bg-surface border-field hover:border-ink focus-within:border-accent focus-within:ring-accent/25 relative flex min-h-[3.75rem] min-w-0 items-center gap-3 rounded-xl border px-4 py-2 transition-colors focus-within:ring-2";

interface Picked {
  text: string;
  code: string;
}

/**
 * A city field that suggests as you type. The visitor types "Cai" and picks
 * "Cairo (CAI)"; the form submits the code. A bare three-letter code still works
 * for airports outside the list.
 */
function AirportField({
  label,
  name,
  icon: Icon,
  airports,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  icon: typeof PlaneTakeoff;
  airports: Airport[];
  value: Picked;
  onChange: (next: Picked) => void;
  placeholder: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const term = value.text.trim().toLowerCase();
  const matches = airports
    .filter(
      (airport) =>
        term.length === 0 ||
        airport.city.toLowerCase().includes(term) ||
        airport.code.toLowerCase().startsWith(term),
    )
    .slice(0, 6);

  const typed = value.text.trim();
  const code = value.code || (/^[A-Za-z]{3}$/.test(typed) ? typed.toUpperCase() : "");

  return (
    <div className={FIELD}>
      <Icon aria-hidden className="text-ink-muted size-5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col">
        <label htmlFor={id} className="text-ink-muted block text-xs/4 font-bold">
          {label}
        </label>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          autoComplete="off"
          value={value.text}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            onChange({ text: event.target.value, code: "" });
            setOpen(true);
          }}
          className={INPUT}
        />
        <input type="hidden" name={name} value={code} />
      </div>
      {open && matches.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="border-border bg-surface absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-xl border shadow-lg"
        >
          {matches.map((airport) => (
            <li key={airport.code} role="option" aria-selected={airport.code === value.code}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange({ text: `${airport.city} (${airport.code})`, code: airport.code });
                  setOpen(false);
                }}
                className="hover:bg-surface-2 flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[0.9375rem]"
              >
                <span className="font-semibold">{airport.city}</span>
                <span className="text-ink-muted font-mono text-sm">{airport.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * The flight search and the destination cards under it. They share one piece of
 * state, so picking a card fills the "To" field and scrolls the form into view.
 * The form posts to /go/{slug}, never to a partner URL.
 */
export function FlightSearch({
  action,
  partner,
  airports,
  destinations,
}: {
  action: string;
  partner: string;
  airports: Airport[];
  destinations: DestinationCard[];
}) {
  const [from, setFrom] = useState<Picked>({ text: "", code: "" });
  const [to, setTo] = useState<Picked>({ text: "", code: "" });
  const [trip, setTrip] = useState<"return" | "oneway">("return");
  const form = useRef<HTMLFormElement>(null);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const pick = (card: DestinationCard) => {
    setTo({ text: `${card.city} (${card.code})`, code: card.code });
    form.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const seg =
    "inline-flex min-h-9 cursor-pointer items-center rounded-full px-4 text-sm font-bold transition-colors";

  return (
    <div className="flex flex-col gap-10">
      <form
        ref={form}
        action={action}
        method="get"
        target="_blank"
        rel="sponsored nofollow noopener"
        className="bg-surface border-border flex flex-col gap-4 rounded-2xl border p-4 shadow-md sm:p-5"
        onSubmit={(event) => {
          const data = new FormData(event.currentTarget);
          if (!data.get("origin") || !data.get("destination")) {
            event.preventDefault();
            (event.currentTarget.querySelector('[role="combobox"]') as HTMLInputElement | null)?.focus();
          }
        }}
      >
        <input type="hidden" name="c" value="flights-page-search" />
        <input type="hidden" name="from" value="/flights" />
        <input type="hidden" name="trip" value={trip} />

        <div className="bg-bg-tint inline-flex w-fit gap-1 rounded-full p-1" role="radiogroup" aria-label="Trip type">
          {(["return", "oneway"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={trip === value}
              onClick={() => setTrip(value)}
              className={`${seg} ${trip === value ? "bg-ink text-on-media" : "text-ink-soft hover:text-ink"}`}
            >
              {value === "return" ? "Return" : "One-way"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          <div className="relative grid min-w-0 flex-[2] gap-3 sm:grid-cols-2">
            <AirportField
              label="From"
              name="origin"
              icon={PlaneTakeoff}
              airports={airports}
              value={from}
              onChange={setFrom}
              placeholder="City or airport code"
            />
            <AirportField
              label="To"
              name="destination"
              icon={PlaneLanding}
              airports={airports}
              value={to}
              onChange={setTo}
              placeholder="City or airport code"
            />
            <button
              type="button"
              onClick={swap}
              aria-label="Swap origin and destination"
              className="border-border bg-surface hover:border-ink absolute top-1/2 left-1/2 z-10 hidden size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border shadow-sm transition-colors sm:grid"
            >
              <ArrowRightLeft aria-hidden className="size-4" />
            </button>
          </div>

          <div className={`grid min-w-0 flex-[1.4] gap-3 ${trip === "return" ? "grid-cols-2" : "grid-cols-1"}`}>
            <div className={FIELD}>
              <Calendar aria-hidden className="text-ink-muted size-5 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col">
                <label htmlFor="flight-depart" className="text-ink-muted block text-xs/4 font-bold">
                  Depart
                </label>
                <input id="flight-depart" name="date" type="date" required className={INPUT} />
              </div>
            </div>
            {trip === "return" && (
              <div className={FIELD}>
                <Calendar aria-hidden className="text-ink-muted size-5 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <label htmlFor="flight-return" className="text-ink-muted block text-xs/4 font-bold">
                    Return
                  </label>
                  <input id="flight-return" name="return" type="date" className={INPUT} />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="bg-cta text-on-cta hover:bg-cta-hover inline-flex min-h-[3.75rem] shrink-0 items-center justify-center gap-2 rounded-xl px-7 text-[1.0625rem] font-extrabold whitespace-nowrap transition-colors active:translate-y-px"
          >
            <Search aria-hidden className="size-5" />
            Search flights
            <ExternalLink aria-hidden className="size-4 opacity-70" />
          </button>
        </div>

        <p className="text-ink-muted flex items-start gap-1.5 text-[0.8125rem]/[1.125rem] font-medium">
          <Info aria-hidden className="mt-px size-4 shrink-0" />
          Opens {partner} in a new tab. You book with them.
        </p>
      </form>

      {destinations.length > 0 && (
        <section aria-labelledby="fly-to" className="flex flex-col gap-4">
          <h2 id="fly-to" className="display text-[1.5rem]/[1.75rem] sm:text-[2rem]/[2.25rem]">
            Where to fly
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {destinations.map((card) => (
              <li key={card.code}>
                <button
                  type="button"
                  onClick={() => pick(card)}
                  className="group bg-surface-2 relative isolate flex aspect-[4/5] w-full flex-col justify-end overflow-hidden rounded-2xl text-left"
                >
                  {card.photo && (
                    <Image
                      src={card.photo.url}
                      alt={card.photo.alt || `${card.city}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      unoptimized
                      referrerPolicy="no-referrer"
                      className="-z-10 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  )}
                  <span
                    aria-hidden
                    className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/15 to-transparent"
                  />
                  <span className="text-on-media flex items-end justify-between gap-3 p-4">
                    <span className="flex flex-col">
                      <span className="display text-[1.5rem]/[1.75rem]">{card.city}</span>
                      <span className="text-on-media-muted text-sm">
                        {card.country} · {card.code}
                      </span>
                    </span>
                    <span className="bg-on-media text-ink grid size-10 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:-translate-y-1">
                      <PlaneLanding aria-hidden className="size-4" />
                      <span className="sr-only">Search flights to {card.city}</span>
                    </span>
                  </span>
                  {card.photo && (
                    <span className="text-on-media-muted absolute top-3 left-3 rounded-full bg-black/35 px-2.5 py-1 text-[0.6875rem] backdrop-blur-sm">
                      Photo from {card.photo.credit}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
