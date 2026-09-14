import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminEmpty, AdminHeader, AdminNotice, StatusPill } from "@/components/admin/ui";
import { getResource } from "@/lib/admin/resources";
import { requireStaff, canEdit } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

/**
 * Generic resource list.
 *
 * One screen serves every configured entity. Reads run through the session
 * client, so an editor sees exactly what RLS permits — including drafts, which
 * the public site cannot see.
 */
export default async function ResourceListPage({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ q?: string; page?: string; saved?: string; deleted?: string }>;
}) {
  const { resource } = await params;
  const config = getResource(resource);
  if (!config) notFound();

  const user = await requireStaff(config.adminOnly ? "admin" : "viewer");
  const { q, page, saved, deleted } = await searchParams;

  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;

  const db = await createSupabaseServerClient();
  const selectColumns = ["id", ...config.columns.map((c) => c.name), "updated_at"].join(
    ", ",
  );

  let query = db
    .from(config.table)
    .select(selectColumns, { count: "exact" })
    .order(config.orderBy.column, { ascending: config.orderBy.ascending })
    .range(from, from + PAGE_SIZE - 1);

  if (config.softDelete) query = query.is("deleted_at", null);
  if (q?.trim()) query = query.ilike(config.searchColumn, `%${q.trim()}%`);

  const { data, count, error } = await query;
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const editable = canEdit(user.role) && (!config.adminOnly || user.role === "admin");

  return (
    <>
      <AdminHeader
        title={config.label}
        description={config.description}
        action={
          editable
            ? {
                href: `/admin/${config.slug}/new`,
                label: `New ${config.labelSingular.toLowerCase()}`,
              }
            : undefined
        }
      />

      {saved && <AdminNotice>Saved.</AdminNotice>}
      {deleted && (
        <AdminNotice>Deleted. The record is recoverable from the database.</AdminNotice>
      )}
      {error && (
        <AdminNotice tone="warning">Could not load records: {error.message}</AdminNotice>
      )}

      <form method="get" className="mb-4 flex gap-2">
        <label htmlFor="admin-search" className="sr-only">
          Search {config.label}
        </label>
        <input
          id="admin-search"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder={`Search by ${config.searchColumn.replace(/_/g, " ")}…`}
          className="border-border bg-surface focus-visible:border-accent min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="border-border hover:border-accent hover:text-accent rounded-md border px-4 py-2 text-sm"
        >
          Search
        </button>
      </form>

      {rows.length === 0 ? (
        <AdminEmpty
          message={
            q
              ? `No ${config.label.toLowerCase()} match “${q}”.`
              : `No ${config.label.toLowerCase()} yet.`
          }
        />
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-border bg-surface-2 border-b">
                {config.columns.map((column) => (
                  <th
                    key={column.name}
                    scope="col"
                    className="text-ink-muted px-4 py-2.5 text-left font-mono text-[10px] tracking-[0.1em] uppercase"
                  >
                    {column.label}
                  </th>
                ))}
                <th
                  scope="col"
                  className="text-ink-muted px-4 py-2.5 text-right font-mono text-[10px] tracking-[0.1em] uppercase"
                >
                  {editable ? "Edit" : "View"}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={String(row.id)}
                  className="border-border border-b last:border-b-0"
                >
                  {config.columns.map((column) => (
                    <td key={column.name} className="px-4 py-2.5">
                      {column.status ? (
                        <StatusPill status={String(row[column.name] ?? "")} />
                      ) : (
                        <span className="line-clamp-1">
                          {String(row[column.name] ?? "—")}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/admin/${config.slug}/${String(row.id)}`}
                      className="text-accent underline-offset-4 hover:underline"
                    >
                      {editable ? "Edit" : "View"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-4 flex items-center justify-between text-sm"
        >
          {currentPage > 1 ? (
            <Link
              className="border-border hover:border-accent rounded-md border px-3 py-1.5"
              href={`/admin/${config.slug}?page=${currentPage - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-muted tabular-nums">
            Page {currentPage} of {totalPages} · {total} total
          </span>
          {currentPage < totalPages ? (
            <Link
              className="border-border hover:border-accent rounded-md border px-3 py-1.5"
              href={`/admin/${config.slug}?page=${currentPage + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
