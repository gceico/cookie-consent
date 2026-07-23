/**
 * Cookie read/write + root-domain resolution utilities, generalized from
 * `website/src/components/CookieBanner.tsx` to take a cookie name instead of
 * a hardcoded one.
 */
import type { ConsentRecord } from "./types";

export const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

const PUBLIC_SUFFIXES = new Set([
  "netlify.app",
  "vercel.app",
  "pages.dev",
  "github.io",
  "web.app",
  "firebaseapp.com",
]);

export function isSecureContext(): boolean {
  return typeof location !== "undefined" && location.protocol === "https:";
}

/** The registrable root domain (e.g. `example.com` for `www.example.com`),
 * or null when we shouldn't set a domain attribute at all (localhost, bare
 * IPs, or known multi-tenant hosting suffixes). */
export function rootDomain(): string | null {
  if (typeof location === "undefined") return null;
  const host = location.hostname;
  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  const parts = host.split(".");
  const root = parts.length >= 2 ? parts.slice(-2).join(".") : host;
  if (PUBLIC_SUFFIXES.has(root)) return null;
  return root;
}

/** Every `;domain=` variant worth clearing a cookie under, from most to
 * least specific. Used when deleting cookies whose original domain scope is
 * unknown (e.g. migrating away from a third-party consent tool). */
export function cookieDomains(): string[] {
  const root = rootDomain();
  if (!root) return [""];
  const host = location.hostname;
  return ["", `;domain=${host}`, `;domain=.${host}`, `;domain=${root}`, `;domain=.${root}`];
}

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"),
  );
  return m ? decodeURIComponent(m[1]) : null;
}

export function writeConsentCookie(cookieName: string, record: ConsentRecord): void {
  const value = encodeURIComponent(JSON.stringify(record));
  const secure = isSecureContext() ? ";Secure" : "";
  const root = rootDomain();
  const domain = root ? `;domain=.${root}` : "";
  document.cookie = `${cookieName}=${value};max-age=${ONE_YEAR_SECONDS};path=/${domain};SameSite=Lax${secure}`;
}

export function readConsentRecord(
  cookieName: string,
  consentVersion: number,
): ConsentRecord | null {
  const raw = readCookie(cookieName);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.version !== consentVersion) return null;
    if (!parsed.prefs) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getOrCreateToken(storageKey: string): string {
  if (typeof localStorage === "undefined") return "";
  let tok = localStorage.getItem(storageKey);
  if (!tok) {
    tok = crypto.randomUUID();
    localStorage.setItem(storageKey, tok);
  }
  return tok;
}

export function detectGPC(): boolean {
  return (
    typeof navigator !== "undefined" &&
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  );
}
