# CLAUDE.md

## Overview

`@gceico/cookie-consent` is a config-driven, white-label React cookie-consent banner: a
Cookiebot alternative you own instead of rent. It has no design-system dependency (CSS-var
themed, `src/styles.css`), no analytics vendor lock-in (Google Consent Mode v2 helpers are
opt-in), and a pluggable backend — `supabaseAdapter`, `restAdapter`, or the default
`noopAdapter` — so consent decisions can be logged anywhere or nowhere. Every visible string
and color is config/CSS-var driven; there is no hardcoded brand copy or palette anywhere in
`src/`. `backend/` holds copy-paste reference assets (a Supabase migration + a serverless
handler), not code the package itself imports.

## Stack

TypeScript, React (peer dependency, `>=18.0.0`, works with 18 and 19), bundled with
[tsup](https://tsup.egoist.dev) to ESM + CJS + `.d.ts`. Bun is the package manager and build
runner. `oxlint` for linting, `prettier` for formatting (double quotes, semicolons, width 100,
trailing commas — matches the original extracted source, not the tighter defaults of other
projects in this maintainer's repos).

## Commands

```bash
bun install
bun run build       # tsup -> dist/{index.js,index.cjs,index.d.ts} + cp src/styles.css dist/
bun run typecheck    # tsc --noEmit (type-checking only; tsup does the emit)
bun run lint         # oxlint
bun run format       # prettier --write .
bun run format:check # prettier --check .
```

## Repo layout

| Path                                     | What it is                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/index.ts`                           | Public entry point — re-exports the component, types, config helpers                  |
| `src/CookieConsent.tsx`                  | The banner component                                                                  |
| `src/config.ts`                          | `DEFAULT_CATEGORIES`, `DEFAULT_TEXT`, `resolveConfig` — the generic defaults          |
| `src/consent-mode.ts`                    | Google Consent Mode v2 (`bootstrapConsentMode`, `applyConsent`)                       |
| `src/cookiebot-migrate.ts`               | Parses + deletes a legacy Cookiebot cookie                                            |
| `src/storage/`                           | `noopAdapter`, `supabaseAdapter` (plain `fetch`, no SDK dependency), `restAdapter`    |
| `src/ui/`                                | Minimal internal primitives (`Tabs`, `Switch`, `Button`) — no shadcn/Radix dependency |
| `src/styles.css`                         | `hsl(var(--ccb-*))` themed stylesheet, copied (not bundled) to `dist/` on build       |
| `backend/supabase/migration.sql`         | Reference table + RLS policy for `supabaseAdapter`                                    |
| `backend/serverless/consent-endpoint.ts` | Reference Netlify-Function-shaped handler for `restAdapter`                           |

## Design principle

Nothing in `src/` should assume a specific brand, design system, or backend. Config and CSS
variables are the only customization surface — new features should extend `CookieConsentConfig`
or add CSS vars, not hardcode copy or colors. `backend/` assets are references users copy into
their own project, not code the package imports at runtime.

## Release flow

1. Bump `version` in `package.json` (semver).
2. `git push --follow-tags` after `npm version patch|minor|major` (or push a `vX.Y.Z` tag
   directly).
3. `.github/workflows/publish.yml` builds and publishes to npm via **OIDC Trusted
   Publishing** — no npm token is stored in this repo.

**One-time setup before the first tag**: configure a Trusted Publisher for
`@gceico/cookie-consent` on npmjs.com (Package → Settings → Trusted Publisher → GitHub Actions,
pointing at this repo + `publish.yml`). Publishing will fail with an auth error until this is
done.
