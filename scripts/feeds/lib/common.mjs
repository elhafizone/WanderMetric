/**
 * Shared helpers for the catalogue feeds (scripts/feeds/*.mjs).
 *
 * A feed reads one programme's official data (an API or a product feed),
 * builds offer files in content/offers/<programme>/, and never invents a value:
 * every figure in a generated file is copied from that data.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "../../..");
export const OFFERS_DIR = path.join(ROOT, "content/offers");
export const CACHE_DIR = path.join(ROOT, "scripts/feeds/.cache");

/** Travelpayouts account values, already public in every tp.media link under content/offers. */
export const TRAVELPAYOUTS = { marker: "705982", project: "512658" };

/** A generic client name: no project or personal details go to partner servers. */
const USER_AGENT = "Mozilla/5.0 (compatible; catalogue-builder/1.0)";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** --flag, --key value and --key=value; anything else is positional. */
export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const eq = a.indexOf("=");
    if (eq > -1) {
      out[a.slice(2, eq)] = a.slice(eq + 1);
    } else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) {
      out[a.slice(2)] = argv[++i];
    } else {
      out[a.slice(2)] = true;
    }
  }
  return out;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** "2026-11-13" → "13 November 2026". */
export function humanDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function slugify(text) {
  return String(text)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Shorten a slug at a word boundary. */
export function trimSlug(slug, max = 72) {
  if (slug.length <= max) return slug;
  const cut = slug.slice(0, max);
  const at = cut.lastIndexOf("-");
  return (at > 20 ? cut.slice(0, at) : cut).replace(/-+$/, "");
}

const SYMBOLS = { EUR: "€", GBP: "£", USD: "US$", JPY: "¥" };

/** 16.35, "EUR" → "€16.35". Two decimals, as partners list them. */
export function money(amount, currency) {
  const n = Number(amount).toFixed(2);
  return SYMBOLS[currency] ? `${SYMBOLS[currency]}${n}` : `${n} ${currency}`;
}

/**
 * Travelpayouts' documented link template (see docs/travelpayouts.md). The sub ID
 * after the marker shows in Travelpayouts statistics, so a booking traces to its page.
 */
export function travelpayoutsLink({ campaignId, promoId, url, subId }) {
  const sub = subId ? `.${String(subId).replace(/[^a-z0-9-]/gi, "").slice(0, 40)}` : "";
  const query = new URLSearchParams({
    campaign_id: String(campaignId),
    marker: `${TRAVELPAYOUTS.marker}${sub}`,
    p: String(promoId),
    trs: TRAVELPAYOUTS.project,
    u: url,
  });
  return `https://tp.media/r?${query.toString()}`;
}

/**
 * GET with a disk cache, so re-runs within ttlHours do not hit the partner again.
 * Retries 429 and 5xx with backoff; other errors fail at once.
 */
export async function fetchCached(url, { cacheKey, ttlHours = 20, refresh = false, headers = {}, as = "json", retries = 4 } = {}) {
  const file = path.join(CACHE_DIR, cacheKey);
  if (!refresh && existsSync(file) && (Date.now() - statSync(file).mtimeMs) / 3_600_000 < ttlHours) {
    const raw = readFileSync(file, "utf8");
    return as === "json" ? JSON.parse(raw) : raw;
  }
  let last;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, ...headers } });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      if (!res.ok) {
        const error = new Error(`HTTP ${res.status} for ${url}`);
        error.status = res.status;
        error.final = true;
        throw error;
      }
      const raw = await res.text();
      const value = as === "json" ? JSON.parse(raw) : raw;
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, raw);
      return value;
    } catch (error) {
      last = error;
      if (error.final) throw error;
      await sleep(1500 * attempt * attempt);
    }
  }
  throw last;
}

/**
 * Does an image URL actually serve an image? Some partner files answer 403.
 * Results are remembered in the cache for a week so re-runs stay quick.
 */
const imageChecks = { file: path.join(CACHE_DIR, "image-checks.json"), data: null };
export async function imageServes(url) {
  if (!imageChecks.data) {
    try {
      imageChecks.data = JSON.parse(readFileSync(imageChecks.file, "utf8"));
    } catch {
      imageChecks.data = {};
    }
  }
  const hit = imageChecks.data[url];
  if (hit && Date.now() - hit.at < 7 * 86_400_000) return hit.ok;
  let ok = false;
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Range: "bytes=0-0" } });
    ok = (res.status === 200 || res.status === 206) && /^image\//.test(res.headers.get("content-type") ?? "");
    await res.body?.cancel();
  } catch {
    ok = false;
  }
  imageChecks.data[url] = { ok, at: Date.now() };
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(imageChecks.file, JSON.stringify(imageChecks.data));
  return ok;
}

/** Run fn over items with at most `limit` in flight; results keep input order. */
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

/** Every offer file: [{ file, programme, data }]. */
export function loadAllOffers() {
  const out = [];
  for (const dir of readdirSync(OFFERS_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory() || dir.name.startsWith("_")) continue;
    for (const name of readdirSync(path.join(OFFERS_DIR, dir.name))) {
      if (!name.endsWith(".json")) continue;
      const file = path.join(OFFERS_DIR, dir.name, name);
      out.push({ file, programme: dir.name, data: JSON.parse(readFileSync(file, "utf8")) });
    }
  }
  return out;
}

/** True for a file this generator owns (and may overwrite or delete). */
export function isGenerated(data, generator) {
  return data?.tier === "catalogue" && data?.generated_by === generator;
}

/**
 * Write a generated offer. build(readOn) returns the offer for a given read-on
 * date. If nothing but the date would change and the stored date is under
 * `freshDays` old, the file is left alone: the server then has nothing to
 * re-import. Hand-edited (non-generated) files are never overwritten.
 */
export function writeGenerated(file, generator, build, { date, freshDays = 14, dry = false }) {
  let old = null;
  if (existsSync(file)) {
    old = JSON.parse(readFileSync(file, "utf8"));
    if (!isGenerated(old, generator)) return "protected";
  }
  if (old?.read_on && daysBetween(old.read_on, date) < freshDays) {
    const same = build(old.read_on);
    if (JSON.stringify(same) === JSON.stringify(old)) return "unchanged";
  }
  const offer = build(date);
  if (!dry) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(offer, null, 2)}\n`);
  }
  return old ? "updated" : "created";
}

/** Delete a generated file whose product the partner no longer offers. */
export function removeGenerated(file, generator, { dry = false } = {}) {
  if (!existsSync(file)) return false;
  const data = JSON.parse(readFileSync(file, "utf8"));
  if (!isGenerated(data, generator)) return false;
  if (!dry) unlinkSync(file);
  return true;
}

/** Plain text from partner copy: no tags, tidy whitespace, at most `max` characters, cut at a sentence. */
export function plainText(text, max = 2000) {
  let s = String(text ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (s.length > max) {
    const cut = s.slice(0, max);
    const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"));
    s = `${(end > max / 2 ? cut.slice(0, end + 1) : cut).trim()}…`;
  }
  return s;
}

/** Markdown-safe single line (for table cells and list items). */
export function inline(text) {
  return String(text ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\|/g, "/")
    .trim();
}

export function count(list, key) {
  const out = new Map();
  for (const item of list) {
    const k = key(item);
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}
