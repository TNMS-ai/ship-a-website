# Contributing to ship-a-website

Thank you for your interest in improving the template. This guide is for contributors who want to **change the template itself** — not for people who have forked it to build their own site.

If you forked this to build your site, you don't need this file. Everything you need is in [README.md](README.md).

---

## Who this is for

| You want to… | Go here |
|---|---|
| Build your own site on this template | [README.md](README.md) |
| Fix a bug in the template | This file |
| Add a feature to the template | This file |
| Understand how agents work in this repo | [AGENTS.md](AGENTS.md) and child `AGENTS.md` files |

---

## Development setup

**Requirements:** Node 22.12.0 or later, npm 10+.

```bash
# Clone the repo
git clone https://github.com/tnms-ai/ship-a-website
cd ship-a-website

# Install dependencies — also installs the pre-commit hook
npm install

# Start the dev server
npm run dev

# Run the full lint suite before committing
npm run lint

# Confirm the build is clean
npm run build
```

### Environment variables

Copy `.env.example` to `.env`. Only `SERPER_API_KEY` is required, and only for running the live SEO audit.

```bash
cp .env.example .env
```

---

## Code style

- **TypeScript** strict mode. No `any`. No `eslint-disable`.
- **CSS** BEM methodology. Selectors must be fully qualified (`.block__element` must appear inside `.block`). No `!important`. No inline styles.
- **Astro** components use PascalCase (`FeatureCard.astro`). No client-side JS unless strictly necessary.
- **Comments** only when the *why* is non-obvious. No what-comments.

The ESLint config (`eslint.config.mjs`) and Stylelint config (`stylelint.config.mjs`) are the source of truth. Both run in CI.

---

## Commit conventions

Format: `<scope>: <what changed>`

```
feat: add CtaStrip component
fix: correct ink-400 token reference in PageHero
docs: update SEO system description in README
chore: bump @astrojs/sitemap to 3.8
```

Scopes: `feat`, `fix`, `docs`, `test`, `chore`, `style`, `refactor`.

Commits on `main` are squash-merged from PRs. Write your branch commits however helps you; the PR title becomes the squash commit message.

---

## Branch naming

```
feat/<short-description>    # new capability
fix/<short-description>     # bug fix
docs/<short-description>    # documentation only
chore/<short-description>   # deps, config, tooling
```

Never push directly to `main`.

---

## Pull request process

1. Branch from `main`.
2. Make your change.
3. Run `npm run lint && npm run build` — both must pass locally before opening the PR.
4. Open the PR. The CI workflow runs the same checks.
5. One approval is required from a maintainer.
6. PRs are squash-merged. The PR title becomes the commit message.

The PR template (`.github/PULL_REQUEST_TEMPLATE.md`) has the checklist.

---

## Adding a component

1. Create `src/components/MyComponent.astro`.
2. Define a `Props` interface — all props typed, no `any`.
3. Use BEM class names. Declare the block in `src/styles/global.css` if it needs custom tokens.
4. Add a sidecar doc at `src/content/design-system/components/my-component.mdx` with the required frontmatter:
   ```yaml
   ---
   title: MyComponent
   description: One-line description.
   category: components
   status: stable
   order: 50
   ---
   ```
5. Document props, usage example, and BEM structure in the MDX body.
6. Run `npm run build` and verify the component appears in the design system at `/design-system/components/my-component/`.

---

## Adding a design token

All tokens live in `src/styles/global.css` under `:root`. Follow the existing naming conventions:

```css
:root {
  /* Color: --color-{scale}-{step} */
  --color-ink-500: #2e3a59;

  /* Typography: --font-{role} */
  --font-sans: ui-sans-serif, system-ui, -apple-system, sans-serif;

  /* Spacing / layout tokens follow the same pattern */
}
```

Do **not** use `ink-400` in component classes — it fails the token lint (`npm run lint:tokens`). That value is reserved for disabled/muted states defined in `global.css` only. See `scripts/lint-tokens.sh` for the full ban list.

---

## Updating the pipeline configs

`content.ship.yaml` and `design.ship.yaml` are read by [TNMS Ship](https://tnms.ai). If you change a stage, update the corresponding `AGENTS.md` at the affected path so agents get the correct context.

The schema is documented at `spec-orchestrator/contracts/config-v1.0.schema.json` in the Ship repo.

---

## Reporting issues

Use the GitHub issue templates:

- **Bug report** — something in the template is broken
- **Feature request** — something you wish the template did

Before opening an issue, search existing issues to avoid duplicates.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
