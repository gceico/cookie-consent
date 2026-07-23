export { CookieConsent } from "./CookieConsent";
export type { CookieConsentProps } from "./CookieConsent";

export type {
  ConsentPrefs,
  ConsentMethod,
  ConsentRecord,
  ConsentLogPayload,
  ConsentCategory,
  StorageAdapter,
  CookieConsentText,
  ConsentModeOptions,
  TriggerOptions,
  CookieConsentConfig,
  ResolvedCookieConsentConfig,
} from "./types";

export {
  DEFAULT_CATEGORIES,
  DEFAULT_TEXT,
  resolveConfig,
  deniedPrefs,
  grantedPrefs,
  defaultPrefs,
} from "./config";

export { applyConsent, bootstrapConsentMode } from "./consent-mode";

export { parseCookiebot, deleteCookiebotCookies } from "./cookiebot-migrate";

export { noopAdapter, supabaseAdapter, restAdapter, resolveAdapter } from "./storage";
export type { SupabaseAdapterOptions } from "./storage/supabase";
export type { RestAdapterOptions } from "./storage/rest";
