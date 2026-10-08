/**
 * Turns partner listing URLs into Travelpayouts affiliate links through the
 * documented partner-links API (POST /links/v1/create), the same call
 * src/core/affiliate/providers/travelpayouts.ts makes.
 *
 *   node --env-file=.env.local scripts/make-links.mjs <url> [<url> ...]
 *   node --env-file=.env.local scripts/make-links.mjs --file urls.txt
 *
 * Prints one JSON object per URL: { url, partner_url } or { url, error }. A
 * brand the project is not subscribed to comes back as HTTP 200 with a per-link
 * failure, so success is read from the link, never the status code.
 */
import { readFileSync } from "node:fs";

const marker = Number(process.env.TRAVELPAYOUTS_MARKER);
const trs = Number(process.env.TRAVELPAYOUTS_PROJECT_ID);
const token = process.env.TRAVELPAYOUTS_API_TOKEN;
if (!marker || !trs || !token) {
  console.error("Missing TRAVELPAYOUTS_MARKER, TRAVELPAYOUTS_PROJECT_ID or TRAVELPAYOUTS_API_TOKEN.");
  process.exit(1);
}

const argv = process.argv.slice(2);
const fileIndex = argv.indexOf("--file");
const urls =
  fileIndex >= 0
    ? readFileSync(argv[fileIndex + 1], "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    : argv;
if (urls.length === 0) {
  console.error("No URLs given.");
  process.exit(1);
}

// The API accepts a batch; stay well under its per-request limit.
const BATCH = 10;
for (let i = 0; i < urls.length; i += BATCH) {
  const chunk = urls.slice(i, i + BATCH);
  const response = await fetch("https://api.travelpayouts.com/links/v1/create", {
    method: "POST",
    headers: { "x-access-token": token, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      trs,
      marker,
      shorten: true,
      links: chunk.map((url) => ({ url })),
    }),
  });
  if (response.status === 429) {
    console.error("Rate limited; wait a minute and re-run the remaining URLs.");
    process.exit(2);
  }
  const body = await response.json().catch(() => ({}));
  if (body.code !== "success") {
    for (const url of chunk) console.log(JSON.stringify({ url, error: body.error ?? `HTTP ${response.status}` }));
    continue;
  }
  const links = body.result?.links ?? [];
  chunk.forEach((url, index) => {
    const link = links[index];
    console.log(
      JSON.stringify(
        link?.code === "success" && link.partner_url
          ? { url, partner_url: link.partner_url }
          : { url, error: link?.message ?? "no partner_url returned" },
      ),
    );
  });
}
