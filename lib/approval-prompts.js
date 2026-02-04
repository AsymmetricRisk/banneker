/**
 * Interactive prompts for approval workflow
 *
 * Provides user interaction functions for reviewing and approving
 * AI-generated engineering decisions.
 */

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const TMP_DIR = '.banneker/tmp';

/**
 * Parse comma-separated indices from user input
 * Converts 1-based user input to 0-based array indices
 *
 * @param {string} input - User input like "1,3,5" or "1, 3, 5"
 * @param {number} maxIndex - Maximum valid index (1-based, i.e., array length)
 * @returns {number[]} Array of valid 0-based indices
 */
export function parseIndices(input, maxIndex) {
  if (!input || typeof input !== 'string') {
    return [];
  }

  return input
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n) && n >= 1 && n <= maxIndex)
    .map(n => n - 1); // Convert to 0-based
}

/**
 * Format a decision for editing with instructional comments
 *
 * @param {Object} decision - Decision object to format
 * @returns {string} Formatted string with comments and JSON
 */
export function formatEditableDecision(decision) {
  const lines = [
    '# Edit the decision below (lines starting with # are ignored)',
    `# Decision ID: ${decision.id || 'Unknown'}`,
    `# Question: ${decision.question || 'Unknown'}`,
    '#',
    '# Save and close to accept changes.',
    '# To cancel, delete all JSON content.',
    '',
    JSON.stringify(decision, null, 2)
  ];
  return lines.join('\n') + '\n';
}

/**
 * Parse edited decision content by stripping comments
 *
 * @param {string} content - File content with comments
 * @returns {Object|null} Parsed decision or null if cancelled/invalid
 */
export function parseEditedDecision(content) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // Strip lines starting with #
  const jsonLines = content
    .split('\n')
    .filter(line => !line.trimStart().startsWith('#'))
    .join('\n')
    .trim();

  if (!jsonLines) {
    return null; // User deleted content to cancel
  }

  try {
    return JSON.parse(jsonLines);
  } catch (err) {
    return null;
  }
}

/**
 * Prompt user for batch selection of proposals
 *
 * @param {Array<Object>} proposals - Array of proposal objects
 * @returns {Promise<{approved: number[], rejected: number[]}>} Object with 0-based indices
 */
export async function promptForBatchSelection(proposals) {
  if (!proposals || proposals.length === 0) {
    return { approved: [], rejected: [] };
  }

  const rl = createInterface({ input, output });
  const maxAttempts = 5;

  try {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log('\nBatch action:');
      console.log('  a) Approve all');
      console.log('  r) Reject all');
      console.log('  s) Select individually (enter numbers like: 1,3,5)');

      const answer = await rl.question('\nChoice: ');
      const choice = answer.trim().toLowerCase();

      if (choice === 'a') {
        // Approve all
        const approved = proposals.map((_, i) => i);
        return { approved, rejected: [] };
      }

      if (choice === 'r') {
        // Reject all
        const rejected = proposals.map((_, i) => i);
        return { approved: [], rejected };
      }

      if (choice === 's') {
        // Select individually - prompt for which to approve
        const approveAnswer = await rl.question(
          `\nEnter numbers to APPROVE (1-${proposals.length}, comma-separated, or empty for none): `
        );

        const approved = parseIndices(approveAnswer, proposals.length);

        // Everything not approved is rejected
        const rejected = proposals
          .map((_, i) => i)
          .filter(i => !approved.includes(i));

        return { approved, rejected };
      }

      // Invalid input
      console.log(`Invalid choice: "${answer}". Please enter 'a', 'r', or 's'.`);
    }

    // Too many invalid attempts
    console.error('Too many invalid attempts. Defaulting to reject all for safety.');
    return { approved: [], rejected: proposals.map((_, i) => i) };
  } finally {
    rl.close();
  }
}

/**
 * Prompt user for rejection reason
 *
 * @param {Object} decision - Decision being rejected
 * @returns {Promise<string>} Rejection reason (empty string if skipped)
 */
export async function promptForRejectionReason(decision) {
  const rl = createInterface({ input, output });

  try {
    console.log(`\nRejecting: ${decision.id || 'Unknown'}`);
    console.log(`  Question: ${decision.question || 'Unknown'}`);
    console.log(`  Choice: ${decision.choice || 'Unknown'}`);

    const answer = await rl.question('Reason for rejection (optional, press Enter to skip): ');
    return answer.trim();
  } finally {
    rl.close();
  }
}

/**
 * Prompt user for per-decision action
 *
 * @param {Object} decision - Decision to act on
 * @returns {Promise<'approve'|'reject'|'edit'|'skip'>} User's choice
 */
export async function promptForApprovalAction(decision) {
  const rl = createInterface({ input, output });
  const maxAttempts = 5;

  try {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Decision: ${decision.id || 'Unknown'}`);
    console.log(`Question: ${decision.question || 'Unknown'}`);
    console.log(`Choice: ${decision.choice || 'Unknown'}`);
    console.log(`Rationale: ${decision.rationale || 'None provided'}`);
    console.log(`Confidence: ${decision.confidence || 'Unknown'}`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log('\nActions:');
      console.log('  y) Approve');
      console.log('  n) Reject');
      console.log('  e) Edit');
      console.log('  s) Skip for now');

      const answer = await rl.question('\nChoice (y/n/e/s): ');
      const choice = answer.trim().toLowerCase();

      switch (choice) {
        case 'y':
          return 'approve';
        case 'n':
          return 'reject';
        case 'e':
          return 'edit';
        case 's':
          return 'skip';
        default:
          console.log(`Invalid choice: "${answer}". Please enter y, n, e, or s.`);
      }
    }

    // Too many invalid attempts - default to skip
    console.error('Too many invalid attempts. Skipping this decision.');
    return 'skip';
  } finally {
    rl.close();
  }
}

/**
 * Open decision in $EDITOR for editing
 *
 * @param {Object} decision - Decision to edit
 * @returns {Promise<Object>} Edited decision object
 * @throws {Error} If edit was cancelled or JSON is invalid
 */
export async function editDecisionInEditor(decision) {
  // Ensure tmp directory exists
  if (!existsSync(TMP_DIR)) {
    await mkdir(TMP_DIR, { recursive: true });
  }

  // Create temp file with decision
  const tmpFile = join(TMP_DIR, `decision-${decision.id || 'edit'}-${Date.now()}.json`);
  const content = formatEditableDecision(decision);
  await writeFile(tmpFile, content, 'utf8');

  // Determine editor
  const editor = process.env.EDITOR || process.env.VISUAL || 'vi';

  // Spawn editor and wait for it to close
  await new Promise((resolve, reject) => {
    const child = spawn(editor, [tmpFile], {
      stdio: 'inherit',
      shell: true
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to launch editor '${editor}': ${err.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Editor exited with code ${code}`));
      }
    });
  });

  // Read back the file
  const editedContent = await readFile(tmpFile, 'utf8');

  // Clean up temp file
  try {
    await unlink(tmpFile);
  } catch (err) {
    // Ignore cleanup errors
  }

  // Parse the edited content
  const result = parseEditedDecision(editedContent);

  if (!result) {
    throw new Error('Edit cancelled or invalid JSON');
  }

  return result;
}
