import { AdminEmpty, AdminHeader, AdminNotice } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Site settings.
 *
 * Only rows flagged public are readable by anonymous visitors; everything else
 * is staff-only. Credentials are never stored here - they are environment
 * variables, so that a database dump can never contain a secret.
 */
export default async function SettingsPage() {
  const user = await requireStaff("admin");
  const db = await createSupabaseServerClient();

  const { data } = await db
    .from("site_settings")
    .select("key, value, description, is_public, updated_at")
    .order("key");

  const rows = data ?? [];

  return (
    <>
      <AdminHeader
        title="Settings"
        description={`Signed in as ${user.email} (${user.role}).`}
      />

      <AdminNotice tone="warning">
        Credentials are never stored in the database. API keys, markers and the
        service-role key live in environment variables only, so a database dump can never
        contain a secret.
      </AdminNotice>

      {rows.length === 0 ? (
        <AdminEmpty message="No settings defined." />
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-border bg-surface-2 border-b">
                {["Key", "Value", "Public"].map((h) => (
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
                <tr key={row.key} className="border-border border-b last:border-b-0">
                  <td className="px-4 py-2.5 font-mono text-xs">{row.key}</td>
                  <td className="px-4 py-2.5">{JSON.stringify(row.value)}</td>
                  <td className="text-ink-muted px-4 py-2.5">
                    {row.is_public ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
