/**
 * The WordPress publish gate (wordpress/.../includes/publish-gate.php and
 * importer.php), checked before a file is bundled. Keep the two in step.
 */

export const SECTIONS = [
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
];

export const REQUIRED = ["programme", "section", "title", "slug", "source_url", "read_on", "affiliate_url", "facts", "summary", "body"];

/** Same floors as WM_MIN_BODY_CHARS and WM_MIN_CATALOGUE_BODY_CHARS. */
export const MIN_BODY = { editorial: 800, catalogue: 300 };

/** Roughly what WordPress counts: the body's visible text once Markdown is rendered. */
export function visibleLength(markdown) {
  return String(markdown)
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`|]/g, "")
    .replace(/\s+/g, " ")
    .trim().length;
}

/**
 * Problems that would keep an offer from publishing. Empty when it passes.
 * @param {object} offer
 * @param {{ places?: {countries: Record<string, {cities: Record<string, string>}>}, legacy?: Set<string> }} [ctx]
 */
export function offerProblems(offer, ctx = {}) {
  const problems = [];
  if (!offer || typeof offer !== "object") return ["not a JSON object"];
  for (const key of REQUIRED) {
    if (offer[key] === undefined || offer[key] === null || offer[key] === "") problems.push(`missing ${key}`);
  }
  const tier = offer.tier ?? "editorial";
  if (!["editorial", "catalogue"].includes(tier)) problems.push(`unknown tier ${tier}`);
  if (offer.section && !SECTIONS.includes(offer.section)) problems.push(`unknown section ${offer.section}`);
  if (offer.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(offer.slug)) problems.push("slug must be lower-case words joined by hyphens");
  for (const key of ["source_url", "affiliate_url"]) {
    if (offer[key] && !/^https:\/\/[^\s]+$/.test(offer[key])) problems.push(`${key} must be an https:// address`);
  }
  if (offer.read_on && !/^\d{4}-\d{2}-\d{2}$/.test(offer.read_on)) problems.push("read_on must be YYYY-MM-DD");

  if (!offer.city && !offer.country) problems.push("needs a city or a country");
  if (ctx.places) {
    const countries = ctx.places.countries;
    if (offer.country && !countries[offer.country]) problems.push(`unknown country ${offer.country}`);
    if (offer.city && !Object.values(countries).some((c) => c.cities && offer.city in c.cities)) problems.push(`unknown city ${offer.city}`);
  }

  const facts = offer.facts && typeof offer.facts === "object" ? offer.facts : {};
  const factKeys = Object.keys(facts).filter((k) => k !== "images" && k !== "image_credit");
  if (!factKeys.length) problems.push("needs facts read from the listing");

  const legacy = ctx.legacy?.has(offer.slug);
  const images = Array.isArray(facts.images) ? facts.images : [];
  if (!legacy) {
    if (!images.length) problems.push("needs at least one partner image");
    if (images.length && !String(facts.image_credit ?? "").trim()) problems.push("needs an image_credit");
  }
  images.forEach((img, i) => {
    if (!img || typeof img.url !== "string" || !/^(https:\/\/|\/imagery\/)/.test(img.url)) problems.push(`images[${i}].url must be https://`);
    if (img && typeof img.alt !== "string") problems.push(`images[${i}].alt must be a string`);
  });

  if (offer.body) {
    const length = visibleLength(offer.body);
    const min = MIN_BODY[tier] ?? MIN_BODY.editorial;
    if (length < min) problems.push(`body is ${length} visible characters; ${tier} needs ${min}`);
  }
  if (tier === "catalogue") {
    if (!(Number(offer.price_from) > 0) && !String(offer.price_note ?? "").trim()) problems.push("catalogue offers need a price");
    if (offer.price_from !== undefined && !/^[A-Z]{3}$/.test(String(offer.currency ?? ""))) problems.push("price_from needs a three-letter currency");
  }
  return problems;
}
