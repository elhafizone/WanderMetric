/**
 * content/places.json: every country and city an offer can be filed under.
 * The WordPress plugin seeds these as wm_place terms (includes/places.php).
 *
 * Countries are keyed by ISO code through Travelpayouts' reference list, so
 * "Czechia" from one partner and "Czech Republic" from another become one place.
 * City slugs are unique across the whole file and never equal a country slug.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fetchCached, ROOT, slugify } from "./common.mjs";

export const PLACES_FILE = path.join(ROOT, "content/places.json");

/** Names kept as the site already uses them (their slugs are live URLs), or clearer than the reference list. */
const NAME_OVERRIDES = {
  TR: "Turkey",
  CZ: "Czechia",
  HK: "Hong Kong",
  MO: "Macau",
  VA: "Vatican",
  PS: "Palestine",
  CW: "Curaçao",
  US: "United States",
  GB: "United Kingdom",
  AE: "United Arab Emirates",
};

/** Other spellings partners use, lower case → ISO code. */
const ALIASES = {
  "türkiye": "TR",
  "turkiye": "TR",
  "czech republic": "CZ",
  "palestine, state of": "PS",
  "palestine state of": "PS",
  "hong kong, republic of china": "HK",
  "hong kong (china)": "HK",
  "macao": "MO",
  "macau (china)": "MO",
  "korea": "KR",
  "korea, republic of": "KR",
  "republic of korea": "KR",
  "vatican city": "VA",
  "holy see": "VA",
  "usa": "US",
  "united states of america": "US",
  "uk": "GB",
  "great britain": "GB",
  "uae": "AE",
  "russian federation": "RU",
  "viet nam": "VN",
  "cote d'ivoire": "CI",
  "côte d'ivoire": "CI",
  "cabo verde": "CV",
  "eswatini": "SZ",
  "swaziland": "SZ",
  "macedonia": "MK",
  "north macedonia": "MK",
  "laos": "LA",
  "lao people's democratic republic": "LA",
  "moldova, republic of": "MD",
  "tanzania, united republic of": "TZ",
  "bolivia, plurinational state of": "BO",
  "venezuela, bolivarian republic of": "VE",
  "iran, islamic republic of": "IR",
  "syrian arab republic": "SY",
  "brunei darussalam": "BN",
  "micronesia": "FM",
  "saint martin": "MF",
  "saint martin (french part)": "MF",
  "sint maarten": "SX",
  "sint maarten (dutch part)": "SX",
  "timor - leste": "TL",
  "timor-leste": "TL",
  "east timor": "TL",
  "virgin islands (u.s.)": "VI",
  "bonaire": "BQ",
  "curacao": "CW",
  "reunion": "RE",
  "réunion": "RE",
  "puerto rico (us)": "PR",
  "us virgin islands": "VI",
  "virgin islands": "VI",
  "virgin islands (us)": "VI",
  "british virgin islands": "VG",
  "virgin islands (british)": "VG",
  "congo, democratic republic": "CD",
  "democratic republic of the congo": "CD",
  "dr congo": "CD",
  "congo": "CG",
  "republic of the congo": "CG",
  "the bahamas": "BS",
  "the gambia": "GM",
  "kosovo": "XK",
};

/**
 * Travelpayouts' country list (code, name, name_translations), cached for 30 days.
 * @returns {Promise<{ byCode: Map<string, {code: string, name: string, slug: string}>, lookup: (name: string) => string|null }>}
 */
export async function countryTable({ refresh = false } = {}) {
  const list = await fetchCached("https://api.travelpayouts.com/data/en/countries.json", {
    cacheKey: "travelpayouts/countries.json",
    ttlHours: 24 * 30,
    refresh,
  });
  const byCode = new Map();
  const byName = new Map();
  for (const c of list) {
    if (!c.code || !c.name) continue;
    const name = NAME_OVERRIDES[c.code] ?? c.name;
    byCode.set(c.code, { code: c.code, name, slug: slugify(name) });
    for (const n of [c.name, name, c.name_translations?.en]) {
      if (n) byName.set(n.toLowerCase(), c.code);
      if (n) byName.set(slugify(n), c.code);
    }
  }
  for (const [alias, code] of Object.entries(ALIASES)) {
    if (byCode.has(code)) byName.set(alias, code);
  }
  if (!byCode.has("XK")) byCode.set("XK", { code: "XK", name: "Kosovo", slug: "kosovo" });
  return {
    byCode,
    lookup(name) {
      const key = String(name ?? "").trim().toLowerCase();
      return byName.get(key) ?? byName.get(slugify(key)) ?? null;
    },
  };
}

export function loadPlaces() {
  if (!existsSync(PLACES_FILE)) return { countries: {} };
  return JSON.parse(readFileSync(PLACES_FILE, "utf8"));
}

/** Sorted, stable output so diffs stay readable. */
export function savePlaces(places, { dry = false } = {}) {
  const countries = {};
  for (const slug of Object.keys(places.countries).sort()) {
    const c = places.countries[slug];
    const cities = {};
    for (const city of Object.keys(c.cities ?? {}).sort()) cities[city] = c.cities[city];
    countries[slug] = { name: c.name, ...(c.code ? { code: c.code } : {}), cities };
  }
  const out = { countries };
  if (!dry) writeFileSync(PLACES_FILE, `${JSON.stringify(out, null, 2)}\n`);
  return out;
}

/**
 * Drop places no offer uses, keeping `keep` (the places the site launched with,
 * whose pages are already public). offers: [{ data }] from loadAllOffers().
 */
export function prunePlaces(places, offers, keep = { countries: {} }) {
  const usedCities = new Set(offers.map((o) => o.data.city).filter(Boolean));
  const usedCountries = new Set(offers.map((o) => o.data.country).filter(Boolean));
  for (const [slug, c] of Object.entries(places.countries)) {
    for (const city of Object.keys(c.cities)) {
      if (!usedCities.has(city) && !keep.countries[slug]?.cities?.[city]) delete c.cities[city];
    }
    if (!Object.keys(c.cities).length && !usedCountries.has(slug) && !keep.countries[slug]) delete places.countries[slug];
  }
  return places;
}

/** The places the site launched with (2026-11-11); never pruned. */
export const LAUNCH_PLACES = {
  countries: {
    egypt: { cities: { aswan: 1 } },
    france: { cities: { paris: 1 } },
    greece: { cities: { athens: 1 } },
    italy: { cities: { florence: 1, rome: 1 } },
    japan: { cities: { kyoto: 1, tokyo: 1 } },
    portugal: { cities: { lisbon: 1 } },
    spain: { cities: { barcelona: 1, madrid: 1 } },
    thailand: { cities: { bangkok: 1, phuket: 1 } },
    turkey: { cities: { istanbul: 1 } },
    "united-arab-emirates": { cities: { dubai: 1 } },
    "united-kingdom": { cities: { london: 1 } },
  },
};

/**
 * The country for an ISO code (or a name), added to places if new.
 * @returns {{slug: string, name: string, code: string}|null}
 */
export function ensureCountry(places, table, { code, name }) {
  const iso = code && table.byCode.has(code) ? code : table.lookup(name);
  if (!iso) return null;
  const ref = table.byCode.get(iso);
  // A country already on the site keeps its slug and name.
  for (const [slug, c] of Object.entries(places.countries)) {
    if (c.code === iso) return { slug, name: c.name, code: iso };
  }
  const existing = places.countries[ref.slug];
  if (existing) {
    existing.code ??= iso;
    return { slug: ref.slug, name: existing.name, code: iso };
  }
  places.countries[ref.slug] = { name: ref.name, code: iso, cities: {} };
  return { slug: ref.slug, name: ref.name, code: iso };
}

/**
 * The city slug for a name within a country, added if new. Same name in the same
 * country is one city; a name used in two countries gets the country appended;
 * a city named like a country gets "-city".
 */
export function ensureCity(places, countrySlug, cityName) {
  const country = places.countries[countrySlug];
  const wanted = cityName.trim();
  for (const [slug, name] of Object.entries(country.cities)) {
    if (name.toLowerCase() === wanted.toLowerCase()) return slug;
  }
  const taken = new Set(Object.keys(places.countries));
  const cityOwners = new Map();
  for (const [cs, c] of Object.entries(places.countries)) for (const s of Object.keys(c.cities)) cityOwners.set(s, cs);

  let slug = slugify(wanted);
  if (!slug) return null;
  if (taken.has(slug)) slug = `${slug}-city`;
  // Same slug in the same country ("St. Petersburg" / "St Petersburg"): the same city.
  if (cityOwners.get(slug) === countrySlug) return slug;
  if (cityOwners.has(slug)) slug = `${slug}-${countrySlug}`;
  const base = slug;
  for (let n = 2; cityOwners.has(slug) && cityOwners.get(slug) !== countrySlug; n++) slug = `${base}-${n}`;
  if (cityOwners.get(slug) === countrySlug) return slug;
  country.cities[slug] = wanted;
  return slug;
}
