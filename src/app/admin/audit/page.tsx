import { AdminEmpty, AdminHeader } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Audit trail. Append-only by design: no role holds an update or delete policy
 * on this table, and entries are written with the service role so the session
 * that performed an action cannot alter its own record of it.
 */
export default async function AuditPage() {
  await requireStaff();
  const db = await createSupabaseServerClient();

  const { data } = await db
    .from("audit_log")
    .select("id, actor_email, action, entity_type, entity_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = data ?? [];

  return (
    <>
      <AdminHeader
        title="Audit log"
        description="Every admin mutation, newest first. Append-only - entries cannot be edited or removed."
      />

      {rows.length === 0 ? (
        <AdminEmpty message="No admin actions recorded yet." />
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-border bg-surface-2 border-b">
                {["When", "Who", "Action", "Entity"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="text-ink-muted px-4 py-2.5 text-left font-mono text-[10px] tracking-[0.1em] uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-border border-b last:border-b-0">
                  <td className="text-ink-muted px-4 py-2.5 tabular-nums">
                    {new Date(row.created_at).toLocaleString("en-GB")}
                  </td>
                  <td className="px-4 py-2.5">{row.actor_email ?? "-"}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{row.action}</td>
                  <td className="text-ink-muted px-4 py-2.5">{row.entity_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
