# src/content/ — Content Collections

> Constitution: `../../AGENTS.md`. Parent: `../AGENTS.md`.

## Collections

Defined in `src/content.config.ts`. Current collections:

| Collection | Type | Location | Who maintains |
|---|---|---|---|
| `pages` | MDX | `src/content/pages/` | Content team |
| `blog` | MDX | `src/content/blog/` | Content team |
| `designSystem` | MDX | `src/content/design-system/` | Design team |

## `pages` collection — frontmatter schema

```yaml
---
title: "Page Title"           # required
description: "…"              # optional, 120–160 chars
noIndex: false                # optional, default false
---
```

## `blog` collection — frontmatter schema

```yaml
---
title: "Post Title"           # required
description: "…"              # optional
date: 2025-01-15              # required, ISO 8601
draft: false                  # optional, default false (drafts excluded from build)
author: "Your Name"           # optional
tags: ["tag1", "tag2"]        # optional
---
```

## `designSystem` collection — frontmatter schema

```yaml
---
title: "Component Name"       # required
category: "components"        # required: components | styles | templates | guides
description: "…"              # required for components
status: "stable"              # stable | beta | deprecated
---
```

## MDX authoring rules

- Use design system components where possible. Import with absolute path:
  ```mdx
  import FeatureCard from '../../components/FeatureCard.astro';
  ```
- Do **not** write raw HTML in MDX except for structural elements (`<div>`, `<table>`).
- Headings follow a logical hierarchy: one `#` per file (becomes the `<h1>`), then `##`.
- External links must include UTM parameters.
- Images must have alt text.

## Design system sidecar

`src/content/design-system/` is the source for the browsable design system at
`/design-system/`. Structure:

```
design-system/
  index.mdx                   # overview and quick-start
  components/                 # one .mdx per component
  styles/                     # typography, colors, spacing, animation
  templates/                  # layout / page-level templates
  guides/                     # analytics, seo, deployment
```

The design pipeline `sidecar` stage creates/updates files here when components change.
Content agents must not modify `design-system/` files.
