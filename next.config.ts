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

const LEGACY_CITIES = "paris|rome|lyon|nice|naples|florence|seville|madrid|barcelona|kyoto|tokyo|porto|lisbon";

/** [old path, new path]. Specific entries come before the catch-alls. */
const legacyRedirects: Array<[string, string]> = [
  ["/tours/rome/rome-colosseum-forum-palatine-guided-tour", "/tours-activities/italy/rome-colosseum-forum-palatine-guided-tour"],
  ["/tours/kyoto/kyoto-fushimi-inari-evening-walking-tour", "/tours-activities/japan/kyoto-fushimi-inari-evening-walking-tour"],
  ["/tours/aswan/aswan-abu-simbel-temples-full-day-guided-tour", "/tours-activities/egypt/aswan-abu-simbel-temples-full-day-guided-tour"],
  ["/activities/barcelona/barcelona-sagrada-familia-tickets-and-tours", "/tours-activities/spain/barcelona-sagrada-familia-tickets-and-tours"],
  ["/guides/travel-esim-guide", "/sim-cards"],
  ["/guides/airport-transfers-guide", "/transfers"],
  ["/guides/car-and-bike-rental-guide", "/car-rentals"],
  ["/guides/travel-insurance-guide", "/insurance"],
  ["/guides/flight-delay-compensation-eu", "/travel-services"],
  ["/guides", "/"],
  ["/guides/:path*", "/"],
  ["/deals", "/"],
  ["/deals/:path*", "/"],
  ["/destinations", "/"],
  ["/destinations/:path*", "/"],
  ["/activities", "/tours-activities"],
  ["/activities/:path*", "/tours-activities"],
  ["/tours", "/tours-activities"],
  ["/tours/:path*", "/tours-activities"],
  ["/car-hire", "/car-rentals"],
  ["/esim", "/sim-cards"],
  [`/hotels/:city(${LEGACY_CITIES})`, "/hotels"],
  [`/hotels/:city(${LEGACY_CITIES})/:slug`, "/hotels"],
  ["/flights/:route(paris-to-rome|lisbon-to-porto|tokyo-to-kyoto)", "/flights"],
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The Hostinger build host reports 57 CPUs but caps threads and memory per
  // account; with one worker per CPU the build died with EAGAIN / SIGABRT while
  // collecting page data (October 2026). A small fixed count builds reliably.
  experimental: { cpus: 4 },
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
      // The site was reorganised into ten sections (October 2026). Old URLs go to
      // the closest new page; the pilot guides keep their own address.
      ...legacyRedirects.map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
