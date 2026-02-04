/**
 * Tests for lib/approval-prompts.js - Approval workflow prompts
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseIndices,
  formatEditableDecision,
  parseEditedDecision
} from '../../lib/approval-prompts.js';

describe('parseIndices', () => {
  it('parses comma-separated indices correctly', () => {
    const result = parseIndices('1,3,5', 5);
    assert.deepStrictEqual(result, [0, 2, 4]);
  });

  it('handles spaces around commas', () => {
    const result = parseIndices('1, 3, 5', 5);
    assert.deepStrictEqual(result, [0, 2, 4]);
  });

  it('handles single index', () => {
    const result = parseIndices('2', 5);
    assert.deepStrictEqual(result, [1]);
  });

  it('filters out-of-range indices (too high)', () => {
    const result = parseIndices('1,3,10', 5);
    assert.deepStrictEqual(result, [0, 2]);
  });

  it('filters out-of-range indices (zero and negative)', () => {
    const result = parseIndices('0,1,-2,3', 5);
    assert.deepStrictEqual(result, [0, 2]);
  });

  it('handles non-numeric input gracefully', () => {
    const result = parseIndices('a,1,b,3', 5);
    assert.deepStrictEqual(result, [0, 2]);
  });

  it('returns empty array for empty input', () => {
    const result = parseIndices('', 5);
    assert.deepStrictEqual(result, []);
  });

  it('returns empty array for null input', () => {
    const result = parseIndices(null, 5);
    assert.deepStrictEqual(result, []);
  });

  it('returns empty array for undefined input', () => {
    const result = parseIndices(undefined, 5);
    assert.deepStrictEqual(result, []);
  });

  it('handles whitespace-only input', () => {
    const result = parseIndices('   ', 5);
    assert.deepStrictEqual(result, []);
  });

  it('handles trailing comma', () => {
    const result = parseIndices('1,2,', 5);
    assert.deepStrictEqual(result, [0, 1]);
  });
});

describe('formatEditableDecision', () => {
  const sampleDecision = {
    id: 'DEC-001',
    question: 'What database should we use?',
    choice: 'PostgreSQL',
    rationale: 'Battle-tested and feature-rich',
    confidence: 'HIGH',
    domain: 'Database'
  };

  it('includes instructional comments', () => {
    const result = formatEditableDecision(sampleDecision);
    assert.ok(result.includes('# Edit the decision below'));
    assert.ok(result.includes('# Decision ID: DEC-001'));
    assert.ok(result.includes('# Question: What database should we use?'));
    assert.ok(result.includes('# Save and close to accept changes'));
    assert.ok(result.includes('# To cancel, delete all JSON content'));
  });

  it('includes valid JSON', () => {
    const result = formatEditableDecision(sampleDecision);
    // Extract JSON portion (after the comments)
    const jsonPortion = result.split('\n').filter(line => !line.startsWith('#')).join('\n').trim();
    const parsed = JSON.parse(jsonPortion);
    assert.deepStrictEqual(parsed, sampleDecision);
  });

  it('handles missing id gracefully', () => {
    const result = formatEditableDecision({ question: 'Test?' });
    assert.ok(result.includes('# Decision ID: Unknown'));
  });

  it('handles missing question gracefully', () => {
    const result = formatEditableDecision({ id: 'DEC-002' });
    assert.ok(result.includes('# Question: Unknown'));
  });

  it('ends with newline', () => {
    const result = formatEditableDecision(sampleDecision);
    assert.ok(result.endsWith('\n'));
  });
});

describe('parseEditedDecision', () => {
  it('parses JSON correctly after removing comments', () => {
    const content = `# Edit the decision below
# Decision ID: DEC-001
# Question: What database should we use?
#
# Save and close to accept changes.

{
  "id": "DEC-001",
  "choice": "PostgreSQL"
}
`;
    const result = parseEditedDecision(content);
    assert.deepStrictEqual(result, { id: 'DEC-001', choice: 'PostgreSQL' });
  });

  it('handles comment lines with leading whitespace', () => {
    const content = `  # This is a comment
{
  "id": "DEC-002"
}
`;
    const result = parseEditedDecision(content);
    assert.deepStrictEqual(result, { id: 'DEC-002' });
  });

  it('returns null for empty content', () => {
    const result = parseEditedDecision('');
    assert.strictEqual(result, null);
  });

  it('returns null for null input', () => {
    const result = parseEditedDecision(null);
    assert.strictEqual(result, null);
  });

  it('returns null for only comments (cancelled edit)', () => {
    const content = `# User deleted the JSON content
# This means they cancelled
`;
    const result = parseEditedDecision(content);
    assert.strictEqual(result, null);
  });

  it('returns null for invalid JSON', () => {
    const content = `# Some comment
{ invalid json }
`;
    const result = parseEditedDecision(content);
    assert.strictEqual(result, null);
  });

  it('handles inline comments in JSON strings (valid JSON)', () => {
    // Note: # in a JSON string value should NOT be treated as a comment
    const content = `{
  "id": "DEC-001",
  "choice": "Use # in the choice"
}
`;
    const result = parseEditedDecision(content);
    assert.deepStrictEqual(result, { id: 'DEC-001', choice: 'Use # in the choice' });
  });
});

describe('formatEditableDecision + parseEditedDecision roundtrip', () => {
  it('roundtrips a decision correctly', () => {
    const original = {
      id: 'DEC-003',
      question: 'How should we handle auth?',
      choice: 'JWT tokens',
      rationale: 'Stateless and scalable',
      confidence: 'HIGH',
      alternatives_considered: ['Sessions', 'OAuth only'],
      domain: 'Authentication'
    };

    const formatted = formatEditableDecision(original);
    const parsed = parseEditedDecision(formatted);

    assert.deepStrictEqual(parsed, original);
  });

  it('handles special characters in values', () => {
    const original = {
      id: 'DEC-004',
      question: 'What about "quotes" and newlines?',
      choice: "Use 'single' and \"double\" quotes",
      rationale: 'Test special chars: \t\n',
      domain: 'Testing'
    };

    const formatted = formatEditableDecision(original);
    const parsed = parseEditedDecision(formatted);

    assert.deepStrictEqual(parsed, original);
  });
});
