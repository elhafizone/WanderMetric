import type { NextConfig } from "next";

/**
 * Baseline security headers. A full Content-Security-Policy arrives once the
 * real script/style/image origins are known (Phase 4+); shipping a wrong CSP now
 * would be worse than shipping none.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The www host answered 200 with the same pages, so every URL existed twice.
  // One canonical host, permanently.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "www.wandermetric.com" }],
        destination: "https://wandermetric.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
