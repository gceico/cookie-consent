import type { StorageAdapter } from "../types";

export interface RestAdapterOptions {
  /** Any endpoint that accepts a JSON POST — your own serverless function,
   * a webhook, etc. See `backend/serverless/consent-endpoint.ts` for a
   * reference handler. */
  endpoint: string;
  /** Extra headers to send with the POST (auth tokens, API keys, ...). */
  headers?: Record<string, string>;
}

/** POSTs the consent log payload as JSON to any URL. Fire-and-forget, same
 * as `supabaseAdapter` — a failed log never blocks consent from applying. */
export function restAdapter(options: RestAdapterOptions): StorageAdapter {
  const { endpoint, headers = {} } = options;
  return {
    log(payload) {
      if (!endpoint) return;
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(payload),
      }).catch(() => {
        /* fire and forget */
      });
    },
  };
}
