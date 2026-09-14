import "server-only";

import type { Json } from "@/types/database";
import { logError } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StaffUser } from "@/lib/auth/session";

/**
 * Records an admin mutation.
 *
 * Written with the service role because `audit_log` grants no insert policy to
 * any client role — the trail is append-only and must not be forgeable by the
 * same session that performed the action.
 *
 * Failures are logged and swallowed: losing an audit line is bad, but failing
 * the user's actual edit because the audit write failed is worse.
 */
export async function recordAudit(
  actor: StaffUser,
  action: "create" | "update" | "delete" | "publish" | "unpublish",
  entityType: string,
  entityId: string | null,
  changes?: Json,
): Promise<void> {
  try {
    const db = createSupabaseAdminClient();
    await db.from("audit_log").insert({
      actor_id: actor.id,
      actor_email: actor.email,
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes: changes ?? null,
    });
  } catch (error) {
    logError("audit.record", error, { action, entityType });
  }
}
