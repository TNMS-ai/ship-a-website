# src/pages/ — Page Creation & Routing

> Constitution: `../../AGENTS.md`. Parent: `../AGENTS.md`.

## Routing

Every `.astro` file in `src/pages/` becomes a route:
- `index.astro` → `/`
- `about.astro` → `/about/`
- `blog/index.astro` → `/blog/`

**Never rename a page without adding a redirect.** See "Redirects" below.

## Creating a new page

1. Create `src/pages/<slug>.astro`.
2. Use `PageLayout.astro` for standard content pages.
3. Add the page link to `Nav.astro` if it belongs in the main navigation.
4. Run `npm run lint:seo` — add keywords to `src/seo/keywords.ts` if needed.

### Minimal page template

```astro
---
import PageLayout from '../layouts/PageLayout.astro';
---
<PageLayout
  title="Page Title"
  description="120–160 char description with primary keyword."
  headline="Page headline"
  eyebrow="SECTION LABEL"
>
  <!-- page content using Section, FeatureCard, etc. -->
</PageLayout>
```

## Analytics requirements

Every CTA button or meaningful link **must** have:
```html
<a href="..." data-analytics-id="descriptive-event-name">...</a>
```

External links (off-site) **must** include UTM parameters:
```
?utm_source=website&utm_medium=referral&utm_campaign=<page-slug>
```

## Redirects

When a page moves or is deleted, add an entry to `public/_redirects`:
```
/old-path    /new-path    301
```

If the page is deleted permanently with no replacement, redirect to the most
relevant existing page — never leave a dead link.

## Content collections vs. pages

- Use `src/pages/*.astro` for pages with unique layouts or no CMS-managed body copy.
- Use `src/content/pages/*.mdx` + a dynamic route for CMS-style content pages.
- Blog posts always live in `src/content/blog/*.mdx`.

## Design system pages

`src/pages/design-system/` is owned by the design pipeline. Content agents must not
create or modify files in this directory.
