/**
 * Opt-in migration away from Cookiebot: parse its legacy cookie into our
 * `ConsentPrefs` shape and delete its cookies so it doesn't reappear.
 * Ported from `website/src/components/CookieBanner.tsx`.
 */
import { cookieDomains, readCookie } from "./cookie";
import type { ConsentCategory, ConsentPrefs } from "./types";

/** Parse a `CookieConsent` cookie (Cookiebot's format) into our prefs shape.
 * Returns null if no valid Cookiebot cookie is present. Categories not
 * present in Cookiebot's fixed set (necessary/preferences/statistics/marketing)
 * are left at their `alwaysOn` default; anything else defaults to false. */
export function parseCookiebot(categories: ConsentCategory[]): ConsentPrefs | null {
  const raw = readCookie("CookieConsent");
  if (!raw) return null;
  if (!/stamp:'[^']+'/.test(raw)) return null;
  const truthy = (k: string) => new RegExp(`${k}:(true|1)`).test(raw);
  const prefs: ConsentPrefs = {};
  for (const category of categories) {
    if (category.alwaysOn) {
      prefs[category.id] = true;
    } else if (["preferences", "statistics", "marketing"].includes(category.id)) {
      prefs[category.id] = truthy(category.id);
    } else {
      prefs[category.id] = false;
    }
  }
  return prefs;
}

/** Delete Cookiebot's own cookies across every domain scope we might have
 * been set under, so its banner doesn't reappear. */
export function deleteCookiebotCookies(): void {
  if (typeof document === "undefined") return;
  const names = ["CookieConsent", "CookieConsentBulkTicket", "CookieConsentBulkSetting-#"];
  const paths = ["/", ""];
  for (const name of names) {
    for (const d of cookieDomains()) {
      for (const p of paths) {
        document.cookie = `${name}=; Max-Age=0${p ? `;path=${p}` : ""}${d}`;
      }
    }
  }
}
