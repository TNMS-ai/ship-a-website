# src/styles/ — Design Tokens

> Constitution: `../../AGENTS.md`. Parent: `../AGENTS.md`.

## The single source of truth

`global.css` is the **only** place raw values live. Every component and page
consumes tokens — never hardcode colors, sizes, or font names anywhere else.

## Token categories in `global.css`

| Section | Tokens | Examples |
|---|---|---|
| Colors — ink | `--color-ink-50` … `--color-ink-950` | Graphite neutral scale |
| Colors — signal | `--color-signal-50` … `--color-signal-900` | Ochre accent scale |
| Colors — neon | `--color-cyan/purple/magenta/green` | Glow halos only |
| Typography | `--font-sans`, `--font-mono` | System font stacks |
| Type scale | `--text-xs` … `--text-7xl` | With line-height + letter-spacing |
| Radius | `--radius-none` … `--radius-lg` | — |
| Containers | `--container-prose/content/wide` | Layout constraints |
| Motion | `--ease-standard`, `--duration-fast` etc. | Transitions |

## Adding a token

Add to the `@theme {}` block. Follow existing naming conventions:
- `--color-<palette>-<step>` for colors
- `--text-<size>` for type scale
- Tailwind v4 reads `@theme {}` automatically — no config file needed.

## Neon palette rules

`--color-cyan`, `--color-purple`, `--color-magenta`, `--color-green` are **glow colors
only**. They appear as `box-shadow` halos behind the `.site-accent--*` spans in
headings. Never use them as text fill, background, or border.

## Custom fonts

This starter ships with system fonts only (zero font file overhead). To add custom
self-hosted fonts:

1. Obtain `.woff2` files (variable fonts preferred for weight range coverage).
2. Place files in `public/fonts/` — they'll be served at `/fonts/` in production.
3. Create `src/styles/fonts.css` with `@font-face` declarations. Use
   `font-display: optional` to prevent layout shift:
   ```css
   @font-face {
     font-family: "Your Font";
     font-style: normal;
     font-weight: 100 900;
     font-display: optional;
     src: url("/fonts/your-font-variable.woff2") format("woff2");
   }
   ```
4. Add `@import "./fonts.css";` at the top of `global.css` (below `@import "tailwindcss"`).
5. Update `--font-sans` and/or `--font-mono` in the `@theme {}` block to reference your
   font family first in the stack.
6. Add a `<link rel="preload">` hint in `src/layouts/Layout.astro`:
   ```html
   <link rel="preload" as="font" type="font/woff2"
         href="/fonts/your-font-variable.woff2" crossorigin="anonymous" />
   ```

## Editing tokens

- Change a token value in `global.css` → the entire site updates.
- Never add `!important`.
- Semantic surface variables (light/dark mode) live in `:root {}` and `.dark {}` blocks.
