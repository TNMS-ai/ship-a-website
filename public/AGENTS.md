# public/ — Static Assets

> Constitution: `../AGENTS.md`.

Files placed here are served verbatim at the site root. They are not processed
by Astro or Tailwind.

## Current assets

| Path | Purpose |
|---|---|
| `favicon.svg` | Browser tab icon |
| `robots.txt` | Crawler directives |
| `CNAME` | GitHub Pages custom domain (if applicable) |
| `_redirects` | Redirect rules (create if needed — see below) |
| `og-default.png` | Default Open Graph share image (add yours here) |

## Redirects

If any page URL changes, add an entry to `public/_redirects`:
```
/old-path    /new-path    301
```

This file is read by Netlify, Cloudflare Pages, and most CDNs. For CloudFront,
use the `infra/cloudfront.yml` redirect rules instead.

## Adding custom fonts

To add self-hosted web fonts:

1. Obtain `.woff2` files (variable fonts preferred — one file covers all weights).
   Sources: Google Fonts (download), Fontshare (free), Fontspring (paid).
2. Place font files in `public/fonts/`. Example:
   ```
   public/fonts/my-font-variable.woff2
   public/fonts/my-mono-font.woff2
   ```
3. Follow the full setup instructions in `src/styles/AGENTS.md` to:
   - Create `src/styles/fonts.css` with `@font-face` declarations
   - Import it from `src/styles/global.css`
   - Update `--font-sans` / `--font-mono` tokens
   - Add `<link rel="preload">` in `Layout.astro`

## Brand assets

Place brand assets (logo SVG, OG images) in `public/brand/`. Reference them in
components via absolute paths: `src="/brand/logo.svg"`.

## Do not put here

- TypeScript or JavaScript source files — those belong in `src/`
- CSS files — those belong in `src/styles/`
- Component images that could be co-located with a component — keep them in `src/`
