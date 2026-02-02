/**
 * Tests for lib/flags.js - CLI flag parsing
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseFlags } from '../lib/flags.js';

describe('parseFlags', () => {
  it('parses --claude flag', () => {
    const result = parseFlags(['--claude']);
    assert.deepStrictEqual(result, {
      runtime: 'claude',
      scope: null,
      uninstall: false,
      help: false,
      error: null
    });
  });

  it('parses --opencode flag', () => {
    const result = parseFlags(['--opencode']);
    assert.deepStrictEqual(result, {
      runtime: 'opencode',
      scope: null,
      uninstall: false,
      help: false,
      error: null
    });
  });

  it('parses --gemini flag', () => {
    const result = parseFlags(['--gemini']);
    assert.deepStrictEqual(result, {
      runtime: 'gemini',
      scope: null,
      uninstall: false,
      help: false,
      error: null
    });
  });

  it('parses --claude with --global', () => {
    const result = parseFlags(['--claude', '--global']);
    assert.deepStrictEqual(result, {
      runtime: 'claude',
      scope: 'global',
      uninstall: false,
      help: false,
      error: null
    });
  });

  it('parses --claude with --local', () => {
    const result = parseFlags(['--claude', '--local']);
    assert.deepStrictEqual(result, {
      runtime: 'claude',
      scope: 'local',
      uninstall: false,
      help: false,
      error: null
    });
  });

  it('parses --uninstall with --claude', () => {
    const result = parseFlags(['--uninstall', '--claude']);
    assert.deepStrictEqual(result, {
      runtime: 'claude',
      scope: null,
      uninstall: true,
      help: false,
      error: null
    });
  });

  it('parses short flag -c', () => {
    const result = parseFlags(['-c']);
    assert.deepStrictEqual(result, {
      runtime: 'claude',
      scope: null,
      uninstall: false,
      help: false,
      error: null
    });
  });

  it('parses short flag -o', () => {
    const result = parseFlags(['-o']);
    assert.deepStrictEqual(result, {
      runtime: 'opencode',
      scope: null,
      uninstall: false,
      help: false,
      error: null
    });
  });

  it('parses short flag -g for --global', () => {
    const result = parseFlags(['-c', '-g']);
    assert.deepStrictEqual(result, {
      runtime: 'claude',
      scope: 'global',
      uninstall: false,
      help: false,
      error: null
    });
  });

  it('parses short flag -u for --uninstall', () => {
    const result = parseFlags(['-u', '-c']);
    assert.deepStrictEqual(result, {
      runtime: 'claude',
      scope: null,
      uninstall: true,
      help: false,
      error: null
    });
  });

  it('parses --help flag', () => {
    const result = parseFlags(['--help']);
    assert.deepStrictEqual(result, {
      runtime: null,
      scope: null,
      uninstall: false,
      help: true,
      error: null
    });
  });

  it('parses short flag -h for --help', () => {
    const result = parseFlags(['-h']);
    assert.deepStrictEqual(result, {
      runtime: null,
      scope: null,
      uninstall: false,
      help: true,
      error: null
    });
  });

  it('handles no arguments (interactive mode trigger)', () => {
    const result = parseFlags([]);
    assert.deepStrictEqual(result, {
      runtime: null,
      scope: null,
      uninstall: false,
      help: false,
      error: null
    });
  });

  it('rejects multiple runtime flags', () => {
    const result = parseFlags(['--claude', '--opencode']);
    assert.strictEqual(result.error, 'Cannot specify multiple runtimes');
  });

  it('rejects --global and --local together', () => {
    const result = parseFlags(['--global', '--local']);
    assert.strictEqual(result.error, 'Cannot specify both --global and --local');
  });

  it('rejects unknown flags', () => {
    const result = parseFlags(['--unknown']);
    assert.ok(result.error);
    assert.ok(result.error.includes('unknown') || result.error.includes('Unknown'));
  });

  it('handles multiple short runtime flags as error', () => {
    const result = parseFlags(['-c', '-o']);
    assert.strictEqual(result.error, 'Cannot specify multiple runtimes');
  });
});
