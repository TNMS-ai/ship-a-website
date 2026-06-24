/**
 * optimize-content — show keyword coverage gaps for a specific page and
 * suggest concrete edits to close them.
 *
 * Usage:
 *   node --experimental-strip-types scripts/optimize-content.ts <source-file>
 *
 * Example:
 *   node --experimental-strip-types scripts/optimize-content.ts src/pages/index.astro
 *
 * What it does:
 *   1. Finds all keywords in keywords.ts whose source_file matches the given path.
 *   2. Analyses coverage for each (title, description, headings, body).
 *   3. Prints a ranked list of gaps with specific, copy-paste suggestions.
 *
 * No network calls — this is purely content analysis and runs offline.
 */

import fs from 'node:fs';
import path from 'node:path';
import { keywords } from '../src/seo/keywords.ts';

const ROOT = new URL('..', import.meta.url).pathname;

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node --experimental-strip-types scripts/optimize-content.ts <source-file>');
  process.exit(1);
}

// Normalise: accept either workspace-relative or absolute
const absPath = path.isAbsolute(inputPath) ? inputPath : path.join(ROOT, inputPath);
const relPath = path.relative(ROOT, absPath);

if (!fs.existsSync(absPath)) {
  console.error(`File not found: ${absPath}`);
  process.exit(1);
}

const source = fs.readFileSync(absPath, 'utf-8');

// ── Extraction helpers ────────────────────────────────────────────────────────

function getFrontmatter(key: string): string {
  const m = source.match(new RegExp(`^${key}\\s*[:=]\\s*['"]?([^'"\\n]+)['"]?`, 'm'));
  return m?.[1]?.trim() ?? '';
}

function getHeadingsText(): string {
  const md = [...source.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => m[1]);
  const html = [...source.matchAll(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi)].map((m) => m[1]);
  const prop = [...source.matchAll(/(?:heading|title)\s*=\s*["'`]([^"'`\n]+)["'`]/g)].map((m) => m[1]);
  return [...md, ...html, ...prop].join(' ');
}

function contains(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

// ── Match keywords to this file ───────────────────────────────────────────────

const mappedKeywords = keywords.filter((kw) => {
  if (!kw.source_file) return false;
  const kwAbs = path.join(ROOT, kw.source_file);
  return kwAbs === absPath || kw.source_file === relPath;
});

if (mappedKeywords.length === 0) {
  console.log(`No keywords in src/seo/keywords.ts are mapped to: ${relPath}`);
  console.log(`\nAdd entries with source_file: '${relPath}' to track this page.`);
  process.exit(0);
}

// ── Analyse coverage ──────────────────────────────────────────────────────────

const title = getFrontmatter('title') + ' ' + getFrontmatter('metaTitle');
const description = getFrontmatter('description') + ' ' + getFrontmatter('metaDescription');
const headings = getHeadingsText();

interface Gap {
  keyword: string;
  tier: number;
  score: number;
  zones: string[];
  adjacentMissing: string[];
}

const gaps: Gap[] = [];
const covered: string[] = [];

for (const kw of mappedKeywords) {
  const inTitle = contains(title, kw.keyword);
  const inDesc = contains(description, kw.keyword);
  const inHeadings = contains(headings, kw.keyword);
  const inBody = contains(source, kw.keyword);

  const score = (inTitle ? 0.4 : 0) + (inDesc ? 0.2 : 0) + (inHeadings ? 0.2 : 0) + (inBody ? 0.2 : 0);

  const zones: string[] = [];
  if (!inTitle) zones.push('title (weight 0.4)');
  if (!inDesc) zones.push('description (weight 0.2)');
  if (!inHeadings) zones.push('headings (weight 0.2)');
  if (!inBody) zones.push('body (weight 0.2)');

  const adjacentMissing = kw.adjacent.filter((t) => !contains(source, t));

  if (zones.length === 0) {
    covered.push(kw.keyword);
  } else {
    gaps.push({ keyword: kw.keyword, tier: kw.tier, score, zones, adjacentMissing });
  }
}

// Sort gaps: tier asc, then score asc (worst first within tier)
gaps.sort((a, b) => a.tier !== b.tier ? a.tier - b.tier : a.score - b.score);

// ── Output ────────────────────────────────────────────────────────────────────

console.log(`optimize:content  ${relPath}`);
console.log(`  keywords mapped: ${mappedKeywords.length}   covered: ${covered.length}   gaps: ${gaps.length}\n`);

if (covered.length > 0) {
  console.log(`Fully covered:`);
  for (const kw of covered) console.log(`  ✓ ${kw}`);
  console.log('');
}

if (gaps.length === 0) {
  console.log('All mapped keywords are fully covered. Nothing to optimize.');
  process.exit(0);
}

console.log(`Gaps to address (worst first by tier):\n`);

for (const gap of gaps) {
  const scoreBar = Math.round(gap.score * 10);
  const bar = '█'.repeat(scoreBar) + '░'.repeat(10 - scoreBar);
  console.log(`[T${gap.tier}] "${gap.keyword}"  coverage: ${bar} ${(gap.score * 100).toFixed(0)}%`);
  console.log(`  Missing from: ${gap.zones.join(', ')}`);

  // Concrete suggestions per zone
  if (gap.zones.some((z) => z.startsWith('title'))) {
    const current = getFrontmatter('title') || getFrontmatter('metaTitle');
    if (current) {
      console.log(`  → title: change "${current}" to include "${gap.keyword}"`);
      console.log(`         e.g. "${gap.keyword} | ${current}" or "${current} — ${gap.keyword}"`);
    } else {
      console.log(`  → title: add frontmatter  title: "${gap.keyword}"`);
    }
  }

  if (gap.zones.some((z) => z.startsWith('description'))) {
    const current = getFrontmatter('description') || getFrontmatter('metaDescription');
    if (current) {
      console.log(`  → description: weave "${gap.keyword}" into the current meta description`);
    } else {
      console.log(`  → description: add frontmatter  description: "... ${gap.keyword} ..."`);
    }
  }

  if (gap.zones.some((z) => z.startsWith('headings'))) {
    console.log(`  → headings: add an H2 or H3 that includes "${gap.keyword}"`);
  }

  if (gap.zones.some((z) => z.startsWith('body'))) {
    console.log(`  → body: mention "${gap.keyword}" at least once in the page body`);
  }

  if (gap.adjacentMissing.length > 0) {
    console.log(`  Adjacent terms not covered: ${gap.adjacentMissing.map((t) => `"${t}"`).join(', ')}`);
    console.log(`  → Add these naturally in the body to strengthen topical authority.`);
  }

  console.log('');
}

const totalPossible = mappedKeywords.length;
const allScores = [...gaps.map((g) => g.score), ...covered.map(() => 1)];
const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
console.log(`Page SEO score: ${(avgScore * 100).toFixed(0)}% across ${totalPossible} mapped keyword(s).`);

if (gaps.some((g) => g.tier === 1 && g.score === 0)) {
  console.log('\n⚠ Tier 1 keyword(s) have zero coverage — this will fail lint:seo.');
}
