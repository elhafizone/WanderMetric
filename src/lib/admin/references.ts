import "server-only";

import type { ReferenceTable } from "@/lib/admin/resources";
import type { ReferenceOptions } from "@/components/admin/resource-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Loads dropdown options for `reference` fields.
 *
 * Only the tables a resource actually references are queried, and only the two
 * columns a <select> needs.
 */
export async function loadReferenceOptions(
  tables: ReferenceTable[],
): Promise<ReferenceOptions> {
  const db = await createSupabaseServerClient();
  const unique = [...new Set(tables)];
  const options: ReferenceOptions = {};

  await Promise.all(
    unique.map(async (table) => {
      switch (table) {
        case "countries": {
          const { data } = await db
            .from("countries")
            .select("id, name")
            .is("deleted_at", null)
            .order("name");
          options[table] = (data ?? []).map((r) => ({ value: r.id, label: r.name }));
          break;
        }
        case "cities": {
          const { data } = await db
            .from("cities")
            .select("id, name, country:countries!cities_country_id_fkey!inner(name)")
            .is("deleted_at", null)
            .order("name");
          options[table] = (data ?? []).map((r) => {
            const country = r.country as unknown as { name: string } | null;
            return {
              value: r.id,
              label: country ? `${r.name}, ${country.name}` : r.name,
            };
          });
          break;
        }
        case "categories": {
          const { data } = await db
            .from("categories")
            .select("id, name, applies_to")
            .order("name");
          options[table] = (data ?? []).map((r) => ({
            value: r.id,
            label: `${r.name} (${r.applies_to})`,
          }));
          break;
        }
        case "media": {
          const { data } = await db
            .from("media")
            .select("id, filename, alt_text")
            .order("created_at", { ascending: false })
            .limit(200);
          options[table] = (data ?? []).map((r) => ({
            value: r.id,
            label: r.filename || r.alt_text,
          }));
          break;
        }
        case "affiliate_programs": {
          const { data } = await db
            .from("affiliate_programs")
            .select("id, name, vertical")
            .order("name");
          options[table] = (data ?? []).map((r) => ({
            value: r.id,
            label: `${r.name} — ${r.vertical}`,
          }));
          break;
        }
      }
    }),
  );

  return options;
}
