/**
 * competitors.ts — competitor domain registry.
 *
 * Classify every domain that appears in your SERPs. This drives the
 * competitor index section of the SEO audit report.
 *
 * Classes:
 *   direct    — Same ICP, same problem space: out-rank and out-content
 *   adjacent  — Related space, overlapping intent: mine for vocabulary gaps
 *   authority — IBM, AWS, Gartner etc.: benchmark framing; don't target head terms
 *   community — YouTube, Reddit, Medium: distribution insight only
 *   noise     — Wrong vertical entirely: exclude from all analysis
 */

export type CompetitorClass =
  | 'direct'
  | 'adjacent'
  | 'authority'
  | 'community'
  | 'noise';

export interface Competitor {
  domain: string;
  class: CompetitorClass;
  notes?: string;
}

export const competitors: Competitor[] = [
  // Example — uncomment and edit to activate:
  // { domain: 'competitor.com', class: 'direct',    notes: 'Main rival' },
  // { domain: 'related.io',     class: 'adjacent',  notes: 'Different audience' },
  // { domain: 'gartner.com',    class: 'authority', notes: 'Research firm' },
];
