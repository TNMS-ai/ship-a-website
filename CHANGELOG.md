# Changelog

All notable changes to `ship-a-website` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.1.0] — 2025-06-03

### Added

- Astro 6 + Tailwind CSS v4 static site foundation
- System font stack (`ui-sans-serif`, `ui-monospace`) — zero external font files
- BEM enforcement via custom ESLint plugin (`site/bem-class-pattern`, `site/no-inline-style`) and custom Stylelint plugin
- Token lint gate (`scripts/lint-tokens.sh`) — bans raw hex and `ink-400` in component files
- Three-tier SEO system: keyword registry (`src/seo/keywords.ts`), offline lint gate (`lint:seo`), live SERP audit (`audit:seo`)
- Competitor classification registry (`src/seo/competitors.ts`)
- Pre-commit hook (`/githooks/pre-commit`) — runs `lint:seo` on staged `.astro` and `.mdx` files
- Design system sidecar at `/design-system/` — browsable MDX docs for all components, tokens, and patterns
- `DesignSystemLayout.astro` with sidebar navigation grouped by category
- Content collections: `pages`, `blog`, `design-system` (uses Astro Content Layer `glob` loader)
- Components: `Nav`, `Footer`, `SiteMark`, `PageHero`, `Section`, `FeatureCard`, `CtaStrip`, `ConsentBanner`
- Layouts: `Layout` (base), `PageLayout` (content pages), `DesignSystemLayout` (sidecar)
- `content.ship.yaml` — 8-stage TNMS Ship pipeline for content maintenance
- `design.ship.yaml` — 9-stage TNMS Ship pipeline for design and engineering work
- Hierarchical `AGENTS.md` tree (10 files) covering all source directories
- `roadmap/` and `specs/` directory stubs for Ship pipeline artifacts
- `public/_redirects` stub for redirect management
- `scripts/site.config.ts` — single source of truth for site identity
- `.env.example` documenting `SERPER_API_KEY` and `SITE_CUSTOM_DOMAIN`
- MIT License
- `CONTRIBUTING.md`
- GitHub Actions CI workflow (`lint` + `build` on push and PR)
- GitHub issue templates (bug report, feature request)
- Pull request template

[Unreleased]: https://github.com/tnms-ai/ship-a-website/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/tnms-ai/ship-a-website/releases/tag/v0.1.0
