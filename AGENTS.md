# ship-a-website — Agent Constitution

> **This file is for AI pipeline agents.** Human readers should start with:
> - [README.md](README.md) — forking and adopting the template
> - [CONTRIBUTING.md](CONTRIBUTING.md) — contributing changes to the template

> Children: `src/`, `scripts/`, `public/`, `roadmap/`, `specs/`.
> Each has its own AGENTS.md with local context.
> This file is the constitution. Child files extend it; they do not repeat it.

## Document hierarchy — three audiences, three files

| File | Audience | Purpose |
|---|---|---|
| `README.md` | **Adopters** | Fork it, configure it, use it to build your site |
| `CONTRIBUTING.md` | **Maintainers** | Change the template itself — code style, PR process, component authoring |
| `AGENTS.md` (this file) | **Agents** | AI pipeline constitution — invariants, guardrails, pipeline map |

Agents do not read README.md or CONTRIBUTING.md. Humans do not need to read AGENTS.md.

---

## What this repo is

`ship-a-website` is a production-ready static site starter built with
Astro 6 + Tailwind CSS v4. It is the example project for **TNMS Ship** —
a governed agentic pipeline that lets a single person maintain a professional
website without a content team, SEO team, analytics team, or engineering team.

The repo ships with two Ship pipeline configs:
- **`content.ship.yaml`** — content workflows: pages, SEO, analytics, redirects
- **`design.ship.yaml`** — design system, components, templates, sidecar docs

Fork it, configure Ship, link your Jira backlogs, and start assigning work.

---

## AGENTS.md hierarchy

| File | Who reads it | Scope |
|---|---|---|
| `AGENTS.md` (this file) | All agents | Constitution: principles, pipeline map |
| `src/AGENTS.md` | Any agent touching source | Source directory taxonomy |
| `src/components/AGENTS.md` | Design/component agents | Component authoring rules |
| `src/layouts/AGENTS.md` | Design agents | Layout composition, SEO props |
| `src/pages/AGENTS.md` | Content agents | Page creation, routing |
| `src/content/AGENTS.md` | Content agents | Collections, MDX authoring |
| `src/seo/AGENTS.md` | SEO agents | Keyword registry, competitor list |
| `src/styles/AGENTS.md` | Design agents | Token editing, font guidance |
| `scripts/AGENTS.md` | All agents | Script purposes, env vars |
| `public/AGENTS.md` | Design agents | Static assets, font instructions |

---

## Pipeline configs

### `content.ship.yaml`
For Jira items in the **Content** backlog. Covers:
- Adding, editing, and removing page content
- SEO keyword coverage and meta optimization
- Analytics data layer and UTM link enforcement
- Redirect management for moved pages
- Build verification

Run: `npx shep run <item-id> --config content.ship.yaml`

### `design.ship.yaml`
For Jira items in the **Design / Engineering** backlog. Covers:
- New and modified components, templates, and layouts
- Design token changes
- Design system sidecar documentation maintenance
- Unit test authoring and execution
- Regression verification against existing content

Run: `npx shep run <item-id> --config design.ship.yaml`

---

## Before every commit

```bash
npm run lint        # BEM + SEO + token checks
npm run build       # ensure no build errors
```

The pre-commit hook runs `lint:seo` automatically on staged `.astro` and `.mdx` files.

---

## SEO system

Three layers:
1. **`src/seo/keywords.ts`** — keyword registry. Every tracked keyword maps to a source file.
2. **`npm run lint:seo`** — offline check. Fails if any Tier 1 keyword has zero coverage.
3. **`npm run audit:seo`** — live SERP audit (requires `SERPER_API_KEY` in `.env`).

When editing a page:
1. `node --experimental-strip-types scripts/optimize-content.ts <source-file>`
2. Add the keyword to the zones flagged as missing.
3. `npm run lint:seo` to confirm pass.

---

## Design system

All design tokens are in `src/styles/global.css`.

**The design system is browsable at `/design-system/`** — a sidecar section
built from `src/content/design-system/`. The design pipeline maintains it.

Key CSS primitives (use these class names — do not invent new ones):
- `site-headline site-headline--display` — large display heading
- `site-headline site-headline--hero` — largest hero heading
- `site-eyebrow` / `site-eyebrow--paper` — small uppercase label with gradient line
- `site-kicker` / `site-kicker--paper` — mono numbered section label
- `site-accent--{cyan|purple|magenta|green}` — halo span around a word in a heading
- `site-glow` + `site-glow__shape--{cyan-bl|purple-tr|...}` — background atmosphere blobs
- `site-rule` / `site-rule--cyan` — gradient hairline

BEM rules are enforced by ESLint + Stylelint. Element classes MUST appear inside
their block context. No inline styles. No `eslint-disable` comments.

---

## Code style

- TypeScript strict mode, no `any`
- No client-side JavaScript unless absolutely required (use `<script>` sparingly)
- Comments only when WHY is non-obvious
- Run `npm run lint` before every commit

---

## Git workflow

- Feature branches: `claude/<short-description>` or `feat/<short-description>`
- Commit messages: `<scope>: <what changed>` — e.g. `home: add hero copy update`
- Never push directly to `main` — open a PR
