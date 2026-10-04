import type { CategoryKey } from "@/core/affiliate/partners";

/**
 * The ten site sections.
 *
 * They mirror the programme categories in the Travelpayouts catalogue, so every
 * partner the site works with has a section to live in. The slug is also the
 * `offer_section` database enum, which means the database can never hold an
 * offer for a section the site has no page for.
 *
 * Copy here is general, well-established advice about each kind of product (what
 * to check before you book). Nothing in this file is a price, a rating or a
 * claim about a specific provider.
 */

export const SECTION_SLUGS = [
  "tours-activities",
  "hotels",
  "car-rentals",
  "flights",
  "trains-buses",
  "transfers",
  "package-tours",
  "insurance",
  "sim-cards",
  "travel-services",
] as const;

export type SectionSlug = (typeof SECTION_SLUGS)[number];

export type SectionIcon =
  | "ticket"
  | "bed"
  | "car"
  | "plane"
  | "train"
  | "bus"
  | "package"
  | "shield"
  | "smartphone"
  | "life-buoy";

export interface SectionInfo {
  slug: SectionSlug;
  name: string;
  /** Used where space is tight: the mobile strip and the home grid. */
  shortName: string;
  icon: SectionIcon;
  summary: string;
  checklistTitle: string;
  checklist: string[];
  /** The partner group in `partners.ts` that belongs to this section, if any. */
  partnerCategory?: CategoryKey;
}

export const SECTIONS: readonly SectionInfo[] = [
  {
    slug: "tours-activities",
    name: "Tours and activities",
    shortName: "Tours",
    icon: "ticket",
    summary:
      "Tours, attraction tickets and city passes. Each guide sets out what the listing includes and what to check before you book.",
    checklistTitle: "Check before you book",
    checklist: [
      "What the ticket includes: entry, a guide, audio equipment, transport, meals.",
      "The cancellation window. It often differs between options of the same tour.",
      "The meeting point and how early to arrive. Late arrivals are often not refunded.",
      "Whether the price is per person and which age groups pay the adult rate.",
    ],
    partnerCategory: "things-to-do",
  },
  {
    slug: "hotels",
    name: "Hotels and stays",
    shortName: "Hotels",
    icon: "bed",
    summary:
      "Hotels, hostels and apartments. Offers appear here as booking partners are added.",
    checklistTitle: "Check before you book",
    checklist: [
      "The total price including taxes and local fees, not just the nightly rate.",
      "The cancellation policy and the date free cancellation ends.",
      "The exact location, and how far it is from where you will spend your days.",
      "Whether breakfast, parking or a city tax is included.",
    ],
  },
  {
    slug: "car-rentals",
    name: "Car and bike rentals",
    shortName: "Cars",
    icon: "car",
    summary:
      "Car, scooter and bike rental from the providers we work with, and what to check before you book.",
    checklistTitle: "Check before you book",
    checklist: [
      "Licence: some countries require an International Driving Permit alongside your national licence.",
      "Deposit: many desks block a deposit on a credit card and will not take a debit card for it.",
      "Insurance excess: basic cover often leaves you liable for a large excess. Decide before you are at the desk.",
      "Fuel policy: full-to-full is usually the fairest.",
      "Cross-border: if you plan to cross a border, confirm it is allowed and whether it costs extra.",
      "Photograph the car, every panel and the fuel gauge, before you drive away and again on return.",
    ],
    partnerCategory: "car-hire",
  },
  {
    slug: "flights",
    name: "Flights",
    shortName: "Flights",
    icon: "plane",
    summary: "Search flights with our partners and compare before you book.",
    checklistTitle: "Check before you book",
    checklist: [
      "What the fare includes: cabin bag, checked bag, seat selection.",
      "Whether the airports and the connection time suit you.",
      "The fare's change and cancellation rules.",
      "That the name on the booking matches your passport exactly.",
    ],
  },
  {
    slug: "trains-buses",
    name: "Trains and buses",
    shortName: "Trains",
    icon: "train",
    summary:
      "Train and bus tickets. Offers appear here as they are published.",
    checklistTitle: "Check before you book",
    checklist: [
      "Whether the ticket is for one specific departure or flexible.",
      "Whether a seat reservation is included or costs extra.",
      "The station each service leaves from; large cities have several.",
      "How the ticket is delivered and whether you need to print it.",
    ],
  },
  {
    slug: "transfers",
    name: "Transfers and airport",
    shortName: "Transfers",
    icon: "bus",
    summary:
      "A booked transfer removes the uncertainty of arriving tired in an unfamiliar airport. Compare the providers we work with.",
    checklistTitle: "Check before you book",
    checklist: [
      "What happens if your flight is delayed. Reputable services track the flight and adjust the pickup.",
      "Whether the price is per vehicle or per person, and what luggage is included.",
      "How the driver will find you at arrivals.",
      "Whether a fast airport train is quicker and cheaper. In many cities it is.",
      "If you land late at night or travel with children or heavy bags, a booked transfer is worth the most.",
    ],
    partnerCategory: "transfers",
  },
  {
    slug: "package-tours",
    name: "Package tours",
    shortName: "Packages",
    icon: "package",
    summary:
      "Multi-day tours and packages. Offers appear here as they are published.",
    checklistTitle: "Check before you book",
    checklist: [
      "Exactly what is included: flights, hotels, transfers, meals, entry fees.",
      "The group size and the departure dates.",
      "The cancellation and change rules for the whole package.",
      "What is not included and will cost extra on the trip.",
    ],
  },
  {
    slug: "insurance",
    name: "Insurance",
    shortName: "Insurance",
    icon: "shield",
    summary:
      "A policy is only as good as the situations it actually covers. What to check first, and where to get a quote.",
    checklistTitle: "Check before you buy",
    checklist: [
      "Medical cover: emergency treatment and repatriation are the reason to insure at all. Check the limit.",
      "Pre-existing conditions: many policies exclude them unless declared. Declare everything.",
      "Activities: skiing, diving and scooters are often excluded or need an add-on.",
      "Cancellation cover starts on the day the policy does, so buy it when you book the trip.",
      "Excess: the amount you pay on each claim. A cheap policy with a high excess may cover less than it seems.",
      "Some countries require proof of medical insurance for a visa, sometimes with a minimum amount of cover.",
    ],
    partnerCategory: "insurance",
  },
  {
    slug: "sim-cards",
    name: "SIM cards and eSIM",
    shortName: "SIM",
    icon: "smartphone",
    summary:
      "Buy a data plan before you fly, install it, and connect when you land. Compare the eSIM services we work with.",
    checklistTitle: "Check before you buy",
    checklist: [
      "Your phone must support eSIM and not be locked to your home carrier.",
      "Install before you travel and activate when you arrive. Check whether the plan's validity starts on install or on first connection.",
      "Most travel eSIMs are data-only. Your home number stays on your normal SIM for calls and texts.",
      "Turn on data roaming for the eSIM line only.",
      "If your phone has no eSIM, a travel SIM card is the fallback.",
    ],
    partnerCategory: "esim",
  },
  {
    slug: "travel-services",
    name: "Travel services",
    shortName: "Services",
    icon: "life-buoy",
    summary:
      "Flight compensation claims, luggage storage and other services for when a trip needs help.",
    checklistTitle: "Check before you start",
    checklist: [
      "Claim services keep a share of any compensation they recover. Check the percentage before you agree.",
      "Keep your boarding pass, booking confirmation and any messages from the airline.",
      "Luggage storage: check the opening hours, the price per bag and the size limits.",
    ],
    partnerCategory: "claims",
  },
];

const BY_SLUG = new Map<string, SectionInfo>(SECTIONS.map((section) => [section.slug, section]));

export function isSectionSlug(value: string): value is SectionSlug {
  return BY_SLUG.has(value);
}

export function getSection(slug: string): SectionInfo | null {
  return BY_SLUG.get(slug) ?? null;
}

/** A country page is indexed only when it has enough offers to be worth a visit. */
export const MIN_OFFERS_FOR_COUNTRY_PAGE = 3;

/**
 * Sections whose providers can be compared side by side. A comparison is only
 * ever made inside one category: flights are never set against an eSIM. A section
 * joins this list once it has partners to compare.
 */
export const COMPARE_SECTIONS: readonly SectionInfo[] = SECTIONS.filter(
  (section) => section.partnerCategory !== undefined,
);

export function comparePath(section: SectionSlug): string {
  return `/compare/${section}`;
}

export function sectionPath(section: SectionSlug): string {
  return `/${section}`;
}

export function sectionCountryPath(section: SectionSlug, countrySlug: string): string {
  return `/${section}/${countrySlug}`;
}

export function offerPath(section: SectionSlug, countrySlug: string, slug: string): string {
  return `/${section}/${countrySlug}/${slug}`;
}

export function countryHubPath(countrySlug: string): string {
  return `/countries/${countrySlug}`;
}
