/**
 * Imports offer guides from content/offers/<programme>/*.json into the database.
 *
 *   node --env-file=.env.local scripts/import-offers.mjs            # drafts
 *   node --env-file=.env.local scripts/import-offers.mjs --publish  # publish
 *   node --env-file=.env.local scripts/import-offers.mjs --dry      # validate only
 *
 * Uses the service-role key, so it runs locally and never ships. The database
 * still enforces its own rules (CHECK constraints and the offer-guide publish
 * gate): a guide that breaks them is rejected here exactly as it would be
 * anywhere else. Idempotent on (city, slug).
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const args = new Set(process.argv.slice(2));
const dry = args.has("--dry");
const publish = args.has("--publish");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const root = path.resolve("content/offers");
const files = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) =>
    readdirSync(path.join(root, d.name))
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.join(root, d.name, f)),
  );

const REQUIRED = ["programme", "city", "kind", "title", "slug", "source_url", "read_on", "affiliate_url", "facts", "summary", "body"];

function validate(offer, file) {
  const missing = REQUIRED.filter((k) => offer[k] === undefined || offer[k] === "");
  if (missing.length) throw new Error(`${file}: missing ${missing.join(", ")}`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(offer.slug)) throw new Error(`${file}: bad slug`);
  if (!["activity", "tour"].includes(offer.kind)) throw new Error(`${file}: kind must be activity or tour`);
  if (!/^https?:\/\//.test(offer.affiliate_url)) throw new Error(`${file}: affiliate_url must be http(s)`);
  if (publish && offer.body.length < 800) throw new Error(`${file}: body under 800 characters`);
}

function fail(label, error) {
  throw new Error(`${label}: ${error.message}`);
}

let done = 0;
for (const file of files) {
  const offer = JSON.parse(readFileSync(file, "utf8"));
  validate(offer, path.basename(file));
  if (dry) {
    console.log(`ok   ${offer.programme}/${offer.slug} (${offer.body.length} chars)`);
    continue;
  }

  const { data: program, error: pe } = await db
    .from("affiliate_programs").select("id").eq("slug", offer.programme).maybeSingle();
  if (pe) fail("program", pe);
  if (!program) throw new Error(`${offer.slug}: unknown programme "${offer.programme}"`);

  const { data: city, error: ce } = await db
    .from("cities").select("id").eq("slug", offer.city).is("deleted_at", null).maybeSingle();
  if (ce) fail("city", ce);
  if (!city) throw new Error(`${offer.slug}: unknown city "${offer.city}"`);

  // The link slug carries the programme prefix; the button label is derived from it.
  const linkSlug = `${offer.programme}-${offer.slug}`;
  const { data: existingLink, error: le } = await db
    .from("affiliate_links").select("id").eq("slug", linkSlug).is("deleted_at", null).maybeSingle();
  if (le) fail("link lookup", le);

  const linkFields = {
    program_id: program.id,
    slug: linkSlug,
    label: offer.title,
    destination_url: offer.affiliate_url,
    status: "active",
  };
  let linkId = existingLink?.id;
  if (linkId) {
    const { error } = await db.from("affiliate_links").update(linkFields).eq("id", linkId);
    if (error) fail("link update", error);
  } else {
    const { data, error } = await db.from("affiliate_links").insert(linkFields).select("id").single();
    if (error) fail("link insert", error);
    linkId = data.id;
  }

  const minutes = typeof offer.facts.duration_minutes === "number" ? offer.facts.duration_minutes : null;
  const fields = {
    city_id: city.id,
    kind: offer.kind,
    name: offer.title,
    slug: offer.slug,
    summary: offer.summary,
    body: offer.body,
    duration_minutes: minutes,
    program_id: program.id,
    affiliate_link_id: linkId,
    source_url: offer.source_url,
    facts: offer.facts,
    facts_read_on: offer.read_on,
    price_note: offer.price_note ?? null,
  };
  if (publish) {
    fields.status = "published";
    fields.published_at = new Date().toISOString();
  }

  const { data: existing, error: ee } = await db
    .from("activities").select("id, status").eq("city_id", city.id).eq("slug", offer.slug).is("deleted_at", null).maybeSingle();
  if (ee) fail("activity lookup", ee);

  if (existing) {
    // Never silently unpublish a live guide when re-importing without --publish.
    if (!publish) fields.status = existing.status;
    const { error } = await db.from("activities").update(fields).eq("id", existing.id);
    if (error) fail(`activity update ${offer.slug}`, error);
    console.log(`updated ${offer.programme}/${offer.slug}`);
  } else {
    const { error } = await db.from("activities").insert(fields);
    if (error) fail(`activity insert ${offer.slug}`, error);
    console.log(`created ${offer.programme}/${offer.slug} (${publish ? "published" : "draft"})`);
  }
  done += 1;
}
console.log(dry ? `validated ${files.length} file(s)` : `imported ${done} file(s)`);
