/**
 * Concrete JSON schema for the daily SEO audit report.
 *
 * The schema is versioned (schema_version) so consumers (dashboards,
 * databases, import scripts) can detect breaking changes. All optional
 * sections (serp, search_console) are null when the corresponding
 * credentials are not configured — callers must null-check before reading.
 */

export const SCHEMA_VERSION = '1.1' as const;

// ── Report root ────────────────────────────────────────────────────────────────

export interface SeoAuditReport {
  schema_version: typeof SCHEMA_VERSION;
  /** YYYY-MM-DD — one report per calendar day. */
  report_date: string;
  generated_at: string;       // ISO 8601 timestamp
  site_url: string;
  data_sources: DataSources;
  summary: ReportSummary;
  keywords: KeywordResult[];
  competitor_index: CompetitorIndex;
  /** Classified view of every domain appearing in our SERPs. */
  competitor_domains: Record<string, CompetitorDomainClassification>;
  /** Prioritised action list derived from gap and SERP analysis. */
  action_items: ActionItems;
}

export interface CompetitorDomainClassification {
  class: 'direct' | 'adjacent' | 'authority' | 'community' | 'noise' | 'unknown';
  appearances: number;
}

export interface DataSources {
  /** True when GOOGLE_CSE_API_KEY + GOOGLE_CSE_ID are set. */
  custom_search_api: boolean;
  /** True when GOOGLE_SC_CREDENTIALS (service account JSON path) is set. */
  search_console_api: boolean;
  /** Always true — content analysis requires no credentials. */
  content_analysis: boolean;
}

// ── Summary ────────────────────────────────────────────────────────────────────

export interface ReportSummary {
  total_keywords: number;
  /** Keyword count split by tier. Keys are string "1"–"4". */
  by_tier: Record<'1' | '2' | '3' | '4', number>;
  /** Keywords where tnms.ai appears in positions 1–10. */
  ranked_top_10: number;
  /** Keywords where SERP was fetched but tnms.ai was absent. */
  unranked: number;
  /** Keywords where SERP data was not fetched (no API credentials). */
  no_data: number;
  /** Average Google position across all ranked keywords, or null if none. */
  avg_position: number | null;
  /** Keywords whose target page has zero or low keyword coverage. */
  content_gaps: ContentGap[];
  /** Domains appearing most frequently in our SERPs. */
  top_competitor_domains: CompetitorFrequency[];
  /** Adjacent terms from the keyword config that no target page covers. */
  adjacent_keywords_uncovered: string[];
}

export interface ContentGap {
  keyword: string;
  tier: 1 | 2 | 3 | 4;
  /** null means the keyword config has no designated page yet. */
  target_page: string | null;
  /** Which content zones are missing the keyword. */
  missing_from: ContentZone[];
}

export type ContentZone = 'title' | 'description' | 'headings' | 'body';

export interface CompetitorFrequency {
  domain: string;
  /** Number of our tracked keywords where this domain appears in the SERP. */
  appearances: number;
}

// ── Per-keyword result ─────────────────────────────────────────────────────────

export interface KeywordResult {
  keyword: string;
  tier: 1 | 2 | 3 | 4;
  personas: string[];
  industries: string[];
  /** Site-relative URL path intended to rank for this keyword. */
  target_page: string | null;
  /** null when Custom Search API is not configured. */
  serp: SerpData | null;
  /** null when Search Console credentials are not configured. */
  search_console: ScData | null;
  content: ContentAnalysis;
}

// ── SERP data ──────────────────────────────────────────────────────────────────

export interface SerpData {
  queried_at: string;           // ISO 8601
  our_ranking: OurRanking;
  top_results: SerpResult[];
}

export interface OurRanking {
  /** 1–10, or null if tnms.ai did not appear in the top-10 results. */
  position: number | null;
  url: string | null;
}

export interface SerpResult {
  position: number;             // 1–10
  url: string;
  domain: string;
  title: string;
  snippet: string;
  is_ours: boolean;
}

// ── Search Console data ────────────────────────────────────────────────────────

export interface ScData {
  period_start: string;         // YYYY-MM-DD
  period_end: string;           // YYYY-MM-DD
  impressions: number;
  clicks: number;
  /** Click-through rate as a fraction (0.0–1.0). */
  ctr: number;
  avg_position: number;
}

// ── Content analysis ───────────────────────────────────────────────────────────

export interface ContentAnalysis {
  /** One entry per page that is mapped to this keyword. Usually one. */
  covering_pages: PageCoverage[];
  /** Adjacent terms from the keyword config and whether they appear on the page. */
  adjacent_keywords: AdjacentKeyword[];
}

export interface PageCoverage {
  /** Site-relative URL, e.g. "/solutions/cto/". */
  path: string;
  /** Workspace-relative source file, e.g. "src/pages/solutions/cto.astro". */
  source_file: string;
  /**
   * Weighted coverage score 0.0–1.0:
   *   title × 0.4  +  description × 0.2  +  headings × 0.2  +  body × 0.2
   */
  coverage_score: number;
  keyword_in_title: boolean;
  keyword_in_description: boolean;
  keyword_in_headings: boolean;
  keyword_in_body: boolean;
}

export interface AdjacentKeyword {
  term: string;
  /** True if the term appears anywhere in the target page source file. */
  covered: boolean;
}

// ── Action items ───────────────────────────────────────────────────────────────

export type ActionItemType =
  | 'quick_win'           // ranked but coverage gaps — patch title/description/headings
  | 'new_page'            // no page targets this keyword; create one
  | 'curate_existing'     // page exists but coverage is low; needs deeper treatment
  | 'deprioritize'        // keyword polluted by noise; not worth chasing
  | 'reframe_keyword';    // competitor framing is stronger; pivot the angle

export interface ActionItem {
  type: ActionItemType;
  keyword: string;
  tier: 1 | 2 | 3 | 4;
  target_page: string | null;
  reasoning: string;
  /** Suggested edit or next step — concrete and actionable. */
  suggestion: string;
}

export interface ActionItems {
  quick_wins: ActionItem[];
  new_page_opportunities: ActionItem[];
  curate_existing: ActionItem[];
  deprioritize: ActionItem[];
  reframe_keywords: ActionItem[];
  /** Vocabulary competitors use that we haven't covered on any page. */
  competitor_vocabulary_gaps: string[];
}

// ── Competitor index ───────────────────────────────────────────────────────────

export interface CompetitorIndex {
  /** Sorted by total_appearances descending. Capped at 20 domains. */
  domains: CompetitorDomain[];
}

export interface CompetitorDomain {
  domain: string;
  total_appearances: number;
  /** Each keyword where this domain appeared in the top 10. */
  keywords: CompetitorKeywordEntry[];
}

export interface CompetitorKeywordEntry {
  keyword: string;
  position: number;
}
