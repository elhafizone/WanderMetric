/**
 * Help pages on the flights page, each summarising one page of a partner's own
 * website in our own words.
 *
 * Framework-free and free of any URL that earns commission: an item names its
 * affiliate link by `linkSlug`, and the real destination lives in the database
 * (`affiliate_links`), reached through /go/{slug}. `sourceUrl` is the partner
 * page that was read, shown as attribution. Everything stated here was stated
 * on that page on `readOn`; nothing is added from memory.
 *
 * Kiwi.com is absent on purpose: its programme issues only ready-made links,
 * so there is no per-page link to attach.
 */

export type FlightHelpGroup = "before" | "wrong";
export type FlightHelpIcon =
  | "info"
  | "baggage"
  | "clock"
  | "checkin"
  | "child"
  | "pet"
  | "refund"
  | "edit"
  | "shield"
  | "scale"
  | "fee";

export interface FlightHelpItem {
  /** Also the `affiliate_links.slug`. */
  linkSlug: string;
  group: FlightHelpGroup;
  icon: FlightHelpIcon;
  partner: string;
  title: string;
  summary: string;
  points: string[];
  sourceUrl: string;
  readOn: string;
}

const READ_ON = "2026-10-08";

export const FLIGHT_HELP: FlightHelpItem[] = [
  {
    linkSlug: "aviasales-how-it-works",
    group: "before",
    icon: "info",
    partner: "Aviasales",
    title: "How booking through Aviasales works",
    summary:
      "Aviasales is a search service. It compares airlines and agencies, then sends you to the seller to pay.",
    points: [
      "You pick a ticket and press Buy; the seller's site takes your passenger details and payment.",
      "The seller, not Aviasales, emails your itinerary receipt.",
      "Refunds and exchanges go through the seller named on that receipt.",
    ],
    sourceUrl: "https://www.aviasales.com/faq/how-aviasales-works",
    readOn: READ_ON,
  },
  {
    linkSlug: "aviasales-find-ticket-with-baggage",
    group: "before",
    icon: "baggage",
    partner: "Aviasales",
    title: "Finding a fare that includes baggage",
    summary:
      "A filter shows only fares with baggage, so you do not discover the fee at the last step.",
    points: [
      "Turn on the “With baggage only” slider under the search form.",
      "The allowance appears on the ticket card when the seller supplied it.",
      "If it did not, you only see that baggage is included; size and weight show at booking.",
    ],
    sourceUrl: "https://www.aviasales.com/faq/how-do-i-find-a-ticket-including-baggage",
    readOn: READ_ON,
  },
  {
    linkSlug: "aviasales-add-baggage",
    group: "before",
    icon: "baggage",
    partner: "Aviasales",
    title: "Adding baggage to a ticket",
    summary:
      "Adding it while booking is the simplest route; after purchase there are still three ways.",
    points: [
      "Before buying: use the baggage toggle on the ticket card or at the seller's checkout.",
      "After buying: ask the airline, with your booking number and surname, or contact the seller.",
      "At the airport desk it works too, but can cost more than adding it in advance.",
    ],
    sourceUrl: "https://www.aviasales.com/faq/how-do-i-add-baggage",
    readOn: READ_ON,
  },
  {
    linkSlug: "aviasales-arrive-at-airport",
    group: "before",
    icon: "clock",
    partner: "Aviasales",
    title: "How early to arrive at the airport",
    summary: "The advice depends on whether you have checked in and whether you carry baggage.",
    points: [
      "Checked in online with carry-on only: about 1.5 hours before departure.",
      "Not checked in: about 2.5 hours before departure.",
      "Checked in but with baggage to drop: also about 2.5 hours.",
    ],
    sourceUrl: "https://www.aviasales.com/faq/how-early-should-i-arrive-at-the-airport",
    readOn: READ_ON,
  },
  {
    linkSlug: "aviasales-online-check-in",
    group: "before",
    icon: "checkin",
    partner: "Aviasales",
    title: "Checking in online",
    summary:
      "Online check-in usually opens 24 hours before the flight and closes 40 minutes before it.",
    points: [
      "Have your name, booking code (PNR) or e-ticket number, booking email and departure airport ready.",
      "Choosing a seat is sometimes free and, on many airlines, now costs extra.",
      "Some airlines charge a fee if you do not check in online, so check the carrier's rules.",
    ],
    sourceUrl: "https://www.aviasales.com/faq/how-do-i-check-in-for-my-flight-online",
    readOn: READ_ON,
  },
  {
    linkSlug: "aviasales-child-ticket",
    group: "before",
    icon: "child",
    partner: "Aviasales",
    title: "Buying tickets for children and infants",
    summary:
      "Choose a passenger category before searching, and the price you see covers everyone.",
    points: [
      "Infants under 2 travelling on a lap generally need no ticket, but you must tell the airline.",
      "Only one infant without a seat can fly per adult.",
      "To add a child after booking, contact the seller named on your ticket.",
    ],
    sourceUrl: "https://www.aviasales.com/faq/how-do-i-buy-a-child-ticket",
    readOn: READ_ON,
  },
  {
    linkSlug: "aviasales-travel-with-pet",
    group: "before",
    icon: "pet",
    partner: "Aviasales",
    title: "Flying with a pet",
    summary:
      "A pet can travel in the cabin, in the heated hold or as cargo, and is paid for separately.",
    points: [
      "Each airline sets its own carrier size, breed, weight and age rules.",
      "Start preparing months ahead for documents and vaccinations.",
      "Call the airline right after booking with your pet's species, age, weight with carrier and carrier size, and get confirmation for your aircraft.",
    ],
    sourceUrl: "https://www.aviasales.com/faq/what-do-i-need-to-do-to-bring-my-pet-with-me",
    readOn: READ_ON,
  },
  {
    linkSlug: "aviasales-return-or-exchange",
    group: "before",
    icon: "refund",
    partner: "Aviasales",
    title: "Returning or exchanging a ticket",
    summary:
      "What you can get back depends on the fare and the airline's rules, and the seller handles it.",
    points: [
      "Some fares allow a full or partial refund or a free exchange; others allow neither.",
      "Contact the seller named on your ticket to learn which rules apply.",
      "If you will miss the flight, tell the airline as early as you can.",
    ],
    sourceUrl: "https://www.aviasales.com/faq/i-want-to-return-or-exchange-my-ticket-how-do-i-do-that",
    readOn: READ_ON,
  },
  {
    linkSlug: "aviasales-correct-booking-mistake",
    group: "before",
    icon: "edit",
    partner: "Aviasales",
    title: "Correcting a mistake in your booking",
    summary: "Only the seller can fix passenger details, and it may cost a fee.",
    points: [
      "Contact the seller named on your ticket; they quote the airline's fare rules.",
      "The seller may add its own fee for corrections.",
      "The ticket normally reaches your email within about 3 hours of booking.",
    ],
    sourceUrl: "https://www.aviasales.com/faq/i-made-mistake-my-details-when-booking-how-do-i-correct-it",
    readOn: READ_ON,
  },
  {
    linkSlug: "airhelp-flight-delay-compensation",
    group: "wrong",
    icon: "clock",
    partner: "AirHelp",
    title: "Flight delayed: what you may be owed",
    summary:
      "Cash compensation for a delay comes from EU rules, not US law, and it depends on where you flew.",
    points: [
      "Under EC 261, delays of 3 hours or more may qualify for up to €600 ($650).",
      "US law does not require cash compensation for delays; meals or hotel help are up to the airline.",
      "In the US, a significant delay can entitle you to a ticket refund.",
    ],
    sourceUrl: "https://www.airhelp.com/en/flight-delay-compensation/",
    readOn: READ_ON,
  },
  {
    linkSlug: "airhelp-flight-cancellation-compensation",
    group: "wrong",
    icon: "shield",
    partner: "AirHelp",
    title: "Flight cancelled: your options",
    summary:
      "Rebooking or a refund is your first right; compensation applies mainly on EU flights.",
    points: [
      "Under EU 261, up to €600 ($650) is possible when the airline is at fault.",
      "US rules require an automatic refund if you decline the alternative flight, but no cash compensation.",
      "Rebooking on the next available flight should come at no extra cost.",
    ],
    sourceUrl: "https://www.airhelp.com/en/flight-cancellation-compensation/",
    readOn: READ_ON,
  },
  {
    linkSlug: "airhelp-denied-boarding-compensation",
    group: "wrong",
    icon: "scale",
    partner: "AirHelp",
    title: "Denied boarding",
    summary:
      "The most common cause is an overbooked flight, and your rights depend on the route.",
    points: [
      "You can ask for a refund and a return flight instead of the alternative offered.",
      "Accepting an offer may mean giving up further compensation, so read it first.",
      "Without a boarding pass, any document with the airline's booking reference works.",
    ],
    sourceUrl: "https://www.airhelp.com/en/denied-boarding-compensation/",
    readOn: READ_ON,
  },
  {
    linkSlug: "airhelp-flight-refund",
    group: "wrong",
    icon: "refund",
    partner: "AirHelp",
    title: "Refund or compensation: the difference",
    summary:
      "A refund returns the fare; compensation makes up for the inconvenience, and you can sometimes have both.",
    points: [
      "You may refuse a flight delayed by more than 5 hours and ask for a refund.",
      "The same applies if a cancellation came under 14 days before departure and the new flight does not suit you.",
      "It covers flights leaving the EU, or arriving in it on an EU airline.",
    ],
    sourceUrl: "https://www.airhelp.com/en/flight-refund/",
    readOn: READ_ON,
  },
  {
    linkSlug: "airhelp-our-fees",
    group: "wrong",
    icon: "fee",
    partner: "AirHelp",
    title: "What AirHelp charges",
    summary:
      "There are two models: a fee taken from what you win, or an annual membership bought before a disruption.",
    points: [
      "No Win, No Fee: a standard 35% fee is deducted, so you receive up to 65%.",
      "AirHelp+: from $179.99 per year, with no fee deducted from what you win.",
      "AirHelp states it pays the legal costs whether you win or lose.",
    ],
    sourceUrl: "https://www.airhelp.com/en/our-fees/",
    readOn: READ_ON,
  },
  {
    linkSlug: "compensair-flight-delay",
    group: "wrong",
    icon: "scale",
    partner: "Compensair",
    title: "EU delay compensation, by distance",
    summary:
      "For arrival delays of 3 hours or more, the amount depends on how far you flew.",
    points: [
      "€250 for 1,500 km or less; €400 for longer flights inside the EU and flights of 1,500 to 3,500 km.",
      "€300 or €600 above 3,500 km, depending on whether the delay is 3 to 4 hours or over 4.",
      "Not owed when the delay is caused by extraordinary circumstances.",
    ],
    sourceUrl: "https://www.compensair.com/en/flight-delay/",
    readOn: READ_ON,
  },
  {
    linkSlug: "compensair-flight-cancellation",
    group: "wrong",
    icon: "shield",
    partner: "Compensair",
    title: "What counts as a cancellation",
    summary:
      "Compensair sets out when a changed flight is a cancellation and not just a delay.",
    points: [
      "The original schedule is abandoned and you move to another scheduled flight.",
      "The aircraft took off but returned, and you were put on another flight.",
      "It lands at an airport other than your final destination, unless you accepted re-routing or the airports serve the same city.",
    ],
    sourceUrl: "https://www.compensair.com/en/flight-cancellation/",
    readOn: READ_ON,
  },
];

export function flightHelpSlugs(): string[] {
  return FLIGHT_HELP.map((item) => item.linkSlug);
}
