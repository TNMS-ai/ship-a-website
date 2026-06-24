/**
 * audit-seo — full SEO audit: SERP ranking + content analysis.
 *
 * Outputs one JSON report per calendar day to reports/seo/YYYY-MM-DD.json.
 * Re-running on the same day is a no-op unless --force is passed.
 *
 * Usage:
 *   node --experimental-strip-types scripts/audit-seo.ts
 *   node --experimental-strip-types scripts/audit-seo.ts --force
 *
 * Environment:
 *   SERPER_API_KEY        — Serper.dev API key (2,500 free queries, then $50/2500)
 *   GOOGLE_SC_CREDENTIALS — Path to service account JSON for Search Console API
 */

import fs from 'node:fs';
import path from 'node:path';
import { keywords, SITE_URL, type KeywordConfig } from '../src/seo/keywords.ts';
import {
  SCHEMA_VERSION,
  type SeoAuditReport,
  type DataSources,
  type ReportSummary,
  type KeywordResult,
  type SerpData,
  type SerpResult,
  type OurRanking,
  type ScData,
  type ContentAnalysis,
  type PageCoverage,
  type AdjacentKeyword,
  type ContentGap,
  type CompetitorFrequency,
  type CompetitorIndex,
  type CompetitorDomain,
  type CompetitorDomainClassification,
  type ActionItems,
  type ActionItem,
  type ContentZone,
} from '../src/seo/types.ts';
import { classifyDomain, isNoise, REGISTRY } from '../src/seo/competitors.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const REPORTS_DIR = path.join(ROOT, 'reports', 'seo');
const FORCE = process.argv.includes('--force');

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayYMD(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Env / credentials ─────────────────────────────────────────────────────────

const SERPER_API_KEY = process.env.SERPER_API_KEY ?? '';
const SC_CREDENTIALS_PATH = process.env.GOOGLE_SC_CREDENTIALS ?? '';

const dataSources: DataSources = {
  custom_search_api: !!SERPER_API_KEY,
  search_console_api: !!SC_CREDENTIALS_PATH && fs.existsSync(SC_CREDENTIALS_PATH),
  content_analysis: true,
};

// ── Content analysis (shared with lint-seo) ───────────────────────────────────

function readSource(relPath: string): string {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return '';
  return fs.readFileSync(abs, 'utf-8');
}

function containsKeyword(text: string, keyword: string): boolean {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function extractFrontmatter(source: string, key: string): string {
  const match = source.match(new RegExp(`^${key}\\s*[:=]\\s*['"]?([^'"\\n]+)['"]?`, 'm'));
  return match?.[1]?.trim() ?? '';
}

function extractHeadings(source: string): string {
  const mdHeadings = [...source.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => m[1]);
  const htmlHeadings = [...source.matchAll(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi)].map((m) => m[1]);
  const heroHeadings = [...source.matchAll(/heading\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]);
  const propHeadings = [...source.matchAll(/title\s*=\s*\{?\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
  return [...mdHeadings, ...htmlHeadings, ...heroHeadings, ...propHeadings].join(' ');
}

function analyzeContent(kw: KeywordConfig): ContentAnalysis {
  if (!kw.source_file) return { covering_pages: [], adjacent_keywords: kw.adjacent.map((t) => ({ term: t, covered: false })) };

  const source = readSource(kw.source_file);
  if (!source) return { covering_pages: [], adjacent_keywords: kw.adjacent.map((t) => ({ term: t, covered: false })) };

  const pagePath = kw.target_page ?? '/';
  const title = extractFrontmatter(source, 'title') + ' ' + extractFrontmatter(source, 'metaTitle');
  const description = extractFrontmatter(source, 'description') + ' ' + extractFrontmatter(source, 'metaDescription');
  const headings = extractHeadings(source);

  const inTitle = containsKeyword(title, kw.keyword);
  const inDescription = containsKeyword(description, kw.keyword);
  const inHeadings = containsKeyword(headings, kw.keyword);
  const inBody = containsKeyword(source, kw.keyword);

  const coverage_score = (inTitle ? 0.4 : 0) + (inDescription ? 0.2 : 0) + (inHeadings ? 0.2 : 0) + (inBody ? 0.2 : 0);

  const page: PageCoverage = {
    path: pagePath,
    source_file: kw.source_file,
    coverage_score,
    keyword_in_title: inTitle,
    keyword_in_description: inDescription,
    keyword_in_headings: inHeadings,
    keyword_in_body: inBody,
  };

  const adjacent_keywords: AdjacentKeyword[] = kw.adjacent.map((term) => ({
    term,
    covered: containsKeyword(source, term),
  }));

  return { covering_pages: [page], adjacent_keywords };
}

// ── Serper.dev API ────────────────────────────────────────────────────────────

const OUR_DOMAIN = new URL(SITE_URL).hostname; // 'tnms.ai'

interface SerperOrganic {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

async function fetchSerp(keyword: string): Promise<SerpData | null> {
  if (!dataSources.custom_search_api) return null;

  let data: { organic?: SerperOrganic[]; error?: string };
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: keyword, num: 10 }),
    });
    data = await res.json() as typeof data;
  } catch (err) {
    console.error(`  [serp] fetch error for "${keyword}": ${(err as Error).message}`);
    return null;
  }

  if (data.error) {
    console.error(`  [serp] API error for "${keyword}": ${data.error}`);
    return null;
  }

  const results: SerpResult[] = (data.organic ?? []).map((item) => {
    let domain: string;
    try { domain = new URL(item.link).hostname.replace(/^www\./, ''); }
    catch { domain = item.link; }
    return {
      position: item.position,
      url: item.link,
      domain,
      title: item.title,
      snippet: item.snippet,
      is_ours: domain === OUR_DOMAIN,
    };
  });

  const ourResult = results.find((r) => r.is_ours);
  const ranking: OurRanking = {
    position: ourResult?.position ?? null,
    url: ourResult?.url ?? null,
  };

  return {
    queried_at: new Date().toISOString(),
    our_ranking: ranking,
    top_results: results,
  };
}

// ── Search Console API ────────────────────────────────────────────────────────

async function fetchSearchConsole(_keyword: string, _targetPage: string | null): Promise<ScData | null> {
  if (!dataSources.search_console_api) return null;
  // Search Console API integration requires a service account and the
  // googleapis npm package. Guard is in place; stub returns null until
  // credentials and the dependency are wired up.
  console.warn(`  [sc] Search Console API not yet implemented. Set GOOGLE_SC_CREDENTIALS.`);
  return null;
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Report assembly ───────────────────────────────────────────────────────────

function buildSummary(kwResults: KeywordResult[]): ReportSummary {
  const by_tier: Record<'1' | '2' | '3' | '4', number> = { '1': 0, '2': 0, '3': 0, '4': 0 };
  for (const r of kwResults) by_tier[String(r.tier) as '1' | '2' | '3' | '4']++;

  const ranked = kwResults.filter((r) => r.serp?.our_ranking.position != null);
  const unranked = kwResults.filter((r) => r.serp != null && r.serp.our_ranking.position == null);
  const no_data = kwResults.filter((r) => r.serp == null);

  const positions = ranked.map((r) => r.serp!.our_ranking.position as number);
  const avg_position = positions.length > 0 ? positions.reduce((a, b) => a + b, 0) / positions.length : null;

  const content_gaps: ContentGap[] = kwResults
    .filter((r) => {
      const page = r.content.covering_pages[0];
      return !page || page.coverage_score === 0;
    })
    .map((r) => {
      const page = r.content.covering_pages[0];
      const missing_from: ContentZone[] = [];
      if (!page || !page.keyword_in_title) missing_from.push('title');
      if (!page || !page.keyword_in_description) missing_from.push('description');
      if (!page || !page.keyword_in_headings) missing_from.push('headings');
      if (!page || !page.keyword_in_body) missing_from.push('body');
      return { keyword: r.keyword, tier: r.tier, target_page: r.target_page, missing_from };
    });

  // Count competitor domain appearances across all SERPs
  const domainCount = new Map<string, number>();
  for (const r of kwResults) {
    if (!r.serp) continue;
    const seen = new Set<string>();
    for (const result of r.serp.top_results) {
      if (result.is_ours || seen.has(result.domain)) continue;
      seen.add(result.domain);
      domainCount.set(result.domain, (domainCount.get(result.domain) ?? 0) + 1);
    }
  }
  const top_competitor_domains: CompetitorFrequency[] = [...domainCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([domain, appearances]) => ({ domain, appearances }));

  // Adjacent keywords that appear in config but aren't covered on any page
  const allAdjacent = new Map<string, boolean>();
  for (const r of kwResults) {
    for (const adj of r.content.adjacent_keywords) {
      if (!allAdjacent.has(adj.term)) allAdjacent.set(adj.term, adj.covered);
      if (adj.covered) allAdjacent.set(adj.term, true);
    }
  }
  const adjacent_keywords_uncovered = [...allAdjacent.entries()]
    .filter(([, covered]) => !covered)
    .map(([term]) => term)
    .sort();

  return {
    total_keywords: kwResults.length,
    by_tier,
    ranked_top_10: ranked.length,
    unranked: unranked.length,
    no_data: no_data.length,
    avg_position,
    content_gaps,
    top_competitor_domains,
    adjacent_keywords_uncovered,
  };
}

function buildCompetitorIndex(kwResults: KeywordResult[]): CompetitorIndex {
  const domainMap = new Map<string, CompetitorDomain>();

  for (const r of kwResults) {
    if (!r.serp) continue;
    for (const result of r.serp.top_results) {
      if (result.is_ours) continue;
      if (!domainMap.has(result.domain)) {
        domainMap.set(result.domain, { domain: result.domain, total_appearances: 0, keywords: [] });
      }
      const entry = domainMap.get(result.domain)!;
      entry.total_appearances++;
      entry.keywords.push({ keyword: r.keyword, position: result.position });
    }
  }

  const domains = [...domainMap.values()]
    .sort((a, b) => b.total_appearances - a.total_appearances)
    .slice(0, 20);

  return { domains };
}

// ── Competitor domain map ─────────────────────────────────────────────────────

function buildCompetitorDomains(kwResults: KeywordResult[]): Record<string, CompetitorDomainClassification> {
  const map = new Map<string, CompetitorDomainClassification>();
  for (const r of kwResults) {
    if (!r.serp) continue;
    for (const result of r.serp.top_results) {
      if (result.is_ours) continue;
      if (!map.has(result.domain)) {
        map.set(result.domain, { class: classifyDomain(result.domain), appearances: 0 });
      }
      map.get(result.domain)!.appearances++;
    }
  }
  return Object.fromEntries([...map.entries()].sort((a, b) => b[1].appearances - a[1].appearances));
}

// ── Action items ──────────────────────────────────────────────────────────────

function buildActionItems(kwResults: KeywordResult[], competitorDomains: Record<string, CompetitorDomainClassification>): ActionItems {
  const quick_wins: ActionItem[] = [];
  const new_page_opportunities: ActionItem[] = [];
  const curate_existing: ActionItem[] = [];
  const deprioritize: ActionItem[] = [];
  const reframe_keywords: ActionItem[] = [];

  for (const r of kwResults) {
    const page = r.content.covering_pages[0];
    const pos = r.serp?.our_ranking.position ?? null;

    // Deprioritize: SERP dominated by noise domains
    if (r.serp) {
      const noiseCount = r.serp.top_results.filter((res) => !res.is_ours && isNoise(res.domain)).length;
      if (noiseCount >= 3) {
        deprioritize.push({
          type: 'deprioritize',
          keyword: r.keyword,
          tier: r.tier,
          target_page: r.target_page,
          reasoning: `${noiseCount} of top-10 results are noise domains (physical delivery, wrong vertical) — SERP intent doesn't match our ICP.`,
          suggestion: `Skip this keyword. Consider a more specific variant that filters out the wrong intent.`,
        });
        continue;
      }
    }

    // Quick win: we're ranked but coverage gaps exist in high-weight zones
    if (pos !== null && pos <= 10 && page && page.coverage_score < 1.0) {
      const missing: string[] = [];
      if (!page.keyword_in_title) missing.push('title');
      if (!page.keyword_in_description) missing.push('description');
      if (!page.keyword_in_headings) missing.push('headings');
      if (missing.length > 0) {
        quick_wins.push({
          type: 'quick_win',
          keyword: r.keyword,
          tier: r.tier,
          target_page: r.target_page,
          reasoning: `Ranked at position ${pos} but keyword missing from: ${missing.join(', ')}. Adding it could push into top 3.`,
          suggestion: `Add "${r.keyword}" to ${missing.map((z) => `<${z}>`).join(', ')} of ${page.source_file}.`,
        });
        continue;
      }
    }

    // New page: no page is mapped to this keyword
    if (!page || !r.target_page) {
      new_page_opportunities.push({
        type: 'new_page',
        keyword: r.keyword,
        tier: r.tier,
        target_page: r.target_page,
        reasoning: `No page targets this keyword. ${pos === null ? 'Not ranking.' : `Ranking at ${pos} without a dedicated page.`}`,
        suggestion: `Create a new page targeting "${r.keyword}" with full title/description/headings/body coverage. Suggested path: /${r.keyword.toLowerCase().replace(/\s+/g, '-')}/`,
      });
      continue;
    }

    // Curate existing: page exists but coverage score is low (< 0.4)
    if (page && page.coverage_score < 0.4) {
      curate_existing.push({
        type: 'curate_existing',
        keyword: r.keyword,
        tier: r.tier,
        target_page: r.target_page,
        reasoning: `Page ${page.source_file} exists but coverage score is ${page.coverage_score.toFixed(2)} — keyword rarely appears.`,
        suggestion: `Weave "${r.keyword}" naturally into the body of ${page.source_file}. Add a section or FAQ entry that directly addresses the term.`,
      });
    }
  }

  // Competitor vocabulary gaps: terms competitors rank for that we haven't covered
  // Build from REGISTRY direct/adjacent entries - check their known keywords vs our coverage
  const coveredTerms = new Set(
    kwResults.flatMap((r) => [r.keyword, ...r.content.adjacent_keywords.filter((a) => a.covered).map((a) => a.term)])
      .map((t) => t.toLowerCase())
  );

  // Domains classified as direct/adjacent that appear prominently in our SERPs
  const prominentCompetitors = Object.entries(competitorDomains)
    .filter(([, v]) => v.class === 'direct' || v.class === 'adjacent')
    .filter(([, v]) => v.appearances >= 3)
    .map(([domain]) => domain);

  // Surface adjacent keywords from our keyword configs that aren't covered by any page
  const vocabularyGaps = kwResults
    .flatMap((r) => r.content.adjacent_keywords)
    .filter((a) => !a.covered)
    .map((a) => a.term)
    .filter((t) => !coveredTerms.has(t.toLowerCase()))
    .filter((t, i, arr) => arr.indexOf(t) === i) // dedupe
    .sort();

  // Reframe: T1/T2 keywords where only authority/direct competitors with very strong
  // brand rank above us and we have low or no coverage
  for (const r of kwResults) {
    if (r.tier > 2) continue;
    const page = r.content.covering_pages[0];
    if (page && page.coverage_score >= 0.6) continue;
    if (r.serp) {
      const directAbove = r.serp.top_results.filter(
        (res) => !res.is_ours && (classifyDomain(res.domain) === 'direct' || classifyDomain(res.domain) === 'authority') && res.position <= 5
      );
      if (directAbove.length >= 3 && !quick_wins.find((w) => w.keyword === r.keyword)) {
        reframe_keywords.push({
          type: 'reframe_keyword',
          keyword: r.keyword,
          tier: r.tier,
          target_page: r.target_page,
          reasoning: `${directAbove.length} direct/authority competitors occupy top-5 for "${r.keyword}". Head-on competition is uphill.`,
          suggestion: `Target a long-tail variant: add specificity (industry, persona, or outcome) to the keyword. E.g., "${r.keyword} for CTOs" or "${r.keyword} in regulated industries".`,
        });
      }
    }
  }

  return {
    quick_wins,
    new_page_opportunities,
    curate_existing,
    deprioritize,
    reframe_keywords,
    competitor_vocabulary_gaps: vocabularyGaps,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

const reportDate = todayYMD();
const reportPath = path.join(REPORTS_DIR, `${reportDate}.json`);

fs.mkdirSync(REPORTS_DIR, { recursive: true });

if (fs.existsSync(reportPath) && !FORCE) {
  console.log(`Report for ${reportDate} already exists: ${reportPath}`);
  console.log('Pass --force to regenerate.');
  process.exit(0);
}

console.log(`audit:seo  date=${reportDate}  serp=${dataSources.custom_search_api}  sc=${dataSources.search_console_api}`);
console.log(`  ${keywords.length} keywords to process\n`);

const kwResults: KeywordResult[] = [];
let queryCount = 0;

for (const kw of keywords) {
  process.stdout.write(`  [${kw.tier}] ${kw.keyword} ... `);

  const content = analyzeContent(kw);

  let serp: SerpData | null = null;
  if (dataSources.custom_search_api) {
    serp = await fetchSerp(kw.keyword);
    queryCount++;
    if (queryCount % 10 === 0) await sleep(1000); // respect 100 QPD rate limit
  }

  const sc = await fetchSearchConsole(kw.keyword, kw.target_page);

  const score = content.covering_pages[0]?.coverage_score ?? 0;
  const pos = serp?.our_ranking.position;
  console.log(`score=${score.toFixed(2)}  pos=${pos ?? '-'}`);

  kwResults.push({
    keyword: kw.keyword,
    tier: kw.tier,
    personas: kw.personas,
    industries: kw.industries,
    target_page: kw.target_page,
    serp,
    search_console: sc,
    content,
  });
}

const competitorDomains = buildCompetitorDomains(kwResults);

const report: SeoAuditReport = {
  schema_version: SCHEMA_VERSION,
  report_date: reportDate,
  generated_at: new Date().toISOString(),
  site_url: SITE_URL,
  data_sources: dataSources,
  summary: buildSummary(kwResults),
  keywords: kwResults,
  competitor_index: buildCompetitorIndex(kwResults),
  competitor_domains: competitorDomains,
  action_items: buildActionItems(kwResults, competitorDomains),
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

const s = report.summary;
console.log(`\naudit:seo complete`);
console.log(`  keywords:    ${s.total_keywords}  (T1:${s.by_tier['1']} T2:${s.by_tier['2']} T3:${s.by_tier['3']} T4:${s.by_tier['4']})`);
console.log(`  ranked ≤10:  ${s.ranked_top_10}`);
console.log(`  unranked:    ${s.unranked}`);
console.log(`  no data:     ${s.no_data}`);
if (s.avg_position != null) console.log(`  avg pos:     ${s.avg_position.toFixed(1)}`);
console.log(`  content gaps:${s.content_gaps.length}`);
const ai = report.action_items;
console.log(`  quick wins:  ${ai.quick_wins.length}`);
console.log(`  new pages:   ${ai.new_page_opportunities.length}`);
console.log(`  curate:      ${ai.curate_existing.length}`);
console.log(`  deprioritize:${ai.deprioritize.length}`);
console.log(`  reframe:     ${ai.reframe_keywords.length}`);
console.log(`  vocab gaps:  ${ai.competitor_vocabulary_gaps.length}`);
console.log(`  report:      ${reportPath}`);
