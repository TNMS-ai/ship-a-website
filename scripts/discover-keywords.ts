/**
 * discover-keywords — extract candidate keywords from site content.
 *
 * Reads all .astro and .mdx page/content files, extracts 2–4-word n-grams,
 * scores them by frequency × positional weight (title/headings > body),
 * then filters out phrases already in keywords.ts.
 *
 * The output is a ranked candidate list for human review — copy interesting
 * entries into src/seo/keywords.ts after triaging tier and personas.
 *
 * Usage:
 *   node --experimental-strip-types scripts/discover-keywords.ts
 *   node --experimental-strip-types scripts/discover-keywords.ts --top=50
 *   node --experimental-strip-types scripts/discover-keywords.ts --validate
 *
 * Flags:
 *   --top=N      Print top N candidates (default: 30)
 *   --validate   Hit Serper.dev for the top candidates to check SERP volume
 *
 * Environment (only needed with --validate):
 *   SERPER_API_KEY
 */

import fs from 'node:fs';
import path from 'node:path';
import { keywords, SITE_URL } from '../src/seo/keywords.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const TOP_N = (() => {
  const flag = process.argv.find((a) => a.startsWith('--top='));
  return flag ? parseInt(flag.slice(6), 10) : 30;
})();
const VALIDATE = process.argv.includes('--validate');
const SERPER_API_KEY = process.env.SERPER_API_KEY ?? '';

// ── Stopwords ─────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','up','about','into','through','during','before','after',
  'above','below','between','out','off','over','under','again','then',
  'once','here','there','when','where','why','how','all','both','each',
  'few','more','most','other','some','such','no','nor','not','only',
  'own','same','so','than','too','very','just','should','now','is','are',
  'was','were','be','been','being','have','has','had','do','does','did',
  'will','would','could','can','may','might','shall','this','that','these',
  'those','it','its','we','our','you','your','they','their','he','she','his',
  'her','i','my','me','us','them','as','if','what','which','who','whom','am',
  'get','got','let','new','use','also','via','per','any','every','need',
  'help','want','make','see','work','take','give','know','go','come','using',
  'based','include','provides','including','ensure','across','within','without',
]);

// ── Content extraction ────────────────────────────────────────────────────────

interface WeightedText {
  text: string;
  weight: number;
}

function extractWeightedText(source: string): WeightedText[] {
  const result: WeightedText[] = [];

  // Frontmatter title/description — highest weight
  const fmTitle = source.match(/^title\s*[:=]\s*['"]?([^'">\n]+)['"]?/m)?.[1] ?? '';
  const fmDesc = source.match(/^description\s*[:=]\s*['"]?([^'">\n]+)['"]?/m)?.[1] ?? '';
  if (fmTitle) result.push({ text: fmTitle, weight: 4 });
  if (fmDesc) result.push({ text: fmDesc, weight: 2 });

  // heading= and title= props in JSX/Astro
  for (const m of source.matchAll(/(?:heading|title)\s*=\s*["'`]([^"'`\n]+)["'`]/g)) {
    result.push({ text: m[1], weight: 3 });
  }

  // HTML headings
  for (const m of source.matchAll(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi)) {
    result.push({ text: m[1], weight: 3 });
  }

  // Markdown headings
  for (const m of source.matchAll(/^#{1,3}\s+(.+)$/gm)) {
    result.push({ text: m[1], weight: 3 });
  }

  // Strip tags from remainder for body text
  const body = source
    .replace(/---[\s\S]*?---/, '') // remove frontmatter
    .replace(/<[^>]+>/g, ' ')      // strip HTML tags
    .replace(/\{[^}]+\}/g, ' ')   // strip template expressions
    .replace(/import\s+.+/g, ' ') // strip import statements
    .replace(/[^\w\s'-]/g, ' ');   // strip punctuation

  result.push({ text: body, weight: 1 });
  return result;
}

// ── N-gram extraction ─────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

function ngrams(tokens: string[], n: number): string[] {
  const result: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    const gram = tokens.slice(i, i + n);
    // Skip if first or last token is a stopword (already filtered, but guard for n>2)
    result.push(gram.join(' '));
  }
  return result;
}

// ── File discovery ────────────────────────────────────────────────────────────

function findContentFiles(): string[] {
  const files: string[] = [];
  const dirs = ['src/pages', 'src/content', 'content'];
  for (const dir of dirs) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    const entries = fs.readdirSync(abs, { recursive: true }) as string[];
    for (const entry of entries) {
      if (/\.(astro|mdx|md)$/.test(entry)) {
        files.push(path.join(abs, entry));
      }
    }
  }
  return files;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

const existingKeywords = new Set(keywords.map((k) => k.keyword.toLowerCase()));

function scoreFile(filePath: string): Map<string, number> {
  const source = fs.readFileSync(filePath, 'utf-8');
  const weighted = extractWeightedText(source);
  const scores = new Map<string, number>();

  for (const { text, weight } of weighted) {
    const tokens = tokenize(text);
    for (const n of [2, 3, 4]) {
      for (const gram of ngrams(tokens, n)) {
        scores.set(gram, (scores.get(gram) ?? 0) + weight);
      }
    }
  }
  return scores;
}

// ── Serper validation ─────────────────────────────────────────────────────────

async function validateWithSerper(candidates: string[]): Promise<Map<string, number | null>> {
  const results = new Map<string, number | null>();
  if (!SERPER_API_KEY) {
    console.warn('[validate] SERPER_API_KEY not set — skipping SERP validation');
    return results;
  }

  const OUR_DOMAIN = new URL(SITE_URL).hostname;
  for (const kw of candidates) {
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: kw, num: 10 }),
      });
      const data = await res.json() as { organic?: Array<{ link: string; position: number }> };
      const ourResult = (data.organic ?? []).find((r) => {
        try { return new URL(r.link).hostname.replace(/^www\./, '') === OUR_DOMAIN; }
        catch { return false; }
      });
      results.set(kw, ourResult?.position ?? null);
    } catch {
      results.set(kw, null);
    }
    await new Promise((r) => setTimeout(r, 200)); // rate limit
  }
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const files = findContentFiles();
if (files.length === 0) {
  console.error('No .astro/.mdx/.md files found in src/pages, src/content, or content/');
  process.exit(1);
}

console.log(`discover:keywords  files=${files.length}  existing=${existingKeywords.size}\n`);

const globalScores = new Map<string, number>();
for (const file of files) {
  const fileScores = scoreFile(file);
  for (const [gram, score] of fileScores) {
    globalScores.set(gram, (globalScores.get(gram) ?? 0) + score);
  }
}

// Filter: skip existing keywords, short/generic phrases, pure stopword combos
const candidates = [...globalScores.entries()]
  .filter(([gram]) => !existingKeywords.has(gram))
  .filter(([gram]) => {
    const words = gram.split(' ');
    // At least one meaningful word (not all filtered by stopwords)
    return words.some((w) => w.length > 3 && !STOPWORDS.has(w));
  })
  .sort((a, b) => b[1] - a[1])
  .slice(0, TOP_N * 3); // over-fetch before Serper filtering

let serperResults = new Map<string, number | null>();
const topCandidates = candidates.slice(0, TOP_N).map(([gram]) => gram);

if (VALIDATE && topCandidates.length > 0) {
  console.log(`[validate] Checking ${topCandidates.length} candidates against Serper...\n`);
  serperResults = await validateWithSerper(topCandidates);
}

console.log(`${'Rank'.padEnd(5)} ${'Score'.padEnd(8)} ${'Pos'.padEnd(5)} Candidate`);
console.log('-'.repeat(60));

let rank = 0;
for (const [gram, score] of candidates.slice(0, TOP_N)) {
  rank++;
  const pos = serperResults.has(gram) ? (serperResults.get(gram) ?? '-') : '';
  const posStr = String(pos).padEnd(5);
  console.log(`${String(rank).padEnd(5)} ${score.toFixed(1).padEnd(8)} ${posStr} ${gram}`);
}

console.log(`\nTip: copy interesting candidates into src/seo/keywords.ts with tier, personas, and target_page.`);
