/**
 * Links that already carry attribution.
 *
 * A short link generated in the owner's Travelpayouts dashboard (`brand.tpx.li/…`)
 * is attributed to the account when it is created, so it must be sent to the
 * visitor as stored. Running it through a provider again would either fail
 * without credentials or wrap an affiliate link inside another one.
 *
 * Only an exact `tpx.li` host or one of its subdomains over https qualifies.
 * The check is on the parsed hostname, so `evil.com/?x=klook.tpx.li` and
 * `klook.tpx.li.evil.com` do not pass.
 */
const PREBUILT_HOSTS = ["tpx.li", "tp.media"];

export function isPrebuiltAffiliateUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  return PREBUILT_HOSTS.some((target) => host === target || host.endsWith(`.${target}`));
}
