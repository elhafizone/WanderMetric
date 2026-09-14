import Link from "next/link";

import { AdminHeader, AdminNotice, StatCard } from "@/components/admin/ui";
import { untypedTable } from "@/lib/admin/generic-table";
import { requireStaff } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Dashboard overview.
 *
 * Counts come from head-only queries (`head: true` with an exact count), so the
 * database returns a number rather than the rows themselves.
 *
 * Click and view totals read the raw tables here because volume is currently
 * zero. Once traffic is real these must move to `daily_stats` — scanning event
 * tables from a dashboard is exactly the mistake the rollup exists to prevent.
 */
async function countRows(
  db: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table:
    | "destinations"
    | "guides"
    | "hotels"
    | "activities"
    | "deals"
    | "countries"
    | "cities"
    | "affiliate_links"
    | "email_subscribers"
    | "affiliate_clicks"
    | "media",
  published = false,
): Promise<number> {
  // Same union problem as the generic CRUD paths: "status" does not exist on
  // every table in the union, so the typed client rejects it.
  let query = untypedTable(db).from(table).select("*", { count: "exact", head: true });
  if (published) query = query.eq("status", "published");
  const { count } = await query;
  return count ?? 0;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await requireStaff();
  const { denied } = await searchParams;
  const db = await createSupabaseServerClient();

  const [
    destinations,
    publishedDestinations,
    guides,
    publishedGuides,
    hotels,
    activities,
    deals,
    countries,
    cities,
    links,
    subscribers,
    clicks,
    media,
  ] = await Promise.all([
    countRows(db, "destinations"),
    countRows(db, "destinations", true),
    countRows(db, "guides"),
    countRows(db, "guides", true),
    countRows(db, "hotels"),
    countRows(db, "activities"),
    countRows(db, "deals"),
    countRows(db, "countries"),
    countRows(db, "cities"),
    countRows(db, "affiliate_links"),
    countRows(db, "email_subscribers"),
    countRows(db, "affiliate_clicks"),
    countRows(db, "media"),
  ]);

  return (
    <>
      <AdminHeader
        title={`Welcome back${user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`}
        description="Everything published here is live on wandermetric.com."
      />

      {denied && (
        <AdminNotice tone="warning">
          You do not have permission to open that section. Your role is{" "}
          <strong>{user.role}</strong>.
        </AdminNotice>
      )}

      <section className="mb-8 flex flex-col gap-3">
        <h2 className="text-sm font-medium">Content</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Destinations"
            value={destinations}
            hint={`${publishedDestinations} published`}
          />
          <StatCard label="Guides" value={guides} hint={`${publishedGuides} published`} />
          <StatCard label="Hotels" value={hotels} />
          <StatCard label="Activities & tours" value={activities} />
        </div>
      </section>

      <section className="mb-8 flex flex-col gap-3">
        <h2 className="text-sm font-medium">Places & monetisation</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Countries" value={countries} />
          <StatCard label="Cities" value={cities} />
          <StatCard label="Affiliate links" value={links} />
          <StatCard label="Deals" value={deals} />
        </div>
      </section>

      <section className="mb-8 flex flex-col gap-3">
        <h2 className="text-sm font-medium">Audience</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Subscribers" value={subscribers} />
          <StatCard
            label="Affiliate clicks"
            value={clicks}
            hint="Bots are never recorded"
          />
          <StatCard label="Media items" value={media} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/admin/destinations/new", label: "New destination" },
            { href: "/admin/guides/new", label: "New guide" },
            { href: "/admin/deals/new", label: "New deal" },
            { href: "/admin/affiliate-links/new", label: "New affiliate link" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="border-border hover:border-accent hover:text-accent rounded-md border px-4 py-2 text-sm"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
