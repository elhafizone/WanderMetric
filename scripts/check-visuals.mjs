/**
 * WanderMetric Visual Inventory Audit CLI
 *
 * Runs a complete audit across all offers in content/offers against the Visual Inventory Policy:
 *   node scripts/check-visuals.mjs
 */
import { buildVisualInventory, validateOfferVisuals } from "./lib/visual-policy.mjs";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

console.log("=================================================");
console.log("  WanderMetric Visual Inventory Policy Audit");
console.log("=================================================\n");

const root = path.resolve("content/offers");
const inventory = buildVisualInventory(root, "public");

console.log(`Scanned ${inventory.totalFiles} offer guides across ${root}`);
console.log(`- Offers with verified product imagery: ${inventory.offersWithImages.length}`);
console.log(`- Legacy offers in transitional grace: ${inventory.legacyOffers.length}`);
console.log(`- Total unique image assets indexed:   ${inventory.allImageMap.size}`);
console.log(`- Primary image collisions detected:   ${inventory.collisions.length}`);

if (inventory.errors.length > 0) {
  console.error("\n❌ Inventory indexing errors encountered:");
  inventory.errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
}

if (inventory.collisions.length > 0) {
  console.error("\n❌ PRIMARY IMAGE COLLISIONS DETECTED:");
  for (const col of inventory.collisions) {
    console.error(`  URL: ${col.url}`);
    col.usages.forEach((u) => console.error(`    -> ${u.slug} (${u.file})`));
  }
  process.exit(1);
}

// Now validate each individual file
const files = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) =>
    readdirSync(path.join(root, d.name))
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.join(root, d.name, f)),
  );

let legacyCount = 0;
let modernCount = 0;

for (const file of files) {
  const relFile = path.relative(root, file).replace(/\\/g, "/");
  const data = JSON.parse(readFileSync(file, "utf8"));
  try {
    const res = validateOfferVisuals(data, relFile, inventory, { isPublish: true });
    if (res.status === "legacy_grace") {
      legacyCount++;
    } else {
      modernCount++;
    }
  } catch (err) {
    console.error(`\n❌ Policy validation failed on ${relFile}:`);
    console.error(err.message);
    process.exit(1);
  }
}

console.log(`\n✅ Visual Inventory Policy Audit PASSED:`);
console.log(`  ${modernCount} modern offers comply with strict product imagery rules.`);
console.log(`  ${legacyCount} legacy offers tracked in controlled whitelist for progressive review.`);
console.log(`  0 image collisions. 0 missing local assets. All URLs valid.`);
console.log("=================================================\n");
