import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicConfig } from "@/lib/env";

/**
 * Session refresh and admin gate.
 *
 * Two jobs:
 *
 * 1. Refresh the Supabase auth token. Server Components cannot write cookies,
 *    so without middleware a session would silently expire mid-visit.
 *
 * 2. Keep unauthenticated visitors out of /admin. This is a convenience
 *    redirect, NOT the security boundary — middleware can be bypassed in ways
 *    RLS cannot. The real enforcement is Row Level Security plus the per-page
 *    `requireStaff()` check; this layer only avoids showing a broken shell to
 *    someone who is simply not signed in.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const config = getSupabasePublicConfig();
  if (!config) return response;

  const supabase = createServerClient(
    config.NEXT_PUBLIC_SUPABASE_URL,
    config.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() revalidates against the auth server. getSession() only reads the
  // cookie, which is forgeable, so it must never gate access.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";

  if (isAdminRoute && !isLoginRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image optimisation output. /go is
     * excluded deliberately: the redirector is hot, has no session to refresh,
     * and must not pay for an auth round trip on every click.
     */
    "/((?!_next/static|_next/image|favicon.ico|go/|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
