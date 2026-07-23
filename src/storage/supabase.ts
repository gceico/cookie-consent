import type { StorageAdapter } from "../types";

export interface SupabaseAdapterOptions {
  /** Supabase project URL, e.g. `https://xyz.supabase.co`. */
  url: string;
  /** Supabase anon/publishable key. Never the service-role key. */
  anonKey: string;
  /** Table to insert into. Must match `backend/supabase/migration.sql`'s
   * table name. Default `consent_logs`. */
  table?: string;
}

/** Reproduces the fire-and-forget PostgREST insert from
 * `website/src/components/CookieBanner.tsx`'s `logConsentToSupabase`,
 * generalized to any Supabase project + table. Never throws to the caller —
 * a failed log shouldn't block the visitor's consent decision from applying. */
export function supabaseAdapter(options: SupabaseAdapterOptions): StorageAdapter {
  const { url, anonKey, table = "consent_logs" } = options;
  return {
    log(payload) {
      if (!url || !anonKey) return;
      fetch(`${url}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          token: payload.token,
          version: payload.version,
          method: payload.method,
          gpc: payload.gpc,
          prefs: payload.prefs,
          banner_version: payload.bannerVersion,
          user_agent: payload.userAgent,
          url: payload.url,
        }),
      }).catch(() => {
        /* fire and forget */
      });
    },
  };
}
