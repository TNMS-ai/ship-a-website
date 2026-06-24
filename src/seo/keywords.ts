/**
 * keywords.ts — SEO keyword registry.
 *
 * Add your target keywords here. Each entry defines:
 *   - tier:         1=primary commercial, 2=tool comparison, 3=persona pain, 4=adjacent
 *   - keyword:      the exact phrase to track and inject into content
 *   - source_file:  the page that should rank for this keyword (relative to src/)
 *   - adjacent:     related terms that signal topical authority
 *   - personas:     who searches for this
 *   - industries:   relevant verticals
 *
 * Run `node --experimental-strip-types scripts/optimize-content.ts <source-file>`
 * to see coverage gaps for any registered keyword.
 *
 * Until keywords are populated, `npm run lint:seo` passes trivially.
 */

export interface Keyword {
  tier: 1 | 2 | 3 | 4;
  keyword: string;
  source_file: string;
  adjacent?: string[];
  personas?: string[];
  industries?: string[];
}

export const keywords: Keyword[] = [
  // Example — uncomment and edit to activate:
  // {
  //   tier: 1,
  //   keyword: 'your primary keyword',
  //   source_file: 'src/pages/index.astro',
  //   adjacent: ['related term', 'related term 2'],
  //   personas: ['your target persona'],
  //   industries: ['your industry'],
  // },
];
