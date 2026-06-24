# src/components/ — Component Authoring Rules

> Constitution: `../../AGENTS.md`. Parent: `../AGENTS.md`.

## Who works here

Design agents building or modifying UI primitives. Content agents **use** components
via JSX props — they never edit `.astro` files in this directory.

## Naming

- File: `PascalCase.astro` — e.g. `FeatureCard.astro`
- Block class: `site-<name>` — e.g. `site-feature-card`
- Element: `site-<name>__<part>` — e.g. `site-feature-card__icon`
- Modifier: `site-<name>--<variant>` — e.g. `site-feature-card--highlight`

## Required props interface

Every component must export a typed `Props` interface. No `any`. No optional props
without defaults.

## BEM discipline

- The root element of a component carries the block class.
- Child elements carry `block__element` classes.
- Variants are `block--modifier` on the root or affected child.
- **Never reference a bare element class** (e.g. `.site-feature-card__icon`) from
  outside its block — ESLint enforces block context.
- No inline styles. No raw hex values. Use CSS custom properties or Tailwind token
  classes.

## Design token usage

Always use tokens from `src/styles/global.css`:
- Colors: `text-ink-700`, `bg-ink-950`, `border-signal-300`, etc.
- Motion: `transition-[var(--duration-base)]` — use duration tokens
- Do **not** use `ink-400` anywhere in components — fails WCAG contrast check (enforced
  by `scripts/lint-tokens.sh`)

## Accessibility

- Interactive elements need `:focus-visible` styles (use `focus-ring` token).
- All images need `alt` text passed as a prop.
- `aria-label` on icon-only buttons.

## Sidecar documentation

Every component needs a corresponding `src/content/design-system/components/<name>.mdx`
doc file. After building a new component, update the sidecar. The design pipeline
`sidecar` stage handles this — but if you're working manually, create the file.

## Current components

| File | Class | Purpose |
|---|---|---|
| `SiteMark.astro` | `site-mark` | Brand logotype mark |
| `Nav.astro` | — | Top navigation bar |
| `Footer.astro` | — | Site footer |
| `Section.astro` | `site-section` | Page section container with variants |
| `PageHero.astro` | `site-hero` | Page-top hero block |
| `CtaStrip.astro` | `site-cta-strip` | Full-width call-to-action banner |
| `FeatureCard.astro` | `site-feature-card` | Grid card for feature listings |
| `ConsentBanner.astro` | `site-consent` | Cookie/analytics consent banner |
