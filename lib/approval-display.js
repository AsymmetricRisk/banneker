/**
 * Approval display - table formatting and category-grouped display
 *
 * Provides terminal output functions for approval workflow
 * with ANSI color support and terminal width detection.
 */

// ANSI color codes (matching installer.js pattern)
const colors = {
  reset: '\x1b[0m',
  brightPurple: '\x1b[95m',
  purple: '\x1b[35m',
  yellow: '\x1b[33m',
  white: '\x1b[97m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m'
};

/**
 * Truncate text with ellipsis if it exceeds max length
 *
 * @param {string} text - Text to truncate
 * @param {number} maxLen - Maximum length
 * @returns {string} Truncated text with ellipsis or original text
 */
export function truncateText(text, maxLen) {
  if (!text || text.length <= maxLen) {
    return text || '';
  }
  return text.slice(0, maxLen - 3) + '...';
}

/**
 * Format confidence level with appropriate color
 *
 * @param {string} confidence - Confidence level (HIGH, MEDIUM, LOW)
 * @returns {string} Colored confidence string
 */
export function formatConfidence(confidence) {
  if (!confidence) {
    return `${colors.gray}(not specified)${colors.reset}`;
  }

  const level = confidence.toUpperCase();
  if (level === 'HIGH') {
    return `${colors.brightPurple}HIGH${colors.reset}`;
  }
  if (level === 'MEDIUM') {
    return `${colors.yellow}MEDIUM${colors.reset}`;
  }
  return `${colors.gray}LOW${colors.reset}`;
}

/**
 * Display proposals summary grouped by domain
 *
 * @param {Array<Object>} proposals - Array of proposal objects
 *   Each proposal should have: id, domain, question, choice, confidence
 */
export function displayProposalsSummary(proposals) {
  if (!proposals || proposals.length === 0) {
    console.log(`\n${colors.gray}No proposals to display${colors.reset}\n`);
    return;
  }

  // Detect terminal width for truncation
  const termWidth = process.stdout.columns || 80;
  const maxQuestionLen = Math.max(30, Math.floor(termWidth * 0.5));
  const maxChoiceLen = Math.max(20, Math.floor(termWidth * 0.3));

  // Group proposals by domain
  const byDomain = {};
  proposals.forEach(p => {
    const domain = p.domain || 'UNCATEGORIZED';
    if (!byDomain[domain]) {
      byDomain[domain] = [];
    }
    byDomain[domain].push(p);
  });

  // Display header
  console.log(`\n${colors.brightPurple}Proposed Decisions${colors.reset} (${proposals.length} total)`);
  console.log('═'.repeat(Math.min(80, termWidth)));

  // Track global index for numbered selection
  let globalIndex = 1;

  // Display each domain group
  Object.entries(byDomain).forEach(([domain, decisions]) => {
    console.log(`\n${colors.cyan}${domain}${colors.reset} (${decisions.length} decision${decisions.length === 1 ? '' : 's'})`);
    console.log('─'.repeat(Math.min(80, termWidth)));

    decisions.forEach(dec => {
      const marker = `[${globalIndex}]`;
      const confidence = formatConfidence(dec.confidence);
      const question = truncateText(dec.question, maxQuestionLen);
      const choice = truncateText(dec.choice, maxChoiceLen);

      console.log(`${colors.yellow}${marker}${colors.reset} ${dec.id}: ${question}`);
      console.log(`    ${colors.white}Choice:${colors.reset} ${choice}`);
      console.log(`    ${colors.gray}Confidence:${colors.reset} ${confidence}`);

      globalIndex++;
    });
  });

  console.log('\n');
}
