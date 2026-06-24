# src/layouts/ — Layout Composition

> Constitution: `../../AGENTS.md`. Parent: `../AGENTS.md`.

## Available layouts

| Layout | Use when |
|---|---|
| `Layout.astro` | Raw shell — head + Nav + Footer. Use for custom page structures. |
| `PageLayout.astro` | Standard content page — wraps Layout with PageHero + CtaStrip. |
| `DesignSystemLayout.astro` | Design system sidecar pages at `/design-system/*`. |

## `Layout.astro` props

```ts
interface Props {
  title: string;          // Page title — appears in <title> and OG tags
  description?: string;   // Meta description (defaults to placeholder)
  image?: string;         // OG image URL (defaults to /og-default.png)
  noIndex?: boolean;      // Set true for admin/draft pages
}
```

Customise the `brandName`, `siteUrl`, and schema.org block inside `Layout.astro`
when forking. These are the only hardcoded values in the layout shell.

## `PageLayout.astro` props

Extends Layout with hero props:
```ts
interface Props extends LayoutProps {
  headline: string;       // Hero headline — supports site-accent spans
  eyebrow?: string;       // Small label above headline
  subheadline?: string;   // Paragraph below headline
  kicker?: string;        // Mono numbered kicker label
  accentWord?: string;    // Word to wrap in site-accent halo
  accentColor?: 'cyan' | 'purple' | 'magenta' | 'green';
  ctaPrimary?: { label: string; href: string; analyticsId?: string };
  ctaSecondary?: { label: string; href: string; analyticsId?: string };
  heroSize?: 'default' | 'hero';
  showCta?: boolean;      // Show CtaStrip at bottom (default: true)
}
```

## Head tag discipline

`Layout.astro` owns ALL `<head>` content. Never add `<link>`, `<script>`, or `<meta>`
tags inside a page or component — pass them as props to the layout or use Astro's
`<head>` slot.

Exception: page-level `<script type="application/ld+json">` for structured data may
be added in individual pages, but they must validate against schema.org.

## SEO props

- `title` is required on every page.
- `description` should be 120–160 characters, include the primary keyword.
- `noIndex: true` for any page you don't want crawled (thank-you pages, admin stubs).
