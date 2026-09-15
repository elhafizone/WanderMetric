import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Chrome for the public site.
 *
 * A route group, so it adds no URL segment. Admin lives outside it and supplies
 * its own shell — otherwise the dashboard would inherit the marketing header
 * and footer.
 *
 * The header is fixed, so it is out of flow: pages that do not open with a
 * full-bleed hero clear it with `PageShell`, and hero pages deliberately run
 * underneath it.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="bg-accent text-accent-contrast sr-only rounded-full px-5 py-2.5 text-sm font-medium shadow-lg focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60]"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
