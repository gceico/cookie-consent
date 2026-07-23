/**
 * Google Consent Mode v2 helpers, generalized from the inline bootstrap in
 * `website/src/layouts/BaseLayout.astro` (lines 196-241) and the
 * `applyConsent` function in `website/src/components/CookieBanner.tsx`.
 *
 * Everything here is opt-in: importing the package does not touch
 * `window.dataLayer` or load any script. A host calls `bootstrapConsentMode`
 * once (ideally inline, before any tag manager script) and the component
 * calls `applyConsent` whenever the visitor's decision changes.
 */
import type { ConsentModeOptions, ConsentPrefs } from "./types";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const DEFAULT_REGION = ["EEA", "EU", "GB", "CH", "IS", "LI", "NO"];
const DEFAULT_EVENT_NAME = "cookie_consent_update";

/** Default mapping from category id to the Consent Mode v2 signal(s) it
 * controls. Hosts using non-default category ids should pass their own
 * `categoryToSignals` in `ConsentModeOptions`. */
const DEFAULT_CATEGORY_TO_SIGNALS: Record<string, string[]> = {
  statistics: ["analytics_storage"],
  marketing: ["ad_storage", "ad_user_data", "ad_personalization"],
  preferences: ["functionality_storage", "personalization_storage"],
};

const ALL_SIGNALS = [
  "analytics_storage",
  "ad_storage",
  "ad_user_data",
  "ad_personalization",
  "functionality_storage",
  "personalization_storage",
];

function pushGtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === "function") {
    window.gtag(...args);
  } else {
    window.dataLayer.push(args);
  }
}

/** Build the Consent Mode v2 `update` object for a given prefs map. Any
 * signal not covered by `categoryToSignals` defaults to "granted" (matches
 * the reference's `security_storage: "granted"` always-on signal). */
function buildSignalUpdate(
  prefs: ConsentPrefs,
  categoryToSignals: Record<string, string[]>,
): Record<string, "granted" | "denied"> {
  const grantedSignals = new Set<string>();
  for (const [categoryId, signals] of Object.entries(categoryToSignals)) {
    if (prefs[categoryId]) signals.forEach((s) => grantedSignals.add(s));
  }
  const update: Record<string, "granted" | "denied"> = { security_storage: "granted" };
  for (const signal of ALL_SIGNALS) {
    update[signal] = grantedSignals.has(signal) ? "granted" : "denied";
  }
  return update;
}

/** Call once, as early as possible (ideally inline in `<head>`, before any
 * tag manager script), to set Consent Mode v2 defaults to denied and
 * optionally load GA4. Safe to call multiple times. */
export function bootstrapConsentMode(options: ConsentModeOptions = {}): void {
  if (typeof window === "undefined") return;
  const region = options.region ?? DEFAULT_REGION;
  const waitForUpdateMs = options.waitForUpdateMs ?? 500;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer.push(args));

  pushGtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: waitForUpdateMs,
    region,
  });
  pushGtag("set", "ads_data_redaction", true);
  pushGtag("set", "url_passthrough", true);

  try {
    if (
      (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
    ) {
      pushGtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        functionality_storage: "denied",
        personalization_storage: "denied",
      });
    }
  } catch {
    /* navigator.globalPrivacyControl access can throw in locked-down contexts */
  }

  if (options.measurementId) {
    const measurementId = options.measurementId;
    const anonymizeIp = options.anonymizeIp ?? true;
    window.addEventListener("load", () => {
      setTimeout(() => {
        const s = document.createElement("script");
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(s);
        pushGtag("js", new Date());
        pushGtag("config", measurementId, { anonymize_ip: anonymizeIp });
      }, 100);
    });
  }
}

/** Call whenever the visitor's consent decision changes (on first load with
 * an existing decision, and after every explicit/migrated choice). */
export function applyConsent(prefs: ConsentPrefs, options: ConsentModeOptions = {}): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  const categoryToSignals = options.categoryToSignals ?? DEFAULT_CATEGORY_TO_SIGNALS;
  const update = buildSignalUpdate(prefs, categoryToSignals);
  pushGtag("consent", "update", update);
  const eventName = options.eventName ?? DEFAULT_EVENT_NAME;
  window.dataLayer.push({ event: eventName, consent: prefs });
}
