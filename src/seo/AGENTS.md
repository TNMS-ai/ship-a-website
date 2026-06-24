# src/seo/ — SEO Layer

> Constitution: `../../AGENTS.md`. Parent: `../AGENTS.md`.

## Files

| File | Purpose |
|---|---|
| `keywords.ts` | Keyword registry — every tracked keyword maps to a source file |
| `competitors.ts` | Competitor domain classification |
| `types.ts` | TypeScript types for audit reports |

## Keyword tiers

| Tier | Intent | SEO weight |
|---|---|---|
| T1 | Primary commercial — must rank | Enforced by lint:seo, blocks commit |
| T2 | Tool comparison — active evaluation | Monitored |
| T3 | Persona pain — problem-aware | Monitored |
| T4 | Adjacent / brand-building | Optional |

## Adding a keyword

In `keywords.ts`, add an entry to the `keywords` array:
```ts
{
  keyword: "your target keyword",
  tier: 1,
  personas: ["Persona A"],
  industries: ["Industry"],
  target_page: "Home",
  source_file: "src/pages/index.astro",
  adjacent: ["related term", "another term"],
}
```

Then run:
1. `node --experimental-strip-types scripts/optimize-content.ts src/pages/index.astro`
2. Add the keyword to the zones flagged as missing.
3. `npm run lint:seo` — must pass before commit.

## Competitor classification

In `competitors.ts`, every tracked domain gets a class:

| Class | Meaning |
|---|---|
| `direct` | Same ICP, same problem space — out-rank them |
| `adjacent` | Overlapping intent — mine for vocabulary |
| `authority` | IBM, Gartner, etc. — benchmark, don't target |
| `community` | YouTube, Reddit — distribution insight only |
| `noise` | Wrong vertical — exclude from analysis |

## Running audits

```bash
# Offline — no API key required. Fails if T1 keywords have zero coverage.
npm run lint:seo

# Per-page gap analysis
node --experimental-strip-types scripts/optimize-content.ts <source-file>

# Full SERP audit — requires SERPER_API_KEY in .env
npm run audit:seo
```
