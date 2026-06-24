<div align="center">

# ship-a-website

**A production-ready marketing site you can maintain — solo — with AI.**

[![CI](https://github.com/tnms-ai/ship-a-website/actions/workflows/ci.yml/badge.svg)](https://github.com/tnms-ai/ship-a-website/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node >=22.12](https://img.shields.io/badge/node-%3E%3D22.12-brightgreen)](https://nodejs.org/)
[![Astro 6](https://img.shields.io/badge/Astro-6-BC52EE?logo=astro)](https://astro.build)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

[**Live demo**](https://tnms-ai.github.io/ship-a-website/) · [**TNMS Ship**](https://tnms.ai) · [**Design system**](https://tnms-ai.github.io/ship-a-website/design-system/)

</div>

---

`ship-a-website` is an opinionated static site starter built for one use case: maintaining a professional marketing site without a content team, SEO team, or engineering team. Fork it, drop in your brand, link a Jira backlog, and assign work to [TNMS Ship](https://tnms.ai). AI handles the rest.

```
Fork → configure → assign work item → Ship delivers a PR → you review → merge
```

Everything that matters is enforced at build time — BEM selectors, design tokens, SEO coverage — so the pipeline can run at full autonomy without breaking production. The guardrails are the product.

---

## What's included

| | Feature | What it does |
|---|---|---|
| ⚡ | **Astro 6** | Static output. Zero client JS by default. |
| 🎨 | **Tailwind CSS v4** | CSS-first config. All tokens live in `src/styles/global.css`. |
| 📐 | **BEM enforcement** | Custom ESLint + Stylelint rules. No inline styles. No loose selectors. CI fails. |
| 🔍 | **SEO lint gate** | Keyword registry → offline Tier 1 coverage check → optional SERP audit. Blocks commits. |
| 📖 | **Design system sidecar** | Browsable at `/design-system/`. MDX docs auto-maintained by the design pipeline. |
| 🔤 | **System font stack** | `ui-sans-serif`, `system-ui`. Zero external font files. Instant TTFB. |
| 🪝 | **Git hooks** | Pre-commit SEO lint on staged `.astro` and `.mdx` files. |
| 🚢 | **Ship-ready pipelines** | `content.ship.yaml` + `design.ship.yaml`. Assign Jira items. Ship runs them. |

---

## Quick start

Node 22.12 or later is required.

```bash
# 1. Use this template or fork it on GitHub, then:
git clone https://github.com/your-org/my-site && cd my-site

# 2. Install — also wires the pre-commit hook
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

> **Tip:** Copy `.env.example` to `.env` before running scripts that need API keys.

---

## Make it yours

These are the eight files you change to go from template to your brand.

| File | What to change |
|---|---|
| `scripts/site.config.ts` | Site name, URL, author, social links |
| `src/styles/global.css` | Color tokens, type scale, spacing |
| `src/components/SiteMark.astro` | Your wordmark or logo |
| `src/components/Nav.astro` | Navigation links |
| `src/components/Footer.astro` | Footer links and copyright |
| `src/pages/index.astro` | Homepage content |
| `src/pages/about.astro` | About page |
| `public/favicon.svg` | Favicon |

Then populate `src/seo/keywords.ts` with your target keywords (see [SEO system](#seo-system) below).

---

## Scripts

```bash
npm run dev                # local dev server at :4321
npm run build              # production build → dist/
npm run preview            # preview the dist/ build locally

npm run lint               # full lint: CSS + HTML + tokens + SEO
npm run lint:css           # Stylelint BEM check
npm run lint:html          # ESLint Astro check
npm run lint:tokens        # ban raw hex + ink-400 in components
npm run lint:seo           # Tier 1 keyword coverage (offline, no API key)

npm run audit:seo          # live SERP audit (requires SERPER_API_KEY in .env)
npm run discover:keywords  # suggest new keywords from SERP data
npm run optimize:content   # show keyword gaps for a specific page
```

---

## SEO system

Three layers. Only the first two require setup.

### 1. Keyword registry

`src/seo/keywords.ts` maps every tracked keyword to the page that should rank for it, with adjacent terms and tier classification.

```ts
// src/seo/keywords.ts
export const keywords: Keyword[] = [
  {
    term: 'governed AI delivery',
    tier: 1,
    source_file: 'src/pages/index.astro',
    adjacent: ['AI delivery pipeline', 'agentic software delivery'],
  },
];
```

### 2. Offline lint gate

```bash
npm run lint:seo
```

Fails with exit 1 if any Tier 1 keyword has zero coverage on its mapped page. Runs automatically as a pre-commit hook on staged content files.

To see gaps for a specific file with copy-paste suggestions:

```bash
node --experimental-strip-types scripts/optimize-content.ts src/pages/index.astro
```

### 3. Live SERP audit (optional)

```bash
SERPER_API_KEY=<your-key> npm run audit:seo
```

Fetches live Google results via [Serper.dev](https://serper.dev) (2,500 free queries/month). Writes a dated JSON report to `reports/seo/`.

---

## Design system

Every component, token, and pattern is documented in a browsable sidecar at [`/design-system/`](https://tnms-ai.github.io/ship-a-website/design-system/). The docs live in `src/content/design-system/` as MDX files, and the design pipeline keeps them in sync — adding a component without updating the sidecar fails the `sidecar` stage in `design.ship.yaml`. The sidecar is not indexed by search engines (`noIndex: true`).

All design tokens live in `src/styles/global.css`. Use the existing CSS primitives — the BEM linter rejects invented class names:

```astro
<!-- Display headline with halo accent -->
<h1 class="site-headline site-headline--hero">
  Build something <span class="site-accent--cyan">great.</span>
</h1>

<!-- Eyebrow label -->
<p class="site-eyebrow">Section label</p>

<!-- Kicker with number -->
<span class="site-kicker">
  <span class="site-kicker__num">01</span>
  <span class="site-kicker__sep">//</span>
  <span>Section title</span>
</span>

<!-- Section component -->
<Section
  variant="inverse"
  kicker={{ num: '01', label: 'Why us' }}
  heading="The headline goes here."
  accentWord="headline"
  accentColor="cyan"
  lede="Supporting paragraph text."
>
  <!-- slot content -->
</Section>
```

---

## Using with TNMS Ship

`ship-a-website` ships with two pre-configured pipeline configs:

| Config | Backlog | What it runs |
|---|---|---|
| `content.ship.yaml` | Content | audit → specify → edit → SEO lint → analytics verify → redirects → build → merge |
| `design.ship.yaml` | Design / Engineering | specify → plan → tasks → implement → sidecar update → test → build verify → regression → merge |

**To use them:**

1. Get [TNMS Ship](https://tnms.ai) access
2. Fork this repo and connect it to Ship
3. Link your Jira project
4. Assign a work item to Ship:
   ```bash
   npx shep run SITE-42 --config content.ship.yaml
   ```
5. Ship opens a PR. You review and merge.

Every PR is gated on `npm run lint` and `npm run build`. Nothing reaches `main` that breaks the site.

---

## Deployment

The included [CI workflow](.github/workflows/ci.yml) runs `npm run lint` and `npm run build` on every push and pull request.

- **GitHub Pages** — `astro.config.mjs` is pre-configured with `base: '/ship-a-website/'`. Rename it for your repo, or set a custom domain.
- **Custom domain** — set `SITE_CUSTOM_DOMAIN` in your environment and `Layout.astro` overrides the canonical URL automatically.
- **AWS** — CloudFront + Route 53 templates live in `infra/`.

---

## Project structure

```
ship-a-website/
├── src/
│   ├── components/        # Reusable Astro components (BEM enforced)
│   ├── content/
│   │   ├── blog/          # Blog posts (MDX)
│   │   ├── design-system/ # Sidecar docs (MDX, maintained by pipeline)
│   │   └── pages/         # Content-collection pages (MDX)
│   ├── layouts/           # Page layouts (Layout, PageLayout, DesignSystemLayout)
│   ├── pages/             # Astro routes
│   ├── seo/               # Keyword registry + competitor list
│   └── styles/            # global.css — all design tokens here
├── scripts/               # TypeScript build scripts
├── public/                # Static assets
├── infra/                 # CloudFront + Route 53 templates for AWS
├── roadmap/               # Pipeline roadmap items (content/ design/)
├── specs/                 # Pipeline spec outputs (content/ design/)
├── content.ship.yaml      # TNMS Ship: content pipeline config
├── design.ship.yaml       # TNMS Ship: design pipeline config
└── .githooks/pre-commit   # SEO lint on staged files
```

> Working in this repo with an AI agent? Each directory carries its own `AGENTS.md` with local context. Start at the root [`AGENTS.md`](AGENTS.md).

---

## Requirements

- Node.js >= 22.12.0
- npm >= 10

---

## Contributing

This repo is the canonical example project for TNMS Ship. Contributions that improve the starter template are welcome.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, commit conventions, and the PR process.

---

## License

[MIT](LICENSE) — free to fork, adapt, and ship.

---

<div align="center">

Built with [TNMS Ship](https://tnms.ai) · [tnms.ai](https://tnms.ai)

</div>
