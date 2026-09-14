import type { Metadata } from "next";
import Link from "next/link";

import { SignOutButton } from "@/components/admin/sign-out-button";
import { getStaffUser } from "@/lib/auth/session";

/**
 * Admin shell.
 *
 * The whole area is noindex/nofollow and Disallowed in robots.txt.
 *
 * This layout wraps /admin/login too, so it must not itself require a session —
 * it renders the bare children when there is no user, and middleware handles
 * the redirect for protected paths. Each page additionally calls requireStaff(),
 * because a layout is not an authorisation boundary.
 */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · WanderMetric Admin" },
  robots: { index: false, follow: false, nocache: true },
};

const NAV_GROUPS: Array<{
  label: string;
  items: Array<{ href: string; label: string }>;
}> = [
  {
    label: "Content",
    items: [
      { href: "/admin/destinations", label: "Destinations" },
      { href: "/admin/guides", label: "Guides" },
      { href: "/admin/hotels", label: "Hotels" },
      { href: "/admin/activities", label: "Activities & tours" },
      { href: "/admin/deals", label: "Deals" },
    ],
  },
  {
    label: "Places",
    items: [
      { href: "/admin/countries", label: "Countries" },
      { href: "/admin/cities", label: "Cities" },
    ],
  },
  {
    label: "Monetisation",
    items: [
      { href: "/admin/affiliate-links", label: "Affiliate links" },
      { href: "/admin/analytics", label: "Analytics" },
    ],
  },
  {
    label: "Audience",
    items: [
      { href: "/admin/subscribers", label: "Subscribers" },
      { href: "/admin/media", label: "Media" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/audit", label: "Audit log" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getStaffUser();

  // The login page shares this layout and has no user yet.
  if (!user) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="border-border bg-surface flex shrink-0 flex-col gap-6 border-b p-5 lg:h-screen lg:w-60 lg:overflow-y-auto lg:border-r lg:border-b-0">
        <Link href="/admin" className="font-semibold">
          Wander<span className="text-accent">Metric</span>
          <span className="text-ink-muted block text-xs font-normal">Admin</span>
        </Link>

        <nav aria-label="Admin" className="flex flex-col gap-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="text-ink-muted font-mono text-[10px] tracking-[0.14em] uppercase">
                {group.label}
              </p>
              <ul className="flex flex-col">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-ink-muted hover:bg-surface-2 hover:text-ink block rounded-md px-2 py-1.5 text-sm transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-border mt-auto flex flex-col gap-2 border-t pt-4">
          <p className="text-ink-muted truncate text-xs" title={user.email}>
            {user.fullName ?? user.email}
          </p>
          <p className="text-accent font-mono text-[10px] tracking-[0.1em] uppercase">
            {user.role}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/"
              className="border-border hover:border-accent hover:text-accent rounded-md border px-2.5 py-1.5 text-xs"
            >
              View site
            </Link>
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="bg-bg min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-5 py-8">{children}</div>
      </div>
    </div>
  );
}
