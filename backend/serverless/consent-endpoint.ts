/**
 * @gceico/cookie-consent — reference serverless handler for `restAdapter`.
 *
 * This is a Netlify Function-shaped reference (matches the signature Netlify
 * expects for `netlify/functions/*.ts`), deliberately dependency-light —
 * swap the body for your own framework's handler shape (Vercel, Cloudflare
 * Workers, a plain Express route, ...). It accepts the JSON body
 * `restAdapter` POSTs (see `ConsentLogPayload` in `src/types.ts`) and either
 * forwards it into a Supabase table over the REST API, or just validates and
 * returns 204 if you don't want a backend at all yet.
 *
 * This file is NOT wired into any build — copy it into your own
 * `netlify/functions/` (or equivalent) and adjust as needed.
 */

interface ConsentLogPayload {
  token: string;
  version: number;
  method: "explicit" | "gpc" | "migrated";
  gpc: boolean;
  prefs: Record<string, boolean>;
  bannerVersion: number;
  userAgent: string;
  url: string;
}

interface HandlerEvent {
  httpMethod: string;
  body: string | null;
}

interface HandlerResponse {
  statusCode: number;
  body?: string;
}

function isValidPayload(value: unknown): value is ConsentLogPayload {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.token === "string" &&
    typeof p.version === "number" &&
    typeof p.method === "string" &&
    typeof p.gpc === "boolean" &&
    typeof p.prefs === "object" &&
    p.prefs !== null &&
    typeof p.bannerVersion === "number"
  );
}

export async function handler(event: HandlerEvent): Promise<HandlerResponse> {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let payload: unknown;
  try {
    payload = event.body ? JSON.parse(event.body) : null;
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (!isValidPayload(payload)) {
    return { statusCode: 400, body: "Invalid consent payload" };
  }

  // Optional: forward into Supabase (or any other store) instead of a direct
  // browser->Supabase write, if you'd rather keep the anon key server-side.
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseServiceKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/consent_logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
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
      });
    } catch {
      // Fire and forget, same contract as the client-side adapters — a
      // logging failure should never surface as an error to the visitor.
    }
  }

  return { statusCode: 204 };
}
