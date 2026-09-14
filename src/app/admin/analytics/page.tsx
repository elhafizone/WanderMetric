import { AdminEmpty, AdminHeader, AdminNotice, StatCard } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Traffic and affiliate performance.
 *
 * Every figure here is measured. Conversions and revenue are only ever written
 * by a verified provider webhook or an authenticated report pull, so a zero is
 * an honest zero rather than a placeholder waiting to be filled in.
 */
export default async function AnalyticsPage() {
  await requireStaff();
  const db = await createSupabaseServerClient();

  const [views, clicks, conversions, topLinks] = await Promise.all([
    db.from("page_views").select("*", { count: "exact", head: true }).eq("is_bot", false),
    db
      .from("affiliate_clicks")
      .select("*", { count: "exact", head: true })
      .eq("is_bot", false),
    db.from("affiliate_conversions").select("*", { count: "exact", head: true }),
    db
      .from("affiliate_clicks")
      .select("affiliate_link_id, page_path, created_at, country_code, device")
      .eq("is_bot", false)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const recent = topLinks.data ?? [];

  return (
    <>
      <AdminHeader
        title="Analytics"
        description="First-party measurement. No third-party analytics or advertising trackers are loaded."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Page views" value={views.count ?? 0} hint="Bots excluded" />
        <StatCard
          label="Affiliate clicks"
          value={clicks.count ?? 0}
          hint="Bots excluded"
        />
        <StatCard
          label="Conversions"
          value={conversions.count ?? 0}
          hint="Provider-reported only"
        />
      </div>

      <AdminNotice>
        Conversions and commission are populated exclusively by verified provider
        callbacks or authenticated report pulls. Nothing on this page is estimated or
        inferred. Once traffic is meaningful these counts should be read from{" "}
        <code className="font-mono">daily_stats</code> rather than the raw event tables.
      </AdminNotice>

      <h2 className="mb-3 text-sm font-medium">Recent affiliate clicks</h2>
      {recent.length === 0 ? (
        <AdminEmpty message="No clicks recorded yet." />
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-border bg-surface-2 border-b">
                {["When", "From page", "Country", "Device"].map((h) => (
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
              {recent.map((row, index) => (
                <tr key={index} className="border-border border-b last:border-b-0">
                  <td className="text-ink-muted px-4 py-2.5 tabular-nums">
                    {new Date(row.created_at).toLocaleString("en-GB")}
                  </td>
                  <td className="px-4 py-2.5">{row.page_path ?? "-"}</td>
                  <td className="px-4 py-2.5 font-mono">{row.country_code ?? "-"}</td>
                  <td className="text-ink-muted px-4 py-2.5">{row.device}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
