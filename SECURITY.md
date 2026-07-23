# Security Policy

## Supported versions

Only the latest published version of `@gceico/cookie-consent` receives
security fixes. Please upgrade before reporting.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report privately through GitHub's
[private vulnerability reporting](https://github.com/gceico/cookie-consent/security/advisories/new)
(Security → Advisories → _Report a vulnerability_). If that is unavailable,
email the maintainer at ceicoschi.gabriel@gmail.com.

Please include:

- A description of the issue and its impact
- Steps to reproduce (a proof of concept if you have one)
- The affected version(s)

You can expect an acknowledgement within a few days. Once a fix ships, we're
happy to credit you in the release notes unless you'd prefer to stay anonymous.

## Scope & design notes

This is a client-side React component plus copy-paste backend reference
adapters. Things worth knowing when assessing impact:

- **The banner runs entirely in the browser.** It reads/writes a single
  first-party cookie and (optionally) a localStorage token — no third-party
  script is loaded unless you opt into Consent Mode's GA4 wiring.
- **Storage adapters are fire-and-forget and never block consent.** A failed
  log call never prevents the visitor's decision from applying.
- **The Supabase adapter uses only the anon/publishable key**, never a
  service-role key, and expects you to enforce RLS (insert-only) on your own
  table — see `backend/supabase/migration.sql`.
- **Publishing to npm uses OIDC trusted publishing** with SHA-pinned GitHub
  Actions and provenance — there is no long-lived npm token to steal.
