/**
 * Upserts the affiliate links behind the flight help cards into `affiliate_links`.
 *
 *   node --env-file=.env.local scripts/import-flight-links.mjs          # write
 *   node --env-file=.env.local scripts/import-flight-links.mjs --dry    # check only
 *
 * Reads content/flight-help/links.json: { "<link slug>": { programme, label, url } }.
 * The slug is the one a card in src/core/content/flight-help.ts names, so the
 * affiliate URL lives only in the database and is reached through /go/{slug}.
 * Uses the service-role key, so it runs locally and never ships.
 */
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const dry = process.argv.includes("--dry");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const links = JSON.parse(readFileSync("content/flight-help/links.json", "utf8"));

for (const [slug, link] of Object.entries(links)) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`bad slug ${slug}`);
  if (!/^https:\/\//.test(link.url)) throw new Error(`${slug}: url must be https`);
  if (dry) {
    console.log(`ok   ${slug}`);
    continue;
  }

  const { data: program, error: pe } = await db
    .from("affiliate_programs").select("id").eq("slug", link.programme).maybeSingle();
  if (pe) throw new Error(`${slug}: ${pe.message}`);
  if (!program) throw new Error(`${slug}: unknown programme "${link.programme}"`);

  const { data: existing, error: le } = await db
    .from("affiliate_links").select("id").eq("slug", slug).is("deleted_at", null).maybeSingle();
  if (le) throw new Error(`${slug}: ${le.message}`);

  const fields = {
    program_id: program.id,
    slug,
    label: link.label,
    destination_url: link.url,
    status: "active",
  };
  const { error } = existing
    ? await db.from("affiliate_links").update(fields).eq("id", existing.id)
    : await db.from("affiliate_links").insert(fields);
  if (error) throw new Error(`${slug}: ${error.message}`);
  console.log(`${existing ? "updated" : "created"} ${slug}`);
}
console.log(dry ? `validated ${Object.keys(links).length} link(s)` : "done");
