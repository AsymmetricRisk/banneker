/**
 * Research integration module for Banneker engineer
 * Identifies gaps that could be filled via WebSearch research
 */

/**
 * Keywords that indicate a gap could be filled with research
 */
export const RESEARCHABLE_INDICATORS = [
  'best practices',
  'recommended',
  'industry standard',
  'current approach',
  'comparison',
  'vs',
  'alternatives',
  'trade-offs',
  'modern approach',
  'state of the art'
];

/**
 * Identify gaps from DIAGNOSIS that could be filled with research
 * @param {Array<string>} diagnosisGaps - Gaps identified in DIAGNOSIS.md
 * @returns {Array<object>} Researchable gaps with search queries
 */
export function identifyResearchableGaps(diagnosisGaps) {
  const researchable = [];

  for (const gap of diagnosisGaps) {
    const gapLower = gap.toLowerCase();

    // Check if gap mentions researchable topics
    const isResearchable = RESEARCHABLE_INDICATORS.some(indicator =>
      gapLower.includes(indicator)
    );

    // Also check for technology comparison gaps
    const isTechComparison = /\bvs\b|comparison|which.*(?:to use|better)|choose between/i.test(gap);

    if (isResearchable || isTechComparison) {
      researchable.push({
        gap,
        searchQuery: buildSearchQuery(gap),
        priority: isTechComparison ? 'high' : 'medium',
        type: isTechComparison ? 'technology_comparison' : 'best_practices'
      });
    }
  }

  // Sort by priority (high first), limit to top 3
  return researchable
    .sort((a, b) => a.priority === 'high' ? -1 : 1)
    .slice(0, 3);
}

/**
 * Build a search query from a gap description
 * @param {string} gap - Gap description text
 * @returns {string} Search query for WebSearch
 */
export function buildSearchQuery(gap) {
  // Clean up gap text
  const cleaned = gap
    // Remove survey path notation
    .replace(/backend\.|frontend\.|survey\.|rubric_coverage\./g, '')
    // Remove common gap descriptors
    .replace(/not.?captured|missing|gap|unknown|unspecified/gi, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Add freshness indicator (current year)
  const year = new Date().getFullYear();
  return `${cleaned} best practices ${year}`;
}

/**
 * Format research results for inclusion in RECOMMENDATION.md
 * @param {object} researchResult - Result from WebSearch
 * @param {string} originalGap - The gap this research addresses
 * @returns {string} Formatted markdown section
 */
export function formatResearchFindings(researchResult, originalGap) {
  return `
### Research Findings

**Gap addressed:** ${originalGap}
**Query:** ${researchResult.query}
**Source:** ${researchResult.source || 'WebSearch'}

**Key findings:**
${researchResult.findings || 'No specific findings extracted'}

**Impact on recommendation:**
${researchResult.impact || 'Research findings incorporated into recommendation confidence.'}

---
`;
}
