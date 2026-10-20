/**
 * Creates the "Travel news" category if it is missing. A guide in this category
 * is a news article (see src/core/news/news.ts). Idempotent.
 *
 *   node --env-file=.env.local scripts/seed-news-category.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const { data: existing, error } = await db
  .from("categories")
  .select("id")
  .eq("slug", "travel-news")
  .eq("applies_to", "guide")
  .maybeSingle();
if (error) throw new Error(error.message);

if (existing) {
  console.log("travel-news category already exists");
} else {
  const { error: insertError } = await db.from("categories").insert({
    name: "Travel news",
    slug: "travel-news",
    description: "Dated reports on changes that affect a trip.",
    applies_to: "guide",
    sort_order: 100,
  });
  if (insertError) throw new Error(insertError.message);
  console.log("created travel-news category");
}
