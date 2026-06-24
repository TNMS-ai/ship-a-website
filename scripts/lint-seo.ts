/**
 * lint-seo — fast content-only SEO linter (no API calls).
 *
 * Runs as part of `npm run lint`. Exits 1 if any Tier 1 keyword has zero
 * coverage on its designated target page, so authors are blocked from
 * shipping pages that entirely miss their primary keyword.
 *
 * Usage:
 *   node --experimental-strip-types scripts/lint-seo.ts
 *   node --experimental-strip-types scripts/lint-seo.ts --verbose
 */

import fs from 'node:fs';
import path from 'node:path';
import { keywords, type KeywordConfig } from '../src/seo/keywords.ts';

const VERBOSE = process.argv.includes('--verbose');
const ROOT = new URL('..', import.meta.url).pathname;

// ── Content analysis ──────────────────────────────────────────────────────────

type ContentZone = 'title' | 'description' | 'headings' | 'body';

interface ZoneCoverage {
  keyword_in_title: boolean;
  keyword_in_description: boolean;
  keyword_in_headings: boolean;
  keyword_in_body: boolean;
  coverage_score: number;
  missing_from: ContentZone[];
}

function readSource(relPath: string): string {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return '';
  return fs.readFileSync(abs, 'utf-8');
}

function containsKeyword(text: string, keyword: string): boolean {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

/** Extract frontmatter value for a given key (title / description / metaTitle). */
function extractFrontmatter(source: string, key: string): string {
  const match = source.match(new RegExp(`^${key}\\s*[:=]\\s*['"]?([^'"\\n]+)['"]?`, 'm'));
  return match?.[1]?.trim() ?? '';
}

/** Extract heading text (## / ### / <h2> / <h3> / PageHero title prop). */
function extractHeadings(source: string): string {
  const mdHeadings = [...source.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => m[1]);
  const htmlHeadings = [...source.matchAll(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi)].map((m) => m[1]);
  const heroHeadings = [...source.matchAll(/heading\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]);
  const propHeadings = [...source.matchAll(/title\s*=\s*\{?\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
  return [...mdHeadings, ...htmlHeadings, ...heroHeadings, ...propHeadings].join(' ');
}

function analyzeZones(source: string, keyword: string): ZoneCoverage {
  const title = extractFrontmatter(source, 'title') + ' ' + extractFrontmatter(source, 'metaTitle');
  const description = extractFrontmatter(source, 'description') + ' ' + extractFrontmatter(source, 'metaDescription');
  const headings = extractHeadings(source);

  const inTitle = containsKeyword(title, keyword);
  const inDescription = containsKeyword(description, keyword);
  const inHeadings = containsKeyword(headings, keyword);
  const inBody = containsKeyword(source, keyword);

  // Weighted score: title 40%, description 20%, headings 20%, body 20%
  const score =
    (inTitle ? 0.4 : 0) +
    (inDescription ? 0.2 : 0) +
    (inHeadings ? 0.2 : 0) +
    (inBody ? 0.2 : 0);

  const missing: ContentZone[] = [];
  if (!inTitle) missing.push('title');
  if (!inDescription) missing.push('description');
  if (!inHeadings) missing.push('headings');
  if (!inBody) missing.push('body');

  return {
    keyword_in_title: inTitle,
    keyword_in_description: inDescription,
    keyword_in_headings: inHeadings,
    keyword_in_body: inBody,
    coverage_score: score,
    missing_from: missing,
  };
}

// ── Lint runner ───────────────────────────────────────────────────────────────

interface LintResult {
  keyword: string;
  tier: number;
  target_page: string;
  source_file: string;
  coverage: ZoneCoverage;
  adjacent_uncovered: string[];
}

function lint(): { errors: LintResult[]; warnings: LintResult[]; infos: LintResult[] } {
  const errors: LintResult[] = [];
  const warnings: LintResult[] = [];
  const infos: LintResult[] = [];

  for (const kw of keywords) {
    if (!kw.source_file || !kw.target_page) {
      // Tier 4 with no page — only surface in verbose mode as info
      if (VERBOSE) {
        infos.push({
          keyword: kw.keyword,
          tier: kw.tier,
          target_page: kw.target_page ?? '(none)',
          source_file: kw.source_file ?? '(none)',
          coverage: { keyword_in_title: false, keyword_in_description: false, keyword_in_headings: false, keyword_in_body: false, coverage_score: 0, missing_from: ['title', 'description', 'headings', 'body'] },
          adjacent_uncovered: kw.adjacent,
        });
      }
      continue;
    }

    const source = readSource(kw.source_file);
    if (!source) {
      console.warn(`  [warn] source file not found: ${kw.source_file}`);
      continue;
    }

    const coverage = analyzeZones(source, kw.keyword);
    const adjacent_uncovered = kw.adjacent.filter((term) => !containsKeyword(source, term));

    const result: LintResult = {
      keyword: kw.keyword,
      tier: kw.tier,
      target_page: kw.target_page,
      source_file: kw.source_file,
      coverage,
      adjacent_uncovered,
    };

    if (kw.tier === 1 && coverage.coverage_score === 0) {
      errors.push(result);
    } else if (kw.tier <= 2 && coverage.missing_from.includes('body')) {
      warnings.push(result);
    } else if (VERBOSE && coverage.missing_from.length > 0) {
      infos.push(result);
    }
  }

  return { errors, warnings, infos };
}

// ── Output ────────────────────────────────────────────────────────────────────

function formatZones(r: LintResult): string {
  const zones = ['title', 'description', 'headings', 'body']
    .map((z) => (r.coverage.missing_from.includes(z as ContentZone) ? `✗${z}` : `✓${z}`))
    .join('  ');
  return `    zones:    ${zones}`;
}

const { errors, warnings, infos } = lint();

if (VERBOSE) {
  for (const r of infos) {
    console.log(`  [info] T${r.tier} "${r.keyword}"`);
    console.log(`    page:     ${r.target_page}`);
    console.log(formatZones(r));
    if (r.adjacent_uncovered.length > 0) {
      console.log(`    adjacent: missing ${r.adjacent_uncovered.join(', ')}`);
    }
  }
}

for (const r of warnings) {
  console.warn(`  [warn] T${r.tier} "${r.keyword}" — keyword absent from body`);
  console.warn(`    page:     ${r.target_page}`);
  console.warn(formatZones(r));
  if (r.adjacent_uncovered.length > 0) {
    console.warn(`    adjacent: missing ${r.adjacent_uncovered.join(', ')}`);
  }
}

for (const r of errors) {
  console.error(`  [error] T${r.tier} "${r.keyword}" — zero coverage on target page`);
  console.error(`    page:     ${r.target_page}`);
  console.error(formatZones(r));
  if (r.adjacent_uncovered.length > 0) {
    console.error(`    adjacent: missing ${r.adjacent_uncovered.join(', ')}`);
  }
}

const t1Count = keywords.filter((k) => k.tier === 1 && k.source_file).length;
const t1Covered = t1Count - errors.length;
console.log(`\nlint:seo  T1 keywords: ${t1Covered}/${t1Count} covered  |  ${warnings.length} warning(s)  |  ${errors.length} error(s)`);

if (errors.length > 0) {
  process.exit(1);
}
