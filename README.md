# @gceico/cookie-consent

A self-hosted **cookie consent banner for React** — a **Cookiebot alternative** you own instead
of rent. No design-system dependency, no analytics vendor lock-in, and a pluggable backend so
consent decisions can be logged anywhere (or nowhere).

![React cookie consent banner with categorized cookie preferences, matching the visitor's light or dark theme](img/cookie-consent-demo.png)

- **Categorized consent**: necessary/preferences/statistics/marketing, fully configurable
- **Google Consent Mode v2** built in, GA4 wiring opt-in
- **GDPR/CCPA-style audit trail** via a pluggable `StorageAdapter` (Supabase, REST, or none)
- **No vendor lock-in**: no subscription, no third-party script, no external dashboard
- **Cookiebot migration**: one config flag parses and replaces a legacy Cookiebot cookie
- **Themeable with plain CSS variables**: no Tailwind or design-system dependency required

## Quick start

```bash
npm i @gceico/cookie-consent
# or
bun add @gceico/cookie-consent
```

```tsx
import { CookieConsent } from "@gceico/cookie-consent";
import "@gceico/cookie-consent/styles.css";

export function App() {
  return (
    <>
      {/* ...your app... */}
      <CookieConsent
        config={{
          text: { policyHref: "/cookie-policy/", privacyHref: "/privacy/" },
        }}
      />
    </>
  );
}
```

That's it — with no `config` at all you get a working, generically-worded banner with four
categories, a `cookie_consent` cookie, and no backend logging. Everything below is opt-in.

## Config

Everything on `CookieConsentConfig` is optional; the full type lives in `src/config.ts`. The
fields you'll actually reach for:

| Field                  | Default                | Purpose                                                   |
| ----------------------- | ----------------------- | ----------------------------------------------------------- |
| `categories`            | 4 defaults              | `{ id, label, description, alwaysOn }[]`                     |
| `text`                  | generic copy            | All banner strings; `{policyLink}`/`{privacyLink}` render as anchors |
| `storage`               | `noopAdapter()`         | Where decisions get logged — see [Backend adapters](#backend-adapters) |
| `consentMode`           | off                     | Google Consent Mode v2 + optional GA4 — see below            |
| `migrateFromCookiebot`  | `false`                 | Parse + migrate a legacy Cookiebot cookie on first load      |
| `globalOpenFnName` / `openEventName` | `openCookieConsent` / `cookie-consent:open` | Reopen the banner via `window[fn]()` or a dispatched event |

Reopening also works out of the box via `a[href="#consent"]` or any `[data-open-consent]`
element — clicks on those are delegated automatically.

## Backend adapters

The component never talks to a database directly — it builds a `ConsentLogPayload` and hands it
to whatever `StorageAdapter` you configure. Adapters are fire-and-forget: a failed log never
blocks the visitor's decision from applying.

```ts
// Supabase — run backend/supabase/migration.sql against your project first
import { supabaseAdapter } from "@gceico/cookie-consent";
const storage = supabaseAdapter({ url, anonKey, table: "consent_logs" });

// Generic REST — pair with backend/serverless/consent-endpoint.ts as a starting point
import { restAdapter } from "@gceico/cookie-consent";
const storage = restAdapter({ endpoint: "/api/consent-log" });

// No backend — the default. Banner still cookies decisions and applies Consent Mode.
```

## Consent Mode v2 (opt-in)

```html
<script type="module">
  import { bootstrapConsentMode } from "@gceico/cookie-consent";
  bootstrapConsentMode({ measurementId: "G-XXXXXXX", region: ["EEA", "EU", "GB"] });
</script>
```

```tsx
<CookieConsent config={{ consentMode: { measurementId: "G-XXXXXXX" } }} />
```

Omit `measurementId` to skip GA4 entirely — Consent Mode still applies. The `dataLayer`/`gtag`
fallback keeps working for any tag manager already reading `dataLayer`.

**Already load GA4 yourself?** Leave `consentMode` unset. The banner still forwards every decision
to Consent Mode — it pushes `gtag('consent', 'update', …)` plus a `dataLayer` event on each choice —
it just won't load `gtag.js` for you. This is the common "existing GA, just gate it" setup: no
`bootstrapConsentMode`, no `measurementId`, no `consentMode` config needed.

## Cookiebot migration (opt-in)

```tsx
<CookieConsent config={{ migrateFromCookiebot: true }} />
```

Parses Cookiebot's legacy cookie into your category shape, applies it as a `"migrated"`
decision (no visible banner for that visitor), and deletes Cookiebot's cookies.

## Full integration example

Supabase adapter, custom cookie/token keys, custom reopen API, and Cookiebot migration combined —
swap `acme` for your own project:

```tsx
import { CookieConsent, supabaseAdapter, type StorageAdapter } from "@gceico/cookie-consent";
import "@gceico/cookie-consent/styles.css";

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const storage: StorageAdapter | undefined =
  SUPABASE_URL && SUPABASE_KEY
    ? supabaseAdapter({ url: SUPABASE_URL, anonKey: SUPABASE_KEY, table: "consent_logs" })
    : undefined;

const CookieBanner = () => (
  <CookieConsent
    config={{
      cookieName: "acme_consent",
      tokenStorageKey: "acme_ctok",
      globalOpenFnName: "acmeOpenConsent",
      openEventName: "acme:open-consent",
      migrateFromCookiebot: true,
      storage,
      text: {
        title: "Help shape a better Acme.com",
        policyHref: "/cookies/",
        privacyHref: "/privacy/",
      },
    }}
  />
);

export default CookieBanner;
```

## Stored cookie shape

The consent cookie holds a URL-encoded JSON `ConsentRecord`:

```jsonc
{
  "version": 1, // matches config.consentVersion
  "stamp": "2026-07-24T10:00:00.000Z", // ISO timestamp of the decision
  "method": "explicit", // "explicit" | "gpc" | "migrated"
  "gpc": false, // was Global Privacy Control active
  "prefs": { "necessary": true, "statistics": false } // per-category booleans
}
```

A stored cookie is read back as valid only when its `version` equals the current
`consentVersion` (and `prefs` is present); otherwise the visitor is re-prompted. So to reuse an
existing cookie, point `cookieName` at it **and** set `consentVersion` to the version stored in
those records — a mismatch silently re-prompts.

## SSR / meta-frameworks

Client-only component (touches `document`/`window`). Render it in a client boundary — an Astro
island (`client:load`), a Next.js `"use client"` component, etc. It's inert during SSR and
mounts on the client.

## Theming via CSS vars

Import `@gceico/cookie-consent/styles.css` once. Every color is `hsl(var(--ccb-*))` — override
any variable on `:root` to re-theme:

```css
:root {
  --ccb-primary: 220 90% 50%;
  --ccb-card: 0 0% 100%;
  --ccb-border: 220 15% 85%;
}
```

Dark mode works via both `@media (prefers-color-scheme: dark)` and a `.dark` class selector, so
it follows the OS theme or your own manual toggle.

## vs. Cookiebot, Osano, and other hosted CMPs

Hosted consent-management platforms mean a third-party script, a subscription, and your
visitors' consent decisions living in someone else's database. `@gceico/cookie-consent` gives you
the same UX — categorized consent, Consent Mode v2, an audit trail — as code you own: no
recurring fee, no external script, and a backend you control (or skip).

## License

MIT — extracted from a production banner built for a small SaaS site, generalized to carry no
brand-specific copy or styling.

## Who's behind this

I'm Gabriel. I build things like this for fun and ship the ones that turn out
good. Check out [One's Skills](https://github.com/gceico/ones-skills), my
Claude Skills collection, [Claude Make It Rain](https://github.com/gceico/claude-make-it-rain), a
desktop app that rains money on your screen for Claude Code milestones, or come say hi at
[Aibl.to](https://aibl.to/), where I run AI workshops and help people turn their expertise into
compounded value.

— Gabriel C.
