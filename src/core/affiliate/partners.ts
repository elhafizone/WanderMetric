/**
 * What each partner is, in one line, for the category pages.
 *
 * Every sentence here restates what the partner says about itself on its own
 * site (checked September 2026); nothing is our claim about their quality, and
 * there are no prices, ratings or commission figures. The link itself is not
 * here: `linkSlug` is the `affiliate_links.slug` behind `/go/{slug}`, and a
 * partner is listed only while that link is live in the database, so a paused
 * or removed link drops the row instead of leaving a button that 404s.
 *
 * Order is editorial, not by who pays most.
 */

export interface PartnerInfo {
  /** `affiliate_links.slug`; the button goes to `/go/{linkSlug}`. */
  linkSlug: string;
  name: string;
  /** Short kind label shown as a chip, e.g. "Car hire". */
  kind: string;
  summary: string;
  /** Up to three points: what the partner says about itself, and at most one plain caution. */
  points: string[];
}

export type CategoryKey = "car-hire" | "transfers" | "esim" | "insurance" | "things-to-do" | "claims";

export const PARTNERS: Record<CategoryKey, PartnerInfo[]> = {
  "car-hire": [
    {
      linkSlug: "economybookings",
      name: "EconomyBookings",
      kind: "Car comparison",
      summary: "Compares cars from many suppliers in one search.",
      points: ["More than 175,000 cars", "20,000 locations worldwide"],
    },
    {
      linkSlug: "qeeq",
      name: "QEEQ",
      kind: "Car comparison",
      summary: "Compares rental deals from well-known brands, with optional rental insurance.",
      points: ["Brands include Hertz, Sixt, Alamo and Dollar", "Optional rental insurance"],
    },
    {
      linkSlug: "getrentacar",
      name: "GetRentacar.com",
      kind: "Car rental",
      summary: "Car rental without a driver in around 100 countries.",
      points: ["Deposit and no-deposit rentals", "Around 100 countries"],
    },
    {
      linkSlug: "localrent",
      name: "Localrent",
      kind: "Local suppliers",
      summary: "Car rental from local companies in Europe, Asia and Africa, organised by country.",
      points: ["Local rental companies", "Europe, Asia and Africa"],
    },
    {
      linkSlug: "autoeurope",
      name: "Auto Europe",
      kind: "Car comparison",
      summary: "Compares car rental rates at 180 destinations, and also rents motorhomes.",
      points: ["180 destinations", "In business since 1954"],
    },
    {
      linkSlug: "bikesbooking",
      name: "BikesBooking.com",
      kind: "Bikes & scooters",
      summary: "Motorcycle, scooter, bicycle and quad bike rental for places where two wheels beat four.",
      points: ["1,700 locations worldwide", "Motorcycles, scooters, bicycles and quads"],
    },
  ],

  transfers: [
    {
      linkSlug: "welcome-pickups",
      name: "Welcome Pickups",
      kind: "Airport transfers",
      summary: "A local driver meets you on arrival. Also in-city and sightseeing rides.",
      points: ["Airport and port transfers", "City pages for each destination"],
    },
    {
      linkSlug: "kiwitaxi",
      name: "Kiwitaxi",
      kind: "Airport transfers",
      summary: "An international system for booking airport and city transfers in advance.",
      points: ["More than 2,000 cities and airports", "Booked online before you travel"],
    },
    {
      linkSlug: "gettransfer",
      name: "GetTransfer.com",
      kind: "Transfers & rides",
      summary: "Transfers, rides and chauffeured car rental, with a choice of vehicle class.",
      points: ["150 countries", "Choose your vehicle class"],
    },
    {
      linkSlug: "intui-travel",
      name: "Intui.travel",
      kind: "Airport transfers",
      summary: "Airport transfers carried out by local professional companies.",
      points: ["Shuttle bus and economy", "Private transfers", "Car-plus-boat connections"],
    },
    {
      linkSlug: "radical-storage",
      name: "Radical Storage",
      kind: "Luggage storage",
      summary: "Places to leave your bags in a city, for the gap between checkout and your flight.",
      points: ["Luggage storage in cities worldwide", "Open 24/7 (as stated by the provider)"],
    },
  ],

  esim: [
    {
      linkSlug: "airalo",
      name: "Airalo",
      kind: "eSIM",
      summary: "eSIMs for iPhone, iPad and Android, with country, regional and global plans.",
      points: ["More than 200 destinations", "Data plans for countries, regions or the world"],
    },
    {
      linkSlug: "yesim",
      name: "Yesim",
      kind: "eSIM",
      summary: "Prepaid eSIMs with both fixed and unlimited data plans and no contracts.",
      points: ["170+ countries", "Fixed and unlimited plans"],
    },
    {
      linkSlug: "saily",
      name: "Saily",
      kind: "eSIM",
      summary: "An eSIM service from the team behind NordVPN.",
      points: ["Plans for hundreds of countries", "An unlimited global plan", "Optional phone numbers"],
    },
    {
      linkSlug: "drimsim",
      name: "Drimsim",
      kind: "Travel SIM card",
      summary: "A physical SIM card for travel: the option for a phone that has no eSIM.",
      points: ["Coverage in 197 countries", "No monthly fee"],
    },
  ],

  insurance: [
    {
      linkSlug: "ekta",
      name: "EKTA",
      kind: "Travel insurance",
      summary: "Travel insurance sold online for any nationality and any destination.",
      points: ["Ages from 2 months to 100 years", "Any destination"],
    },
  ],

  "things-to-do": [
    {
      linkSlug: "tiqets",
      name: "Tiqets",
      kind: "Tickets",
      summary: "Instant mobile tickets for museums, attractions and activities, organised by city.",
      points: ["Museums, attractions, theme parks", "Skip-the-line options where offered"],
    },
    {
      linkSlug: "klook",
      name: "Klook",
      kind: "Tours & tickets",
      summary: "Attraction tickets, tours, local day trips and airport transfers.",
      points: ["Discounted attraction tickets", "Day tours and food trips"],
    },
    {
      linkSlug: "kkday",
      name: "KKday",
      kind: "Tours & tickets",
      summary: "Tickets, tours and activities worldwide, plus eSIMs and flight-and-hotel packages.",
      points: ["Worldwide activities", "Also sells eSIMs and packages"],
    },
    {
      linkSlug: "go-city",
      name: "Go City",
      kind: "Sightseeing passes",
      summary: "One pass that covers a set of attractions in a city, used as you choose.",
      points: ["Pass covers multiple attractions", "Worth it only if you visit enough of them"],
    },
    {
      linkSlug: "wegotrip",
      name: "WeGoTrip",
      kind: "Audio tours",
      summary: "Self-guided audio tours on your phone, some with attraction tickets included.",
      points: ["Download tours in advance", "Play offline at your own pace"],
    },
  ],

  claims: [
    {
      linkSlug: "airhelp",
      name: "AirHelp",
      kind: "Flight compensation",
      summary: "Handles compensation claims for delayed or cancelled flights.",
      points: ["Delays, cancellations, denied boarding", "Check the fee before you sign"],
    },
    {
      linkSlug: "compensair",
      name: "Compensair",
      kind: "Flight compensation",
      summary: "Handles claims for a delayed, cancelled or overbooked flight.",
      points: ["Delays, cancellations, denied boarding", "Check the fee before you sign"],
    },
  ],
};
