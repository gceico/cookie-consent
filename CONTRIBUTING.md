# Contributing

Thanks for your interest in improving `@gceico/cookie-consent`! This is a small
project, so the process is light.

## Getting started

Development uses [Bun](https://bun.sh) (≥ 1.3 — the exact version is pinned in
`package.json` as `packageManager`) as the package manager and build runner.
The sources are TypeScript, bundled with [tsup](https://tsup.egoist.dev) to
ESM + CJS + `.d.ts`.

```bash
git clone https://github.com/gceico/cookie-consent
cd cookie-consent
bun install
```

## Development workflow

- **Branch** off `main` (e.g. `feat/…`, `fix/…`).
- **Build** — bundle the TypeScript sources to `dist/` (ESM, CJS, types) and
  copy the stylesheet:
  ```bash
  bun run build
  ```
- **Type-check and lint** before opening a PR:
  ```bash
  bun run typecheck
  bun run lint
  ```
- **Format** (Prettier is configured):
  ```bash
  bun run format        # rewrite files
  bun run format:check  # verify only
  ```

CI runs the type-check, linter, and build. Please make sure they're all green.

## Project layout

| Path                       | What it is                                                           |
| -------------------------- | -------------------------------------------------------------------- |
| `src/index.ts`             | Public entry point — re-exports the component, types, config helpers |
| `src/CookieConsent.tsx`    | The banner component                                                 |
| `src/config.ts`            | Default categories/text and config resolution                        |
| `src/consent-mode.ts`      | Google Consent Mode v2 helpers                                       |
| `src/cookiebot-migrate.ts` | Legacy Cookiebot cookie migration                                    |
| `src/storage/`             | Pluggable storage adapters (Supabase, REST, no-op)                   |
| `src/ui/`                  | Small internal UI primitives (no design-system dependency)           |
| `src/styles.css`           | CSS-var themed stylesheet, copied to `dist/` on build                |
| `backend/`                 | Copy-paste backend assets (Supabase migration, serverless handler)   |

## Guidelines

- Keep the package free of any design-system or brand dependency — all copy
  and colors are config/CSS-var driven (see `src/config.ts` and
  `src/styles.css`). Don't hardcode brand-specific text or colors.
- Storage adapters must stay fire-and-forget: a failed log call should never
  block or throw into the visitor's consent flow.
- Add or update the README when you change public config shape or behavior.
- Don't commit secrets, tokens, or personal data. Report security issues
  privately (see [SECURITY.md](SECURITY.md)).

By contributing, you agree that your contributions are licensed under the
project's [MIT License](LICENSE).
