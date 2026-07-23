import type {
  ConsentCategory,
  ConsentPrefs,
  CookieConsentConfig,
  CookieConsentText,
  ResolvedCookieConsentConfig,
} from "./types";
import { noopAdapter } from "./storage/none";

export const DEFAULT_CATEGORIES: ConsentCategory[] = [
  {
    id: "necessary",
    label: "Necessary",
    alwaysOn: true,
    description:
      "Necessary cookies help make the website usable by enabling basic functions like page navigation and access to secure areas. The site cannot function properly without them.",
  },
  {
    id: "preferences",
    label: "Preferences",
    alwaysOn: false,
    description:
      "Preference cookies remember information that changes how the site behaves or looks, like your preferred language or region.",
  },
  {
    id: "statistics",
    label: "Statistics",
    alwaysOn: false,
    description:
      "Statistics cookies help us understand how visitors interact with the site by collecting and reporting information anonymously.",
  },
  {
    id: "marketing",
    label: "Marketing",
    alwaysOn: false,
    description:
      "Marketing cookies track visitors across websites to show ads that are relevant and engaging for the individual user.",
  },
];

export const DEFAULT_TEXT: CookieConsentText = {
  title: "We use cookies",
  description:
    "Accepting analytics helps us learn what works, fix what doesn't, and build features you'll actually use. Your choice — accept all, deny all, or pick per category. Change anytime from our {policyLink}.",
  policyLabel: "Cookie Policy",
  policyHref: "/cookie-policy/",
  privacyLabel: "Privacy Policy",
  privacyHref: "/privacy/",
  gpcNotice: "Global Privacy Control detected — non-essential cookies auto-denied.",
  tabConsent: "Consent",
  tabDetails: "Details",
  tabAbout: "About",
  detailsFooter:
    "See our {policyLink} for the full list of cookies, providers, purposes, and retention periods.",
  aboutParagraphs: [
    "Cookies are small text files used by websites to make a user's experience more efficient.",
    "EU law requires your permission for any non-essential cookie. Strictly necessary cookies are used without consent.",
    "Some cookies are placed by third-party services on our pages.",
    "You can change or withdraw consent at any time from the {policyLink} page.",
    "Learn how we process personal data in our {privacyLink}.",
  ],
  denyAll: "Deny all",
  allowSelection: "Allow selection",
  allowAll: "Allow all",
  reopenAriaLabel: "Open cookie preferences",
};

/** Derive a fully-denied preference map from a category list — every
 * non-`alwaysOn` category is false, `alwaysOn` ones are true. */
export function deniedPrefs(categories: ConsentCategory[]): ConsentPrefs {
  return Object.fromEntries(categories.map((c) => [c.id, c.alwaysOn]));
}

/** Derive a fully-granted preference map — every category true. */
export function grantedPrefs(categories: ConsentCategory[]): ConsentPrefs {
  return Object.fromEntries(categories.map((c) => [c.id, true]));
}

/** Default preferences shown before the visitor has decided anything.
 * Same shape as `deniedPrefs` (only `alwaysOn` categories start true). */
export function defaultPrefs(categories: ConsentCategory[]): ConsentPrefs {
  return deniedPrefs(categories);
}

/** Merge a partial user config over the package defaults. */
export function resolveConfig(userConfig: CookieConsentConfig = {}): ResolvedCookieConsentConfig {
  const categories = userConfig.categories ?? DEFAULT_CATEGORIES;
  return {
    cookieName: userConfig.cookieName ?? "cookie_consent",
    tokenStorageKey: userConfig.tokenStorageKey ?? "cc_token",
    consentVersion: userConfig.consentVersion ?? 1,
    bannerVersion: userConfig.bannerVersion ?? 1,
    categories,
    text: { ...DEFAULT_TEXT, ...userConfig.text },
    trigger: {
      timeoutMs: userConfig.trigger?.timeoutMs ?? 6000,
      scrollThresholdPx: userConfig.trigger?.scrollThresholdPx ?? 400,
    },
    globalOpenFnName: userConfig.globalOpenFnName ?? "openCookieConsent",
    openEventName: userConfig.openEventName ?? "cookie-consent:open",
    storage: userConfig.storage ?? noopAdapter(),
    consentMode: userConfig.consentMode,
    migrateFromCookiebot: userConfig.migrateFromCookiebot ?? false,
  };
}
