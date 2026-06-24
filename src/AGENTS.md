# src/ — Agent Map

> Constitution: `../AGENTS.md`. This file adds source-directory context.

## Directory taxonomy

```
src/
  components/   Reusable UI primitives (BEM blocks). Design team owns.
  content/      Content collections: pages, blog, design-system. Content team owns.
  layouts/      Page shell templates. Design team owns.
  pages/        Astro route files. Content team uses; design team creates new layouts.
  seo/          Keyword registry and competitor list. SEO/content team owns.
  styles/       Design tokens (global.css). Design team owns.
```

## Who touches what

| Team | Their files | Never touch |
|---|---|---|
| **Content** | `pages/`, `content/` | `styles/`, `layouts/`, `components/` (use only) |
| **Design** | `components/`, `layouts/`, `styles/` | `content/` (except `design-system/`) |
| **SEO** | `seo/`, frontmatter in `pages/` | Component internals |

## Critical invariants

1. **Components are design-team artifacts.** Content agents use them, never modify them.
2. **Design tokens flow one direction**: `global.css` → components → pages. Never set raw
   hex or px values in components or pages — always use a CSS custom property or Tailwind
   token class.
3. **The design system sidecar** lives at `src/content/design-system/` and renders at
   `/design-system/`. It is maintained by the design pipeline. Content agents must not
   delete or overwrite files there.
4. **Routing is filesystem-based.** Every `.astro` file in `pages/` becomes a URL.
   Renames require a redirect entry — see `src/pages/AGENTS.md`.
