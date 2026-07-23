/**
 * Core types for @gceico/cookie-consent.
 *
 * The whole package is config-driven: nothing in the component or its helpers
 * hardcodes brand strings, cookie names, categories, or a specific analytics
 * vendor. Everything below is what a host app supplies (or accepts the
 * defaults for) via `resolveConfig`.
 */

/** A consent preference map keyed by category id. `necessary` (or whatever
 * category is marked `alwaysOn`) is always true. */
export type ConsentPrefs = Record<string, boolean>;

/** The method by which a consent decision was recorded. */
export type ConsentMethod = "explicit" | "gpc" | "migrated";

/** The record persisted in the consent cookie (and handed to storage adapters). */
export interface ConsentRecord {
  version: number;
  stamp: string;
  method: ConsentMethod;
  gpc: boolean;
  prefs: ConsentPrefs;
}

/** The payload a storage adapter's `log` receives — the consent record plus
 * the bits needed for an audit trail. */
export interface ConsentLogPayload {
  token: string;
  version: number;
  method: ConsentMethod;
  gpc: boolean;
  prefs: ConsentPrefs;
  bannerVersion: number;
  userAgent: string;
  url: string;
}

/** One consent category shown in the "Consent" and "Details" tabs. */
export interface ConsentCategory {
  /** Stable key used in `ConsentPrefs` and the persisted cookie. */
  id: string;
  /** Short label shown in the category grid / details list. */
  label: string;
  /** Longer description shown in the "Details" tab. */
  description: string;
  /** If true, this category can't be turned off (e.g. "necessary"). */
  alwaysOn: boolean;
}

/** Pluggable backend: whatever a host wants to happen with a finished
 * consent decision (write to Supabase, POST to a REST endpoint, or nothing). */
export interface StorageAdapter {
  log(payload: ConsentLogPayload): void | Promise<void>;
}

/** All the copy shown in the banner. Every string has a generic default in
 * `config.ts` — none of it is brand-specific. */
export interface CookieConsentText {
  title: string;
  description: string;
  policyLabel: string;
  policyHref: string;
  privacyLabel: string;
  privacyHref: string;
  gpcNotice: string;
  tabConsent: string;
  tabDetails: string;
  tabAbout: string;
  detailsFooter: string;
  aboutParagraphs: string[];
  denyAll: string;
  allowSelection: string;
  allowAll: string;
  reopenAriaLabel: string;
}

/** Options for `bootstrapConsentMode` / `applyConsent` — the Google Consent
 * Mode v2 + optional GA4 loader wiring. All opt-in. */
export interface ConsentModeOptions {
  /** Map from category id -> one or more Consent Mode v2 signal keys it controls.
   * Defaults assume `statistics` -> analytics_storage, `marketing` -> ad_* ,
   * `preferences` -> functionality_storage/personalization_storage. */
  categoryToSignals?: Record<string, string[]>;
  /** Regions to apply the default-denied wait_for_update behavior to. */
  region?: string[];
  /** Milliseconds Consent Mode should wait before GTag fires tags. */
  waitForUpdateMs?: number;
  /** GA4 measurement id, e.g. "G-XXXXXXX". Omit to skip the GA4 loader entirely. */
  measurementId?: string;
  /** Name of the custom dataLayer event pushed on every consent update. */
  eventName?: string;
  /** Anonymize IP on the GA4 config call. Defaults to true. */
  anonymizeIp?: boolean;
}

/** Display-trigger tuning (when the banner first appears for a new visitor). */
export interface TriggerOptions {
  /** Show after this many ms of inactivity if the user hasn't scrolled. Default 6000. */
  timeoutMs?: number;
  /** Show once the user has scrolled this many px. Default 400. */
  scrollThresholdPx?: number;
}

/** Full configuration accepted by `<CookieConsent config={...} />` (and
 * `resolveConfig` for anything that needs the resolved shape ahead of render,
 * like `bootstrapConsentMode`). Every field is optional; `resolveConfig` fills
 * in generic defaults. */
export interface CookieConsentConfig {
  /** Cookie name the consent record is persisted under. Default `cookie_consent`. */
  cookieName?: string;
  /** localStorage key for the anonymous consent token. Default `cc_token`. */
  tokenStorageKey?: string;
  /** Bumps when your consent schema/copy changes meaningfully; existing
   * cookies with a different version are treated as unset. Default 1. */
  consentVersion?: number;
  /** Recorded alongside every logged decision; independent of consentVersion
   * so you can track banner UI revisions separately. Default 1. */
  bannerVersion?: number;
  /** Category list shown in the banner. Defaults to
   * necessary(alwaysOn)/preferences/statistics/marketing. */
  categories?: ConsentCategory[];
  /** All banner copy. Merged shallowly over the defaults. */
  text?: Partial<CookieConsentText>;
  /** Display trigger tuning. */
  trigger?: TriggerOptions;
  /** Name of the global function the host can call to reopen the banner
   * (attached to `window`). Default `openCookieConsent`. */
  globalOpenFnName?: string;
  /** Name of the custom DOM event that reopens the banner when dispatched
   * on `window`. Default `cookie-consent:open`. */
  openEventName?: string;
  /** Storage adapter used to log finished decisions. Default: `noopAdapter()`. */
  storage?: StorageAdapter;
  /** Consent Mode v2 / GA4 wiring options. Omit entirely to skip Consent Mode. */
  consentMode?: ConsentModeOptions;
  /** Opt in to parsing + migrating a legacy Cookiebot cookie on first load. */
  migrateFromCookiebot?: boolean;
}

/** Fully-resolved config (all fields required) produced by `resolveConfig`. */
export interface ResolvedCookieConsentConfig {
  cookieName: string;
  tokenStorageKey: string;
  consentVersion: number;
  bannerVersion: number;
  categories: ConsentCategory[];
  text: CookieConsentText;
  trigger: Required<TriggerOptions>;
  globalOpenFnName: string;
  openEventName: string;
  storage: StorageAdapter;
  consentMode?: ConsentModeOptions;
  migrateFromCookiebot: boolean;
}
