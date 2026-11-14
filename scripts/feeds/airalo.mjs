#!/usr/bin/env node
/**
 * Catalogue offers from Airalo's product feed: one offer per country, listing
 * every local plan in the feed with its price.
 *
 *   node scripts/feeds/airalo.mjs [--refresh] [--dry] [--date YYYY-MM-DD]
 *
 * Feed and access terms: docs/travelpayouts.md ("Data from Airalo"). Regional
 * and global plans have no single country, so they are left out for now.
 * Countries that already have a hand-written Airalo offer are skipped.
 */
import path from "node:path";
import { LEGACY_OFFERS_WITHOUT_IMAGES } from "../lib/visual-policy.mjs";
import {
  count,
  fetchCached,
  humanDate,
  inline,
  isGenerated,
  loadAllOffers,
  money,
  OFFERS_DIR,
  parseArgs,
  removeGenerated,
  today,
  travelpayoutsLink,
  writeGenerated,
} from "./lib/common.mjs";
import { countryTable, ensureCountry, LAUNCH_PLACES, loadPlaces, prunePlaces, savePlaces } from "./lib/places.mjs";
import { offerProblems } from "./lib/validate-offer.mjs";

const PROGRAMME = "airalo";
const GENERATOR = "feeds/airalo";
const FEED = "https://www.airalo.com/products.xml";
/** The campaign and promo IDs Travelpayouts' Airalo article gives (541 / 8310). */
const LINK = { campaignId: 541, promoId: 8310 };

const args = parseArgs();
const refresh = Boolean(args.refresh);
const dry = Boolean(args.dry);
const date = String(args.date ?? today());

const decode = (s) =>
  s.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const cdata = (s) => decode(s.replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "").trim());
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? cdata(m[1]) : "";
};

/** One feed item → a plan. */
function parseItem(xml) {
  const details = {};
  for (const m of xml.matchAll(/<g:product_detail>([\s\S]*?)<\/g:product_detail>/g)) {
    const name = tag(m[1], "g:attribute_name");
    const value = tag(m[1], "g:attribute_value");
    if (name) (details[name] ??= []).push(value);
  }
  const [amount, currency] = tag(xml, "g:price").split(/\s+/);
  const sale = tag(xml, "g:sale_price").split(/\s+/)[0];
  return {
    id: tag(xml, "g:id"),
    title: tag(xml, "g:title"),
    group: tag(xml, "g:item_group_id"),
    canonical: tag(xml, "g:canonical_link"),
    image: tag(xml, "g:image_link"),
    price: Number(sale) > 0 ? Number(sale) : Number(amount),
    currency: currency || "USD",
    available: tag(xml, "g:availability") === "in_stock",
    coverage: details.Coverage?.[0] ?? "",
    scope: details.Destinations?.[0] ?? "",
    data: details["Data package"]?.[0] ?? "",
    validity: details.Validity?.[0] ?? "",
    networks: details["Supported networks"] ?? [],
    planType: details["Plan type"]?.[0] ?? "",
    validityPolicy: details["Validity policy"]?.[0] ?? "",
    ekyc: details["eKYC Details"]?.[0] ?? "",
    topUps: details["Available top-ups"]?.[0] ?? "",
    other: details["Other info"] ?? [],
  };
}

const gb = (data) => (/unlimited/i.test(data) ? Infinity : parseFloat(data) * (/mb/i.test(data) ? 0.001 : 1));
const days = (validity) => parseInt(validity, 10) || 0;
const label = (plan) => `${plan.data.replace(/^Unlimited GB$/i, "Unlimited data")}, ${plan.validity}`;

/** "Yes" / "No" when every plan agrees, else "Some plans". */
function agree(plans, key) {
  const values = new Set(plans.map((p) => p[key]).filter(Boolean));
  if (!values.size) return null;
  return values.size === 1 ? [...values][0] : "Some plans";
}

/** A smaller copy from Airalo's own image server (the original is a 1 MB PNG). */
const cardImage = (url) => {
  const u = new URL(url);
  u.search = "?w=800&format=jpg";
  return u.toString();
};

function buildFacts(country, plans) {
  const cheapest = plans[0];
  const networks = [...new Set(plans.flatMap((p) => p.networks).map(inline).filter(Boolean))];
  const planTypes = [...new Set(plans.map((p) => p.planType).filter(Boolean))];
  const dataOptions = [...new Set([...plans].sort((a, b) => gb(a.data) - gb(b.data)).map((p) => p.data.replace(/^Unlimited GB$/i, "Unlimited")))];
  const validities = [...new Set(plans.map((p) => days(p.validity)).filter(Boolean))].sort((a, b) => a - b);
  const facts = {
    provider: "Airalo",
    coverage: country.name,
    plans_listed: plans.length,
    data_options: dataOptions.join(", "),
    validity_options: `${validities.join(", ")} days`,
  };
  if (planTypes.length) facts.plan_type = planTypes.join(" or ");
  if (networks.length) facts.network = networks.join(", ");
  const policy = [...count(plans, (p) => p.validityPolicy).entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (policy) facts.validity_policy = policy;
  const ekyc = agree(plans, "ekyc");
  if (ekyc) facts.id_verification_ekyc = ekyc;
  const topUps = agree(plans, "topUps");
  if (topUps) facts.top_ups = topUps;
  facts.cheapest_plan = `${label(cheapest)}: ${money(cheapest.price, cheapest.currency)}`;
  const notes = [...new Set(plans.flatMap((p) => p.other).map((n) => inline(n.replace(/^-\s*\[\s*\]\s*/, ""))).filter(Boolean))];
  if (notes.length) facts.unclear_on_listing = notes.join(" ");
  facts.image_credit = "Airalo";
  facts.images = [{ url: cardImage(cheapest.image), alt: `Airalo's ${country.name} eSIM card for the ${label(cheapest)} plan` }];
  return facts;
}

function buildBody(country, plans, readOn) {
  const when = humanDate(readOn);
  const sorted = [...plans].sort((a, b) => days(a.validity) - days(b.validity) || gb(a.data) - gb(b.data) || a.price - b.price);
  const lines = [
    "## What it is",
    "",
    `Airalo sells prepaid eSIM data plans for ${country.name}. You buy a plan on Airalo's website or app and install it as an eSIM on your phone, alongside your usual SIM. Airalo's feed listed ${plans.length} local plan${plans.length === 1 ? "" : "s"} for ${country.name} on ${when}.`,
    "",
    "## Plans and prices",
    "",
    "| Data | Valid for | Price | Price per GB |",
    "|---|---|---|---|",
  ];
  for (const p of sorted) {
    const perGb = Number.isFinite(gb(p.data)) && gb(p.data) > 0 ? money(p.price / gb(p.data), p.currency) : "—";
    lines.push(`| ${inline(p.data.replace(/^Unlimited GB$/i, "Unlimited"))} | ${inline(p.validity)} | ${money(p.price, p.currency)} | ${perGb} |`);
  }
  lines.push("", `Prices are in ${plans[0].currency}, as Airalo's feed gives them. Price per GB is the plan price divided by its data allowance.`, "");

  const how = [];
  const policy = [...count(plans, (p) => p.validityPolicy).entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (policy) how.push(`${policy.replace(/\.?$/, ".")}`);
  const topUps = agree(plans, "topUps");
  if (topUps === "Yes") how.push("Every plan can be topped up.");
  else if (topUps === "Some plans") how.push("Some plans can be topped up; check the plan on Airalo.");
  const ekyc = agree(plans, "ekyc");
  if (ekyc === "Yes") how.push("Airalo asks for ID verification (eKYC) before the plan works.");
  else if (ekyc === "No") how.push("Airalo lists no ID verification (eKYC) for these plans.");
  else if (ekyc === "Some plans") how.push("Some plans need ID verification (eKYC) first.");
  const types = [...new Set(plans.map((p) => p.planType).filter(Boolean))];
  if (types.length) how.push(`Plan type: ${types.join(" or ")}.`);
  if (how.length) lines.push("## How the plans work", "", how.join(" "), "");

  lines.push(
    "## Where this page comes from",
    "",
    `This page was built on ${when} from Airalo's product feed, the plan list Airalo publishes for its affiliates. Airalo's checkout shows the final price and whether your phone supports eSIM.`,
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------

console.log(`Airalo: reading the feed (cache ${refresh ? "bypassed" : "on"})…`);
const xml = await fetchCached(FEED, { cacheKey: "airalo/products.xml", ttlHours: 20, refresh, as: "text" });
const plans = xml
  .split("<item>")
  .slice(1)
  .map((s) => parseItem(s.split("</item>")[0]))
  .filter((p) => p.available && p.price > 0 && p.group.startsWith("country-") && p.scope === "Local");
console.log(`  ${plans.length} local plans in the feed`);

const all = loadAllOffers();
const slugOwner = new Map(all.map((o) => [o.data.slug, o.file]));
const takenPrimary = new Set();
const mine = new Map(); // country slug → offer file
const handWrittenCountries = new Set();
for (const o of all) {
  if (isGenerated(o.data, GENERATOR)) {
    mine.set(o.data.country, o);
    continue;
  }
  if (o.programme === PROGRAMME && o.data.country) handWrittenCountries.add(o.data.country);
  const first = o.data.facts?.images?.[0]?.url;
  if (first) takenPrimary.add(first.trim().replace(/\/+$/, ""));
}

const table = await countryTable({ refresh });
const places = loadPlaces();
const groups = new Map();
for (const p of plans) (groups.get(p.group) ?? groups.set(p.group, []).get(p.group)).push(p);

const written = new Set();
const results = [];
const skipped = [];
for (const [group, list] of [...groups.entries()].sort()) {
  const name = list[0].coverage || group.replace(/^country-/, "").replace(/-/g, " ");
  const country = ensureCountry(places, table, { name }) ?? ensureCountry(places, table, { name: group.replace(/^country-/, "") });
  if (!country) {
    skipped.push(`unknown country: ${name}`);
    continue;
  }
  if (handWrittenCountries.has(country.slug)) {
    skipped.push("written by hand");
    continue;
  }
  const sorted = [...list].sort((a, b) => a.price - b.price || gb(a.data) - gb(b.data));
  const source = sorted[0].canonical || `https://www.airalo.com/${group.replace(/^country-/, "")}-esim`;
  if (!/^https:\/\/www\.airalo\.com\//.test(source)) {
    skipped.push("no listing URL");
    continue;
  }
  const image = cardImage(sorted[0].image);
  if (takenPrimary.has(image)) {
    skipped.push("main image used by another offer");
    continue;
  }
  const slug = mine.get(country.slug)?.data.slug ?? `airalo-esim-${country.slug}`;
  if (slugOwner.has(slug) && !mine.has(country.slug)) {
    skipped.push("slug taken");
    continue;
  }
  const file = path.join(OFFERS_DIR, PROGRAMME, `${slug}.json`);
  const cheapest = money(sorted[0].price, sorted[0].currency);

  const build = (readOn) => ({
    programme: PROGRAMME,
    tier: "catalogue",
    generated_by: GENERATOR,
    section: "sim-cards",
    country: country.slug,
    kind: "eSIM",
    title: `Airalo eSIM for ${country.name}: ${sorted.length} data plan${sorted.length === 1 ? "" : "s"} from ${cheapest}`,
    slug,
    source_url: source,
    read_on: readOn,
    affiliate_url: travelpayoutsLink({ ...LINK, url: source, subId: `wm-airalo-${country.slug}` }),
    price_note: `Read on ${humanDate(readOn)} from Airalo's product feed: plans from ${cheapest}.`,
    price_from: sorted[0].price,
    currency: sorted[0].currency,
    weight: sorted.length,
    facts: buildFacts(country, sorted),
    summary: `Airalo's prepaid eSIM for ${country.name}: ${sorted.length} local data plan${sorted.length === 1 ? "" : "s"}, from ${cheapest} for ${label(sorted[0])}.`,
    body: buildBody(country, sorted, readOn),
  });

  const problems = offerProblems(build(date), { places, legacy: LEGACY_OFFERS_WITHOUT_IMAGES });
  if (problems.length) {
    skipped.push(`gate: ${problems[0]}`);
    continue;
  }
  results.push(writeGenerated(file, GENERATOR, build, { date, dry }));
  written.add(country.slug);
  takenPrimary.add(image);
  slugOwner.set(slug, file);
}

let removed = 0;
for (const [countrySlug, o] of mine) {
  if (!written.has(countrySlug) && removeGenerated(o.file, GENERATOR, { dry })) removed++;
}
savePlaces(dry ? places : prunePlaces(places, loadAllOffers(), LAUNCH_PLACES), { dry });

const tally = (list) => [...count(list, (x) => x).entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(", ");
console.log(`\nAiralo catalogue${dry ? " (dry run, nothing written)" : ""}:`);
console.log(`  ${written.size} country offers · ${tally(results)} · ${removed} removed`);
console.log(`  skipped: ${tally(skipped) || "none"}`);
