# scripts/ — Script Reference

> Constitution: `../AGENTS.md`.

## Scripts

### SEO

| Command | Script | Requires | Purpose |
|---|---|---|---|
| `npm run lint:seo` | `scripts/lint-seo.ts` | — | Offline keyword coverage check. Blocks commit if Tier 1 keywords are missing. |
| `npm run audit:seo` | `scripts/audit-seo.ts` | `SERPER_API_KEY` | Full SERP audit against live Google results. Writes dated JSON to `reports/seo/`. |
| `npm run optimize:content <file>` | `scripts/optimize-content.ts` | — | Per-file gap analysis: shows which keyword zones are missing coverage and prints copy suggestions. |
| `npm run discover:keywords` | `scripts/discover-keywords.ts` | — | Discovers candidate keywords from page copy. Prints ranked list with tier suggestions. |

### Lint

| Command | Script | Purpose |
|---|---|---|
| `npm run lint:css` | stylelint | BEM hierarchy in CSS files. |
| `npm run lint:html` | eslint | BEM class patterns + no inline styles in `.astro`. |
| `npm run lint:tokens` | `scripts/lint-tokens.sh` | Raw hex values and banned token usage. |

### Build

| Command | Purpose |
|---|---|
| `npm run build` | Full Astro static build to `dist/`. |
| `npm run dev` | Dev server with hot reload. |
| `npm run preview` | Preview the production build locally. |

### Design system

| Command | Script | Purpose |
|---|---|---|
| `scripts/stylelint-plugin-bem.mjs` | — | Custom Stylelint rule enforcing BEM hierarchy. Not run directly — loaded by stylelint. |

## Environment variables

See `.env.example` for the full list. Copy to `.env` (gitignored).

| Variable | Required by | Purpose |
|---|---|---|
| `SERPER_API_KEY` | `audit:seo` | Serper.dev — live Google SERP data. 2,500 free queries/month. |
| `SITE_CUSTOM_DOMAIN` | Build | Custom domain for canonical URLs (e.g. `yourdomain.com`). Overrides the GitHub Pages base URL. |

## When to run what

| Situation | Run |
|---|---|
| Before committing any `.astro` or `.mdx` change | `npm run lint` |
| After adding/editing keywords in `keywords.ts` | `npm run lint:seo` |
| Starting work on a page's SEO | `npm run optimize:content src/pages/<page>.astro` |
| Monthly SERP health check | `npm run audit:seo` |
| After adding/modifying any component or layout | `npm run build` |
