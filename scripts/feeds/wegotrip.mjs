#!/usr/bin/env node
/**
 * Catalogue offers from WeGoTrip's partner API.
 *
 *   node scripts/feeds/wegotrip.mjs [--target 720] [--per-city 30] [--refresh] [--dry] [--date YYYY-MM-DD]
 *
 * Takes WeGoTrip's most popular products that are on sale (at most --per-city in
 * one city), skips products already written up by hand, and writes one offer
 * file per product. A product that is no longer on sale loses its file; the
 * site withdraws its page on the next bundle import.
 *
 * Source and checks: docs/travelpayouts.md. The listing's "from" price is the
 * product's top-level `price`; priceLevels do not match the live page and are
 * never used.
 */
import path from "node:path";
import { LEGACY_OFFERS_WITHOUT_IMAGES } from "../lib/visual-policy.mjs";
import {
  count,
  fetchCached,
  humanDate,
  imageServes,
  inline,
  isGenerated,
  loadAllOffers,
  mapLimit,
  money,
  OFFERS_DIR,
  parseArgs,
  plainText,
  removeGenerated,
  slugify,
  today,
  travelpayoutsLink,
  trimSlug,
  writeGenerated,
} from "./lib/common.mjs";
import { countryTable, ensureCity, ensureCountry, LAUNCH_PLACES, loadPlaces, prunePlaces, savePlaces } from "./lib/places.mjs";
import { offerProblems } from "./lib/validate-offer.mjs";

const PROGRAMME = "wegotrip";
const GENERATOR = "feeds/wegotrip";
const API = "https://app.wegotrip.com/api/v2";
/** The campaign and promo IDs of this site's own dashboard-made WeGoTrip links. */
const LINK = { campaignId: 150, promoId: 4487 };

const args = parseArgs();
const target = Number(args.target ?? 720);
const perCity = Number(args["per-city"] ?? 30);
const refresh = Boolean(args.refresh);
const dry = Boolean(args.dry);
const date = String(args.date ?? today());

async function api(query, key, ttlHours = 20) {
  const body = await fetchCached(`${API}${query}`, {
    cacheKey: `wegotrip/${key}.json`,
    ttlHours,
    refresh,
    headers: { "Accept-Language": "en" },
  });
  return body.data;
}

async function paged(query, key, ttlHours) {
  const out = [];
  for (let page = 1; ; page++) {
    const sep = query.includes("?") ? "&" : "?";
    const data = await api(`${query}${sep}page=${page}`, `${key}-${page}`, ttlHours);
    out.push(...(data.results ?? []));
    if (!data.next || page >= (data.pages ?? page)) break;
  }
  return out;
}

/** WeGoTrip product ID from a stored offer. */
function productId(offer) {
  if (Number(offer?.facts?.product_id) > 0) return Number(offer.facts.product_id);
  const m = String(offer?.source_url ?? "").match(/-p(\d+)\/?(?:[?#].*)?$/);
  return m ? Number(m[1]) : null;
}

const norm = (url) => String(url ?? "").trim().replace(/\/+$/, "");
/** Partner list items; one that stops at exactly 100 characters mid-sentence was cut short at entry, so it says so. */
const clean = (list) => [
  ...new Set(
    (Array.isArray(list) ? list : [])
      .map(inline)
      .filter(Boolean)
      .map((s) => (s.length === 100 && !/[.!?)…"']$/.test(s) ? `${s}…` : s)),
  ),
];

/** Markdown-safe partner paragraph: a leading #, >, - or "1." stays text. */
const escapeLine = (line) => line.replace(/^(\s*)([#>*+-]|\d+\.)/, "$1\\$2");

function whyNot(d) {
  if (!d || d.__error) return d?.__error ? "API error" : "no data";
  if (d.status !== "approved" || !d.published || !d.available) return "not on sale";
  if (d.locale && d.locale !== "en") return "not in English";
  if (!(Number(d.price) > 0)) return "no price";
  if (!d.city?.name || !d.country?.name) return "no place";
  if (!/^https:\/\/wegotrip\.com\//.test(String(d.url ?? ""))) return "no listing URL";
  if (!d.cover && !d.images?.length) return "no image";
  return null;
}

/** Every WeGoTrip product is self-guided; the API flags the ones with audio. */
const isAudio = (d) => Boolean(d.types?.audioguide || d.tags?.audioguide);
const kindOf = (d) => (isAudio(d) ? "self-guided audio tour" : "self-guided tour");

function buildFacts(d, images) {
  const minutes = Number(d.durationMin) > 0 && d.durationMin === d.durationMax ? Number(d.durationMin) : null;
  const meeting = [...new Set([d.startLocation, d.address].map(inline).filter(Boolean))].join(", ");
  const facts = {
    provider: "WeGoTrip",
    product_id: d.id,
    format: isAudio(d) ? "Self-guided audio tour in the WeGoTrip app" : "Self-guided tour in the WeGoTrip app",
  };
  if (minutes) facts.duration_minutes = minutes;
  else if (d.duration) facts.duration = inline(d.duration);
  if (d.distance) facts.route_length = inline(d.distance);
  if (meeting) facts.meeting_point = meeting;
  if (d.tickets?.some((t) => t.skipTheLine)) facts.skip_the_line = true;
  const categories = clean(d.categories?.map((c) => c.title));
  if (categories.length) facts.categories = categories;
  if (d.author?.name && d.author.name !== "WeGoTrip") facts.tour_author = inline(d.author.name);
  if (Number(d.rating) > 0 && Number(d.ratingsCount) > 0) {
    facts.rating = `${Number(d.rating).toFixed(1)} / 5 from ${d.ratingsCount} ratings`;
  }
  const highlights = clean(d.highlights);
  if (highlights.length) facts.highlights = highlights;
  const included = clean(d.inclusions);
  if (included.length) facts.included_listed = included;
  const excluded = clean(d.exclusions);
  if (excluded.length) facts.not_included = excluded;
  const info = clean(d.importantInfo);
  if (info.length) facts.important_info = info;
  facts.image_credit = "WeGoTrip";
  facts.images = images;
  return facts;
}

function buildBody(d, place, readOn) {
  const when = humanDate(readOn);
  const price = money(d.price, d.currencyCode || "EUR");
  const included = clean(d.inclusions);
  const excluded = clean(d.exclusions);
  const notes = [...included, ...clean(d.importantInfo)];
  const ticket = included.find((i) => /\b(ticket|admission|entry|entrance)\b/i.test(i));
  const noGuide = excluded.some((i) => /\b(in-person|live|tour) guide\b/i.test(i));
  const app = notes.some((i) => /WeGoTrip app|smartphone|mobile app/i.test(i));

  const intro = [`WeGoTrip sells this as a ${kindOf(d)} in ${place.city}, ${place.country}.`];
  if (d.duration) {
    intro.push(`The listing gives its length as ${inline(d.duration)}${d.distance ? `, over a route of about ${inline(d.distance)}` : ""}.`);
  }
  const start = [...new Set([d.startLocation, d.address].map(inline).filter(Boolean))].join(", ");
  if (start) intro.push(`It starts at ${start}.`);
  if (ticket) intro.push(`An entry ticket is part of the package; the listing includes: ${ticket.replace(/[.\s]+$/, "")}.`);
  if (noGuide && app) intro.push("There is no live guide: the tour plays in the WeGoTrip app on your own phone.");
  else if (app) intro.push("The tour plays in the WeGoTrip app on your own phone.");
  else if (noGuide) intro.push("There is no live guide.");
  if (d.author?.name && d.author.name !== "WeGoTrip") intro.push(`WeGoTrip names ${inline(d.author.name)} as the tour's author.`);

  const lines = ["## What it is", "", intro.join(" "), ""];

  const description = plainText(d.description, 1800);
  if (description) {
    lines.push("## How WeGoTrip describes it", "");
    for (const para of description.split(/\n\s*\n/)) {
      lines.push(...para.split("\n").map((l) => `> ${escapeLine(l.trim())}`), ">");
    }
    lines.pop();
    lines.push("");
  }

  const rating =
    Number(d.rating) > 0 && Number(d.ratingsCount) > 0
      ? ` It was rated ${Number(d.rating).toFixed(1)} out of 5 from ${d.ratingsCount} ratings${Number(d.reviewsCount) > 0 ? ` and ${d.reviewsCount} written reviews` : ""}.`
      : "";
  lines.push("## Price and rating", "", `On ${when}, WeGoTrip's product data listed it from ${price}.${rating} The final price is shown at WeGoTrip's checkout.`, "");
  lines.push(
    "## Where this page comes from",
    "",
    `This page was built on ${when} from WeGoTrip's partner data, the product information WeGoTrip gives its affiliates. We have not taken this tour ourselves, so check the listing for anything that matters to you before you book.`,
  );
  return lines.join("\n");
}

function buildSummary(d, place) {
  const length = d.duration ? ` (${inline(d.duration)})` : "";
  const rating = Number(d.rating) > 0 && Number(d.ratingsCount) > 0 ? ` Rated ${Number(d.rating).toFixed(1)}/5 from ${d.ratingsCount} ratings.` : "";
  const kind = kindOf(d);
  return `${kind[0].toUpperCase()}${kind.slice(1)} in ${place.city} on WeGoTrip${length}, from ${money(d.price, d.currencyCode || "EUR")}.${rating}`;
}

// ---------------------------------------------------------------------------

const all = loadAllOffers();
const slugOwner = new Map(all.map((o) => [o.data.slug, o.file]));
const takenPrimary = new Map();
const mine = new Map();
const handWritten = new Set();
for (const o of all) {
  const id = o.programme === PROGRAMME ? productId(o.data) : null;
  if (isGenerated(o.data, GENERATOR)) {
    if (id) mine.set(id, o);
    continue;
  }
  if (id) handWritten.add(id);
  const first = o.data.facts?.images?.[0]?.url;
  if (first) takenPrimary.set(norm(first), o.data.slug);
}

console.log(`WeGoTrip: reading the API (cache ${refresh ? "bypassed" : "on"})…`);
const popular = await paged("/products/popular/?lang=en&currency=EUR", "popular", 20);
const rank = new Map();
for (const p of popular) if (!rank.has(p.id)) rank.set(p.id, rank.size);
console.log(`  ${rank.size} products in the popular list`);

const byRank = (a, b) => (rank.get(a) ?? 1e9) - (rank.get(b) ?? 1e9);
const candidates = [...new Set([...[...mine.keys()].sort(byRank), ...rank.keys()])].filter((id) => !handWritten.has(id));

const table = await countryTable({ refresh });
const places = loadPlaces();
const perCityCount = new Map();
const accepted = new Map(); // id → file
const skipped = [];
const results = [];

for (let i = 0; i < candidates.length && accepted.size < target; i += 12) {
  const chunk = candidates.slice(i, i + 12);
  const details = await mapLimit(chunk, 4, (id) =>
    api(`/products/${id}/?lang=en&currency=EUR`, `product-${id}`).catch((e) => ({ __error: e.message })),
  );
  for (const d of details) {
    if (accepted.size >= target) break;
    const reason = whyNot(d);
    if (reason) {
      skipped.push(reason);
      continue;
    }
    if ((perCityCount.get(d.city.id) ?? 0) >= perCity) {
      skipped.push("city already full");
      continue;
    }

    // Images: the product's own cover first, then its gallery; the first must be ours alone.
    const urls = [...new Set([d.cover, ...(d.images ?? []).map((im) => im.full)].filter((u) => /^https:\/\//.test(String(u))))];
    let primary = null;
    for (const u of urls) {
      if (!takenPrimary.has(norm(u)) && (await imageServes(u))) {
        primary = u;
        break;
      }
    }
    if (!primary) {
      skipped.push("no image of its own that loads");
      continue;
    }
    const gallery = [primary, ...urls.filter((u) => u !== primary)].slice(0, 3);
    const alts = new Map((d.images ?? []).map((im) => [im.full, inline(im.description)]));
    const images = gallery.map((url) => ({ url, alt: alts.get(url) ?? "" }));

    const country = ensureCountry(places, table, { name: d.country.name });
    if (!country) {
      skipped.push(`unknown country ${d.country.name}`);
      continue;
    }
    const citySlug = ensureCity(places, country.slug, d.city.name);
    const place = { city: inline(d.city.name), country: country.name };

    const existing = mine.get(d.id);
    let slug = existing?.data.slug;
    if (!slug) {
      let base = slugify(d.title);
      if (!base.startsWith(citySlug)) base = `${citySlug}-${base}`;
      slug = trimSlug(base, 72);
      if (slugOwner.has(slug)) slug = `${trimSlug(base, 64)}-p${d.id}`;
    }
    const file = path.join(OFFERS_DIR, PROGRAMME, `${slug}.json`);

    const build = (readOn) => ({
      programme: PROGRAMME,
      tier: "catalogue",
      generated_by: GENERATOR,
      section: "tours-activities",
      city: citySlug,
      kind: isAudio(d) ? "audio tour" : "self-guided tour",
      title: inline(d.title),
      slug,
      source_url: d.url,
      read_on: readOn,
      affiliate_url: travelpayoutsLink({ ...LINK, url: d.url, subId: `wm-wgt${d.id}` }),
      price_note: `Read on ${humanDate(readOn)} from WeGoTrip's product data: from ${money(d.price, d.currencyCode || "EUR")}.`,
      price_from: Number(d.price),
      currency: d.currencyCode || "EUR",
      weight: 100000 - (rank.get(d.id) ?? 99999),
      facts: buildFacts(d, images),
      summary: buildSummary(d, place),
      body: buildBody(d, place, readOn),
    });

    const problems = offerProblems(build(date), { places, legacy: LEGACY_OFFERS_WITHOUT_IMAGES });
    if (problems.length) {
      skipped.push(`gate: ${problems[0]}`);
      continue;
    }

    results.push(writeGenerated(file, GENERATOR, build, { date, dry }));
    accepted.set(d.id, file);
    slugOwner.set(slug, file);
    takenPrimary.set(norm(primary), slug);
    perCityCount.set(d.city.id, (perCityCount.get(d.city.id) ?? 0) + 1);
  }
}

let removed = 0;
for (const [id, o] of mine) {
  if (!accepted.has(id) && removeGenerated(o.file, GENERATOR, { dry })) removed++;
}
// In a dry run the files on disk are unchanged, so pruning would drop new places.
savePlaces(dry ? places : prunePlaces(places, loadAllOffers(), LAUNCH_PLACES), { dry });

const tally = (list) => [...count(list, (x) => x).entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(", ");
console.log(`\nWeGoTrip catalogue${dry ? " (dry run, nothing written)" : ""}:`);
console.log(`  ${accepted.size} offers (target ${target}) · ${tally(results)} · ${removed} removed`);
console.log(`  skipped: ${tally(skipped) || "none"}`);
const cities = [...perCityCount.values()];
console.log(`  ${cities.length} cities; most in one city: ${Math.max(0, ...cities)}`);
