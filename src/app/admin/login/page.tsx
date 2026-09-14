import type { Metadata } from "next";

import { LoginForm } from "@/app/admin/login/login-form";

/**
 * Admin sign-in.
 *
 * noindex + nofollow, and /admin/ is Disallowed in robots.txt. An admin login
 * page in the index is an invitation to credential stuffing.
 */
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-16">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="font-semibold">
            Wander<span className="text-accent">Metric</span>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-ink-muted text-sm">
            Staff access only. This area is not indexed.
          </p>
        </div>

        <LoginForm nextPath={next} />
      </div>
    </div>
  );
}
