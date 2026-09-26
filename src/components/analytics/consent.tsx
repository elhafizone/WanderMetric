"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";

import { buttonClass } from "@/components/ui/button";

/**
 * Cookie consent, and the only place Google Analytics is loaded.
 *
 * Nothing from Google is requested until the reader presses Accept. That is the
 * strictest reading of what the ePrivacy rules and the GDPR ask of a site with
 * European visitors, and it also keeps the third-party script out of the page
 * for everyone who declines, so they pay nothing for it.
 *
 * The choice lives in localStorage — first-party, never sent to a server — and
 * is exposed through `useSyncExternalStore`, so the server render and the first
 * client render agree (both "unknown") and the banner appears only once the real
 * value has been read.
 *
 * Analytics is configured to collect the minimum: Google signals and ad
 * personalisation are off, so this is measurement only, not an advertising
 * identifier. If the reader later declines, `ga-disable-<id>` stops further
 * hits at once; the script itself goes away on the next page load.
 */

const KEY = "wm-consent";
export const OPEN_CONSENT_EVENT = "wm:open-consent";

type Stored = "granted" | "denied" | "unset";
type Snapshot = Stored | "server";

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function read(): Snapshot {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch {
    // Private mode or blocked storage: treat as undecided, never as consent.
    return "unset";
  }
}

function write(value: "granted" | "denied") {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // Not persisted, but the in-memory listeners below still update this visit.
  }
  listeners.forEach((listener) => listener());
}

export function ConsentManager({ gaId }: { gaId: string }) {
  const stored = useSyncExternalStore<Snapshot>(subscribe, read, () => "server");
  const [reopened, setReopened] = useState(false);
  // Held for this visit even when storage is unavailable.
  const [session, setSession] = useState<"granted" | "denied" | null>(null);

  useEffect(() => {
    const reopen = () => setReopened(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  const choice = session ?? (stored === "granted" || stored === "denied" ? stored : null);
  const showBanner = stored !== "server" && (choice === null || reopened);

  function decide(value: "granted" | "denied") {
    write(value);
    setSession(value);
    setReopened(false);
    if (value === "denied") {
      (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = true;
    }
  }

  return (
    <>
      {choice === "granted" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{allow_google_signals:false,allow_ad_personalization_signals:false});`}
          </Script>
        </>
      )}

      {showBanner && (
        <div
          role="dialog"
          aria-label="Cookie preferences"
          className="border-border bg-surface fixed inset-x-3 bottom-3 z-[70] rounded-2xl border p-5 shadow-[0_24px_60px_-20px_rgba(45,37,24,0.45)] sm:right-auto sm:bottom-5 sm:left-5 sm:max-w-md"
        >
          <p className="text-ink text-sm/[1.55]">
            We would like to use Google Analytics to see which pages are useful. It sets
            cookies only if you accept, and advertising features are switched off.{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              Privacy policy
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => decide("granted")}
              className={buttonClass("primary", "sm")}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => decide("denied")}
              className={buttonClass("secondary", "sm")}
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Footer control that lets a reader change their mind. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
    >
      Cookie settings
    </button>
  );
}
