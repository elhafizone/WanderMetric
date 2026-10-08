/**
 * Side-by-side comparison data for the Compare pages.
 *
 * Every cell restates what the partner says on its own website, read on
 * `readOn`; nothing is our rating, and there are no prices or commission
 * figures. A criterion the partner did not state is `null` and is shown as
 * "Not stated", never guessed. Order is editorial, not by who pays most.
 *
 * Framework-free. The affiliate destination is not here: `linkSlug` is the
 * `affiliate_links.slug` behind /go/{slug}, and a row is shown only while that
 * link is live.
 */

export type CriterionIcon = "type" | "globe" | "cancel" | "support" | "star";

export interface Criterion {
  key: string;
  label: string;
  icon: CriterionIcon;
}

export interface CompareRow {
  linkSlug: string;
  name: string;
  /** What kind of service it is, shown as the row's chip. */
  kind: string;
  /** The partner's own site icon, saved under /public/partners. */
  logo?: string;
  values: Record<string, string | null>;
  sourceUrl: string;
  readOn: string;
}

export interface CompareTableData {
  criteria: Criterion[];
  rows: CompareRow[];
}

const READ_ON = "2026-10-08";

const CAR_CRITERIA: Criterion[] = [
  { key: "model", label: "How it works", icon: "type" },
  { key: "coverage", label: "Coverage", icon: "globe" },
  { key: "cancellation", label: "Cancellation", icon: "cancel" },
  { key: "support", label: "Support", icon: "support" },
  { key: "extra", label: "Also states", icon: "star" },
];

export const COMPARE: Partial<Record<string, CompareTableData>> = {
  "car-hire": {
    criteria: CAR_CRITERIA,
    rows: [
      {
        linkSlug: "economybookings",
        logo: "/partners/economybookings.ico",
        name: "EconomyBookings",
        kind: "Car comparison",
        values: {
          model: "Compares 600+ rental suppliers in one search",
          coverage: "20,000+ locations in 180+ countries",
          cancellation: "Free up to 48 hours before pick-up",
          support: "24/5, multilingual",
          extra: "Verified customer ratings per supplier; trading since 2008",
        },
        sourceUrl: "https://www.economybookings.com/",
        readOn: READ_ON,
      },
      {
        linkSlug: "qeeq",
        logo: "/partners/qeeq.png",
        name: "QEEQ",
        kind: "Car comparison",
        values: {
          model: "Compares 1,000+ rental companies side by side",
          coverage: null,
          cancellation: "Lists free cancellation; terms are set out at booking",
          support: "24/7, including WhatsApp, Line and Kakao",
          extra: "US$1 prepay to hold a booking; optional AXA insurance; price-drop rebooking",
        },
        sourceUrl: "https://www.qeeq.com/",
        readOn: READ_ON,
      },
      {
        linkSlug: "autoeurope",
        logo: "/partners/autoeurope.png",
        name: "Auto Europe",
        kind: "Car comparison",
        values: {
          model: "Compares rental companies' rates",
          coverage: "28,000 pick-up locations worldwide",
          cancellation: "Free up to 48 hours before pick-up",
          support: "Seven days a week",
          extra: "No credit card fees; also rents motorhomes",
        },
        sourceUrl: "https://www.autoeurope.eu/",
        readOn: READ_ON,
      },
      {
        linkSlug: "getrentacar",
        logo: "/partners/getrentacar.png",
        name: "GetRentacar.com",
        kind: "Local owners",
        values: {
          model: "Marketplace of cars from local owners, with deposit and no-deposit rentals",
          coverage: "100,000+ vehicles in around 100 countries",
          cancellation: "Free cancellation shown on listings",
          support: "In 30+ languages",
          extra: "Rated 4.4 out of 5 from 292 reviews, as shown on its own site",
        },
        sourceUrl: "https://getrentacar.com/",
        readOn: READ_ON,
      },
      {
        linkSlug: "localrent",
        logo: "/partners/localrent.png",
        name: "Localrent",
        kind: "Local suppliers",
        values: {
          model: "Local rental companies, organised by country",
          coverage: "Europe, Asia and Africa",
          cancellation: null,
          support: null,
          extra: "States an average deposit of about €300, some with none; no hidden fees",
        },
        sourceUrl: "https://www.localrent.com/",
        readOn: READ_ON,
      },
      {
        linkSlug: "bikesbooking",
        logo: "/partners/bikesbooking.ico",
        name: "BikesBooking.com",
        kind: "Bikes & scooters",
        values: {
          model: "Compares 942 rental companies for bicycles, scooters, motorcycles and quads",
          coverage: "Worldwide",
          cancellation: "Free on most bookings",
          support: "24/7, multilingual",
          extra: "Price Match Guarantee; no credit card fees",
        },
        sourceUrl: "https://bikesbooking.com/en/",
        readOn: READ_ON,
      },
    ],
  },
};
