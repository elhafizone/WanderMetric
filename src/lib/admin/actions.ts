"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { untypedTable } from "@/lib/admin/generic-table";
import { getResource, type ResourceConfig } from "@/lib/admin/resources";
import { recordAudit } from "@/lib/auth/audit";
import { requireStaff } from "@/lib/auth/session";
import { logError } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Generic CRUD server actions.
 *
 * Writes go through the SESSION client, not the service role. That is
 * deliberate: RLS then evaluates every mutation as the signed-in staff member,
 * so the database remains the authorisation boundary rather than this code. A
 * bug here cannot grant an editor powers their role does not have.
 */

export interface ActionState {
  ok: boolean;
  error?: string;
}

function coerce(config: ResourceConfig, form: FormData): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const field of config.fields) {
    const raw = form.get(field.name);

    switch (field.kind) {
      case "boolean":
        values[field.name] = raw === "on" || raw === "true";
        break;
      case "number": {
        const text = typeof raw === "string" ? raw.trim() : "";
        values[field.name] = text === "" ? null : Number(text);
        break;
      }
      case "datetime": {
        const text = typeof raw === "string" ? raw.trim() : "";
        values[field.name] = text === "" ? null : new Date(text).toISOString();
        break;
      }
      default: {
        const text = typeof raw === "string" ? raw.trim() : "";
        // Empty means "not set". Writing "" would defeat every `is null` check.
        values[field.name] = text === "" ? null : text;
      }
    }
  }

  return values;
}

/**
 * Turns a database error into something an editor can act on.
 *
 * The publish-gate CHECK constraints are the important case: "violates check
 * constraint" tells a writer nothing, whereas naming the actual rule tells them
 * exactly what to fix.
 */
function explain(message: string): string {
  if (message.includes("destinations_published_needs_body")) {
    return "A destination needs at least 300 characters of body text before it can be published.";
  }
  if (message.includes("destinations_published_needs_excerpt")) {
    return "A destination needs an excerpt of at least 50 characters before it can be published.";
  }
  if (message.includes("guides_published_needs_body")) {
    return "A guide needs at least 500 characters of body text before it can be published.";
  }
  if (message.includes("affiliate_links_destination_is_http")) {
    return "The destination URL must be an absolute http:// or https:// address.";
  }
  if (message.includes("duplicate key") || message.includes("already exists")) {
    return "That slug is already in use. Slugs must be unique.";
  }
  if (message.includes("violates foreign key")) {
    return "A referenced record does not exist. Check the selected country, city or programme.";
  }
  if (message.includes("row-level security")) {
    return "Your role does not allow this change.";
  }
  return "The change could not be saved. Please check the values and try again.";
}

export async function saveResource(
  resourceSlug: string,
  id: string | null,
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const config = getResource(resourceSlug);
  if (!config) return { ok: false, error: "Unknown resource." };

  const user = await requireStaff(config.adminOnly ? "admin" : "editor");
  const values = coerce(config, form);
  const db = await createSupabaseServerClient();

  try {
    if (id) {
      const { error } = await untypedTable(db)
        .from(config.table)
        .update(values)
        .eq("id", id);

      if (error) {
        logError("admin.save.update", error, { resource: resourceSlug });
        return { ok: false, error: explain(error.message) };
      }

      await recordAudit(user, "update", config.table, id, values as never);
    } else {
      const { data, error } = await untypedTable(db)
        .from(config.table)
        .insert(values)
        .select("id")
        .single();

      if (error) {
        logError("admin.save.insert", error, { resource: resourceSlug });
        return { ok: false, error: explain(error.message) };
      }

      await recordAudit(user, "create", config.table, data?.id ?? null, values as never);
    }
  } catch (error) {
    logError("admin.save", error, { resource: resourceSlug });
    return { ok: false, error: "Something went wrong saving this record." };
  }

  // Published content feeds ISR pages across the whole site, so the cache is
  // invalidated broadly rather than guessing which routes were affected.
  revalidatePath("/", "layout");
  redirect(`/admin/${resourceSlug}?saved=1`);
}

/**
 * Soft delete where the table supports it.
 *
 * Content is never hard-deleted: accidentally removing a published page with
 * inbound links is not recoverable, whereas `deleted_at` removes it from every
 * public query while keeping it restorable.
 */
export async function deleteResource(
  resourceSlug: string,
  id: string,
): Promise<ActionState> {
  const config = getResource(resourceSlug);
  if (!config) return { ok: false, error: "Unknown resource." };

  const user = await requireStaff(config.adminOnly ? "admin" : "editor");
  const db = await createSupabaseServerClient();

  const { error } = config.softDelete
    ? await untypedTable(db)
        .from(config.table)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
    : await untypedTable(db).from(config.table).delete().eq("id", id);

  if (error) {
    logError("admin.delete", error, { resource: resourceSlug });
    return { ok: false, error: explain(error.message) };
  }

  await recordAudit(user, "delete", config.table, id);
  revalidatePath("/", "layout");
  redirect(`/admin/${resourceSlug}?deleted=1`);
}
