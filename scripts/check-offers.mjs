/**
 * Every offer file against the WordPress publish gate, before bundling:
 *   node scripts/check-offers.mjs
 * Rules: scripts/feeds/lib/validate-offer.mjs (mirrors includes/publish-gate.php).
 */
import { LEGACY_OFFERS_WITHOUT_IMAGES } from "./lib/visual-policy.mjs";
import { count, loadAllOffers } from "./feeds/lib/common.mjs";
import { loadPlaces } from "./feeds/lib/places.mjs";
import { offerProblems } from "./feeds/lib/validate-offer.mjs";

const offers = loadAllOffers();
const places = loadPlaces();
const failures = [];
const slugs = new Map();

for (const { file, programme, data } of offers) {
  const where = file.slice(file.indexOf("content")).replace(/\\/g, "/");
  const problems = offerProblems(data, { places, legacy: LEGACY_OFFERS_WITHOUT_IMAGES });
  if (data.programme !== programme) problems.push(`programme "${data.programme}" does not match its folder`);
  if (!where.endsWith(`/${data.slug}.json`)) problems.push("file name does not match the slug");
  if (slugs.has(data.slug)) problems.push(`slug also used by ${slugs.get(data.slug)}`);
  slugs.set(data.slug, where);
  if (problems.length) failures.push(`${where}\n    ${problems.join("\n    ")}`);
}

const tiers = count(offers, (o) => o.data.tier ?? "editorial");
const programmes = new Set(offers.map((o) => o.programme));
console.log(`${offers.length} offers from ${programmes.size} programmes: ${[...tiers].map(([t, n]) => `${n} ${t}`).join(", ")}`);
if (failures.length) {
  console.error(`\n${failures.length} offer(s) would not publish:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log("All offers pass the publish gate.");
