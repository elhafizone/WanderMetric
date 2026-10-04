import type { CategoryConfig } from "@/components/category/category-page";

/**
 * The four partner category pages. Copy states general, well-established advice
 * about each product (the same points our guides make); nothing here is a price,
 * a rating or a claim about a specific provider.
 */

export const CAR_HIRE: CategoryConfig = {
  key: "car-hire",
  path: "/car-hire",
  crumb: "Car hire",
  title: "Compare car hire",
  description:
    "The providers we work with, what each is best at, and what to check before you book. You book directly with them.",
  searchTab: "cars",
  checklistTitle: "Check before you book",
  checklist: [
    "Licence: some countries require an International Driving Permit alongside your national licence.",
    "Deposit: many desks block a deposit on a credit card and will not take a debit card for it.",
    "Insurance excess: basic cover often leaves you liable for a large excess. Decide before you are at the desk.",
    "Fuel policy: full-to-full is usually the fairest.",
    "Cross-border: if you plan to cross a border, confirm it is allowed and whether it costs extra.",
    "Photograph the car, every panel and the fuel gauge, before you drive away and again on return.",
  ],
  guideSlug: "car-and-bike-rental-guide",
};

export const TRANSFERS: CategoryConfig = {
  key: "transfers",
  path: "/transfers",
  crumb: "Transfers",
  title: "Compare airport transfers",
  description:
    "A booked transfer removes the uncertainty of arriving tired in an unfamiliar airport. Compare the providers we work with.",
  searchTab: "transfers",
  checklistTitle: "Check before you book",
  checklist: [
    "What happens if your flight is delayed. Reputable services track the flight and adjust the pickup.",
    "Whether the price is per vehicle or per person, and what luggage is included.",
    "How the driver will find you at arrivals.",
    "Whether a fast airport train is quicker and cheaper. In many cities it is.",
    "If you land late at night or travel with children or heavy bags, a booked transfer is worth the most.",
  ],
  guideSlug: "airport-transfers-guide",
};

export const ESIM: CategoryConfig = {
  key: "esim",
  path: "/esim",
  crumb: "eSIM",
  title: "Compare travel eSIMs",
  description:
    "Buy a data plan before you fly, install it, and connect when you land. Compare the eSIM services we work with.",
  searchTab: "esim",
  checklistTitle: "Check before you buy",
  checklist: [
    "Your phone must support eSIM and not be locked to your home carrier.",
    "Install before you travel and activate when you arrive. Check whether the plan's validity starts on install or on first connection.",
    "Most travel eSIMs are data-only. Your home number stays on your normal SIM for calls and texts.",
    "Turn on data roaming for the eSIM line only.",
    "If your phone has no eSIM, a travel SIM card is the fallback.",
  ],
  guideSlug: "travel-esim-guide",
};

export const INSURANCE: CategoryConfig = {
  key: "insurance",
  path: "/insurance",
  crumb: "Insurance",
  title: "Travel insurance, explained plainly",
  description:
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
  guideSlug: "travel-insurance-guide",
  also: {
    key: "claims",
    title: "If your flight goes wrong",
    description:
      "A long delay or a cancellation can entitle you to compensation. These services handle the claim for you, for a share of it.",
    guideSlug: "flight-delay-compensation-eu",
  },
};
