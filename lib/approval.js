/**
 * Approval workflow - atomic merge and rejection logging
 *
 * Handles merging approved decisions to architecture-decisions.json
 * and logging rejected decisions for audit trails.
 */

import { readFile, writeFile, rename, copyFile, unlink, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';

const DECISIONS_PATH = '.banneker/architecture-decisions.json';
const REJECTION_LOG_PATH = '.banneker/rejection-log.json';

/**
 * Merge approved decisions to architecture-decisions.json using atomic write
 *
 * @param {Array<Object>} approvedDecisions - Array of decision objects to merge
 * @returns {Promise<number>} Count of merged decisions
 */
export async function mergeApprovedDecisions(approvedDecisions) {
  if (!approvedDecisions || approvedDecisions.length === 0) {
    return 0;
  }

  // Initialize default structure
  let decisionLog = {
    version: "0.1.0",
    project: "Unknown",
    decisions: [],
    recorded_at: ""
  };

  // Ensure directory exists
  const dirPath = dirname(DECISIONS_PATH);
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }

  // Read existing decision log if it exists
  if (existsSync(DECISIONS_PATH)) {
    try {
      const content = await readFile(DECISIONS_PATH, 'utf8');
      decisionLog = JSON.parse(content);
    } catch (err) {
      // If file exists but is invalid JSON, keep default structure
      console.warn('Warning: Could not parse existing architecture-decisions.json, creating new');
    }

    // Create backup before modification
    const backupPath = `${DECISIONS_PATH}.backup`;
    await copyFile(DECISIONS_PATH, backupPath);
  }

  // Transform and append approved decisions
  const finalDecisions = approvedDecisions.map(prop => ({
    id: prop.id,
    domain: prop.domain,
    question: prop.question,
    choice: prop.choice,
    rationale: prop.rationale,
    alternatives_considered: prop.alternatives_considered || []
  }));

  decisionLog.decisions.push(...finalDecisions);
  decisionLog.recorded_at = new Date().toISOString();

  // Atomic write: write to .tmp file first, then rename
  const tmpPath = `${DECISIONS_PATH}.tmp`;
  await writeFile(tmpPath, JSON.stringify(decisionLog, null, 2) + '\n', 'utf8');
  await rename(tmpPath, DECISIONS_PATH);

  // Remove backup on success
  const backupPath = `${DECISIONS_PATH}.backup`;
  if (existsSync(backupPath)) {
    await unlink(backupPath);
  }

  return finalDecisions.length;
}

/**
 * Log rejected decisions to rejection-log.json for audit trail
 *
 * @param {Array<Object>} rejectedDecisions - Array of rejected decision objects
 * @param {Array<string>} reasons - Array of rejection reasons (parallel to rejectedDecisions)
 * @returns {Promise<void>}
 */
export async function logRejectedDecisions(rejectedDecisions, reasons = []) {
  if (!rejectedDecisions || rejectedDecisions.length === 0) {
    return;
  }

  // Initialize default structure
  let log = { rejections: [] };

  // Ensure directory exists
  const dirPath = dirname(REJECTION_LOG_PATH);
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }

  // Read existing rejection log if it exists
  if (existsSync(REJECTION_LOG_PATH)) {
    try {
      const content = await readFile(REJECTION_LOG_PATH, 'utf8');
      log = JSON.parse(content);
    } catch (err) {
      // If file exists but is invalid JSON, keep default structure
      console.warn('Warning: Could not parse existing rejection-log.json, creating new');
    }
  }

  const timestamp = new Date().toISOString();

  // Append each rejection with full details for recovery
  rejectedDecisions.forEach((decision, i) => {
    log.rejections.push({
      timestamp,
      decision_id: decision.id,
      question: decision.question,
      proposed_choice: decision.choice,
      reason: reasons[i] || 'User rejected without reason',
      full_decision: decision,
      status: 'rejected'
    });
  });

  // Write updated log
  await writeFile(REJECTION_LOG_PATH, JSON.stringify(log, null, 2) + '\n', 'utf8');
}
