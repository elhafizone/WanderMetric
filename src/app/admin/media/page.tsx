import { AdminEmpty, AdminHeader, AdminNotice } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Media library.
 *
 * Rows point at Supabase Storage objects; bytes never live in Postgres. Alt text
 * is required by a database constraint, so an image without it cannot exist -
 * that is an accessibility and image-SEO requirement rather than a nicety.
 */
export default async function MediaPage() {
  await requireStaff();
  const db = await createSupabaseServerClient();

  const { data, count } = await db
    .from("media")
    .select("id, filename, alt_text, mime_type, width, height, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = data ?? [];

  return (
    <>
      <AdminHeader title="Media" description={`${count ?? 0} items.`} />

      <AdminNotice>
        Uploading requires a Supabase Storage bucket and the service-role key. Neither is
        configured yet, so this list is read-only. Alt text is mandatory at the database
        level for every image.
      </AdminNotice>

      {rows.length === 0 ? (
        <AdminEmpty message="No media uploaded yet." />
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-border bg-surface-2 border-b">
                {["File", "Alt text", "Type", "Size"].map((h) => (
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
                  <td className="px-4 py-2.5">{row.filename}</td>
                  <td className="text-ink-muted px-4 py-2.5">{row.alt_text}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{row.mime_type}</td>
                  <td className="text-ink-muted px-4 py-2.5 tabular-nums">
                    {row.width && row.height ? `${row.width}x${row.height}` : "-"}
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
