/**
 * Integration tests for the approval workflow
 * Tests end-to-end file I/O operations with real temp directories
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Import functions under test
import { mergeApprovedDecisions, logRejectedDecisions } from '../../lib/approval.js';
import { displayProposalsSummary, truncateText, formatConfidence } from '../../lib/approval-display.js';

describe('mergeApprovedDecisions', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    // Create a fresh temp directory for each test
    tmpDir = join(tmpdir(), 'banneker-approval-test-' + Date.now() + '-' + Math.random().toString(36).slice(2));
    await mkdir(tmpDir, { recursive: true });

    // Change to temp directory so relative paths work
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    // Restore original directory
    process.chdir(originalCwd);

    // Clean up temp directory
    try {
      await rm(tmpDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should create architecture-decisions.json if missing', async () => {
    const decisions = [{
      id: 'DEC-001',
      domain: 'Authentication',
      question: 'How should users authenticate?',
      choice: 'JWT with refresh tokens',
      rationale: 'Stateless authentication for scalability'
    }];

    const count = await mergeApprovedDecisions(decisions);

    assert.strictEqual(count, 1, 'Should return count of 1');

    const filePath = join(tmpDir, '.banneker', 'architecture-decisions.json');
    assert.ok(existsSync(filePath), 'architecture-decisions.json should be created');

    const content = JSON.parse(await readFile(filePath, 'utf8'));
    assert.strictEqual(content.decisions.length, 1, 'Should have 1 decision');
    assert.strictEqual(content.decisions[0].id, 'DEC-001');
  });

  it('should append to existing decisions array', async () => {
    // Create existing file
    await mkdir(join(tmpDir, '.banneker'), { recursive: true });
    const existingData = {
      version: '0.1.0',
      project: 'TestProject',
      decisions: [{
        id: 'DEC-000',
        domain: 'Existing',
        question: 'Previous question',
        choice: 'Previous choice',
        rationale: 'Previous rationale'
      }],
      recorded_at: '2024-01-01T00:00:00.000Z'
    };
    await writeFile(
      join(tmpDir, '.banneker', 'architecture-decisions.json'),
      JSON.stringify(existingData, null, 2),
      'utf8'
    );

    const newDecisions = [{
      id: 'DEC-001',
      domain: 'Authentication',
      question: 'New question',
      choice: 'New choice',
      rationale: 'New rationale'
    }];

    const count = await mergeApprovedDecisions(newDecisions);

    assert.strictEqual(count, 1, 'Should return count of 1');

    const content = JSON.parse(await readFile(join(tmpDir, '.banneker', 'architecture-decisions.json'), 'utf8'));
    assert.strictEqual(content.decisions.length, 2, 'Should have 2 decisions total');
    assert.strictEqual(content.decisions[0].id, 'DEC-000', 'First decision should be existing');
    assert.strictEqual(content.decisions[1].id, 'DEC-001', 'Second decision should be new');
  });

  it('should update recorded_at timestamp', async () => {
    const before = new Date().toISOString();

    const decisions = [{
      id: 'DEC-001',
      domain: 'Test',
      question: 'Test question',
      choice: 'Test choice',
      rationale: 'Test rationale'
    }];

    await mergeApprovedDecisions(decisions);

    const after = new Date().toISOString();

    const content = JSON.parse(await readFile(join(tmpDir, '.banneker', 'architecture-decisions.json'), 'utf8'));

    assert.ok(content.recorded_at, 'Should have recorded_at timestamp');
    assert.ok(content.recorded_at >= before, 'recorded_at should be >= test start');
    assert.ok(content.recorded_at <= after, 'recorded_at should be <= test end');
  });

  it('should create and remove backup file on success', async () => {
    // Create existing file to trigger backup
    await mkdir(join(tmpDir, '.banneker'), { recursive: true });
    const existingData = {
      version: '0.1.0',
      project: 'TestProject',
      decisions: [],
      recorded_at: '2024-01-01T00:00:00.000Z'
    };
    await writeFile(
      join(tmpDir, '.banneker', 'architecture-decisions.json'),
      JSON.stringify(existingData, null, 2),
      'utf8'
    );

    const decisions = [{
      id: 'DEC-001',
      domain: 'Test',
      question: 'Test question',
      choice: 'Test choice',
      rationale: 'Test rationale'
    }];

    await mergeApprovedDecisions(decisions);

    // Backup should be removed after successful write
    const backupPath = join(tmpDir, '.banneker', 'architecture-decisions.json.backup');
    assert.ok(!existsSync(backupPath), 'Backup file should be removed on success');

    // Main file should exist
    const mainPath = join(tmpDir, '.banneker', 'architecture-decisions.json');
    assert.ok(existsSync(mainPath), 'Main file should exist');
  });

  it('should return count of merged decisions', async () => {
    const decisions = [
      { id: 'DEC-001', domain: 'A', question: 'Q1', choice: 'C1', rationale: 'R1' },
      { id: 'DEC-002', domain: 'B', question: 'Q2', choice: 'C2', rationale: 'R2' },
      { id: 'DEC-003', domain: 'C', question: 'Q3', choice: 'C3', rationale: 'R3' }
    ];

    const count = await mergeApprovedDecisions(decisions);

    assert.strictEqual(count, 3, 'Should return count of 3');
  });

  it('should return 0 for empty input', async () => {
    const count = await mergeApprovedDecisions([]);
    assert.strictEqual(count, 0, 'Should return 0 for empty array');

    const countNull = await mergeApprovedDecisions(null);
    assert.strictEqual(countNull, 0, 'Should return 0 for null');
  });
});

describe('logRejectedDecisions', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), 'banneker-rejection-test-' + Date.now() + '-' + Math.random().toString(36).slice(2));
    await mkdir(tmpDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    try {
      await rm(tmpDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should create rejection-log.json if missing', async () => {
    const decisions = [{
      id: 'DEC-001',
      question: 'How should users authenticate?',
      choice: 'JWT with refresh tokens'
    }];

    await logRejectedDecisions(decisions, ['Not suitable for our use case']);

    const filePath = join(tmpDir, '.banneker', 'rejection-log.json');
    assert.ok(existsSync(filePath), 'rejection-log.json should be created');

    const content = JSON.parse(await readFile(filePath, 'utf8'));
    assert.strictEqual(content.rejections.length, 1, 'Should have 1 rejection');
  });

  it('should append rejection with all required fields', async () => {
    const decisions = [{
      id: 'DEC-001',
      question: 'How should users authenticate?',
      choice: 'JWT with refresh tokens',
      rationale: 'Stateless auth',
      domain: 'Authentication'
    }];

    await logRejectedDecisions(decisions, ['Does not meet security requirements']);

    const content = JSON.parse(await readFile(join(tmpDir, '.banneker', 'rejection-log.json'), 'utf8'));
    const rejection = content.rejections[0];

    // Verify all required fields
    assert.ok(rejection.timestamp, 'Should have timestamp');
    assert.strictEqual(rejection.decision_id, 'DEC-001', 'Should have decision_id');
    assert.strictEqual(rejection.question, 'How should users authenticate?', 'Should have question');
    assert.strictEqual(rejection.proposed_choice, 'JWT with refresh tokens', 'Should have proposed_choice');
    assert.strictEqual(rejection.reason, 'Does not meet security requirements', 'Should have reason');
    assert.ok(rejection.full_decision, 'Should have full_decision for recovery');
    assert.strictEqual(rejection.status, 'rejected', 'Should have status');
  });

  it('should handle multiple rejections in one call', async () => {
    const decisions = [
      { id: 'DEC-001', question: 'Q1', choice: 'C1' },
      { id: 'DEC-002', question: 'Q2', choice: 'C2' },
      { id: 'DEC-003', question: 'Q3', choice: 'C3' }
    ];
    const reasons = ['Reason 1', 'Reason 2', 'Reason 3'];

    await logRejectedDecisions(decisions, reasons);

    const content = JSON.parse(await readFile(join(tmpDir, '.banneker', 'rejection-log.json'), 'utf8'));
    assert.strictEqual(content.rejections.length, 3, 'Should have 3 rejections');

    assert.strictEqual(content.rejections[0].reason, 'Reason 1');
    assert.strictEqual(content.rejections[1].reason, 'Reason 2');
    assert.strictEqual(content.rejections[2].reason, 'Reason 3');
  });

  it('should use default reason when none provided', async () => {
    const decisions = [{
      id: 'DEC-001',
      question: 'Test question',
      choice: 'Test choice'
    }];

    // No reasons array provided
    await logRejectedDecisions(decisions, []);

    const content = JSON.parse(await readFile(join(tmpDir, '.banneker', 'rejection-log.json'), 'utf8'));
    assert.strictEqual(
      content.rejections[0].reason,
      'User rejected without reason',
      'Should use default reason'
    );
  });

  it('should append to existing rejections', async () => {
    // Create existing rejection log
    await mkdir(join(tmpDir, '.banneker'), { recursive: true });
    const existingData = {
      rejections: [{
        timestamp: '2024-01-01T00:00:00.000Z',
        decision_id: 'DEC-000',
        question: 'Existing',
        proposed_choice: 'Existing',
        reason: 'Existing reason',
        full_decision: {},
        status: 'rejected'
      }]
    };
    await writeFile(
      join(tmpDir, '.banneker', 'rejection-log.json'),
      JSON.stringify(existingData, null, 2),
      'utf8'
    );

    const newDecisions = [{
      id: 'DEC-001',
      question: 'New question',
      choice: 'New choice'
    }];

    await logRejectedDecisions(newDecisions, ['New reason']);

    const content = JSON.parse(await readFile(join(tmpDir, '.banneker', 'rejection-log.json'), 'utf8'));
    assert.strictEqual(content.rejections.length, 2, 'Should have 2 rejections total');
    assert.strictEqual(content.rejections[0].decision_id, 'DEC-000', 'First should be existing');
    assert.strictEqual(content.rejections[1].decision_id, 'DEC-001', 'Second should be new');
  });

  it('should do nothing for empty input', async () => {
    await logRejectedDecisions([], []);
    await logRejectedDecisions(null, null);

    // No file should be created
    const filePath = join(tmpDir, '.banneker', 'rejection-log.json');
    assert.ok(!existsSync(filePath), 'No file should be created for empty input');
  });
});

describe('displayProposalsSummary', () => {
  // Note: displayProposalsSummary outputs to console, so we test the helper functions
  // and verify the main function doesn't throw for various inputs

  it('should handle empty proposals array', () => {
    // Should not throw
    assert.doesNotThrow(() => {
      displayProposalsSummary([]);
    });
  });

  it('should handle null proposals', () => {
    // Should not throw
    assert.doesNotThrow(() => {
      displayProposalsSummary(null);
    });
  });

  it('should handle proposals with various domains', () => {
    const proposals = [
      { id: 'DEC-001', domain: 'Authentication', question: 'Q1', choice: 'C1', confidence: 'HIGH' },
      { id: 'DEC-002', domain: 'Database', question: 'Q2', choice: 'C2', confidence: 'MEDIUM' },
      { id: 'DEC-003', domain: 'Authentication', question: 'Q3', choice: 'C3', confidence: 'LOW' },
      { id: 'DEC-004', domain: null, question: 'Q4', choice: 'C4', confidence: 'HIGH' }
    ];

    // Should not throw and should group by domain
    assert.doesNotThrow(() => {
      displayProposalsSummary(proposals);
    });
  });

  it('truncateText should truncate long text with ellipsis', () => {
    const longText = 'This is a very long text that should be truncated';
    const truncated = truncateText(longText, 20);

    assert.strictEqual(truncated.length, 20, 'Should be exactly max length');
    assert.ok(truncated.endsWith('...'), 'Should end with ellipsis');
    assert.strictEqual(truncated, 'This is a very lo...');
  });

  it('truncateText should not truncate short text', () => {
    const shortText = 'Short';
    const result = truncateText(shortText, 20);

    assert.strictEqual(result, 'Short', 'Should not modify short text');
  });

  it('truncateText should handle empty or null text', () => {
    assert.strictEqual(truncateText('', 20), '', 'Should return empty string');
    assert.strictEqual(truncateText(null, 20), '', 'Should return empty string for null');
    assert.strictEqual(truncateText(undefined, 20), '', 'Should return empty string for undefined');
  });

  it('formatConfidence should format HIGH confidence', () => {
    const result = formatConfidence('HIGH');
    assert.ok(result.includes('HIGH'), 'Should contain HIGH');
    assert.ok(result.includes('\x1b['), 'Should contain ANSI codes');
  });

  it('formatConfidence should format MEDIUM confidence', () => {
    const result = formatConfidence('MEDIUM');
    assert.ok(result.includes('MEDIUM'), 'Should contain MEDIUM');
  });

  it('formatConfidence should format LOW confidence', () => {
    const result = formatConfidence('LOW');
    assert.ok(result.includes('LOW'), 'Should contain LOW');
  });

  it('formatConfidence should handle missing confidence', () => {
    const result = formatConfidence(null);
    assert.ok(result.includes('not specified'), 'Should indicate not specified');
  });

  it('formatConfidence should handle case insensitivity', () => {
    const resultLower = formatConfidence('high');
    const resultUpper = formatConfidence('HIGH');
    assert.ok(resultLower.includes('HIGH'), 'Should normalize to uppercase');
    assert.ok(resultUpper.includes('HIGH'), 'Should handle uppercase');
  });
});
