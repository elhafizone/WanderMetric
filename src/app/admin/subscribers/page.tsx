import { AdminEmpty, AdminHeader, AdminNotice, StatusPill } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Subscriber list. Admin-only: the mailing list is the most personal data this
 * system holds, and RLS grants it to no other role.
 */
export default async function SubscribersPage() {
  await requireStaff("admin");
  const db = await createSupabaseServerClient();

  const { data, count } = await db
    .from("email_subscribers")
    .select("id, email, status, source, created_at, confirmed_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = data ?? [];

  return (
    <>
      <AdminHeader
        title="Subscribers"
        description={`${count ?? 0} total. Double opt-in - a subscriber counts only once they confirm.`}
      />

      <AdminNotice>
        No confirmation emails are being sent yet: no email provider is configured. New
        signups stay <strong>pending</strong> until one is connected. See
        docs/architecture.md.
      </AdminNotice>

      {rows.length === 0 ? (
        <AdminEmpty message="No subscribers yet." />
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-border bg-surface-2 border-b">
                {["Email", "Status", "Source", "Signed up"].map((h) => (
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
                  <td className="px-4 py-2.5">{row.email}</td>
                  <td className="px-4 py-2.5">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="text-ink-muted px-4 py-2.5">{row.source ?? "-"}</td>
                  <td className="text-ink-muted px-4 py-2.5 tabular-nums">
                    {new Date(row.created_at).toLocaleDateString("en-GB")}
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
