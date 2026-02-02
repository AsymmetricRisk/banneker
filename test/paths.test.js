/**
 * Tests for lib/paths.js - Install path resolution
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resolveInstallPaths } from '../lib/paths.js';

describe('resolveInstallPaths', () => {
  const mockHomeDir = '/home/testuser';

  describe('claude runtime', () => {
    it('resolves global scope paths', () => {
      const result = resolveInstallPaths('claude', 'global', mockHomeDir);
      assert.deepStrictEqual(result, {
        commandsDir: '/home/testuser/.claude/commands',
        configDir: '/home/testuser/.claude'
      });
    });

    it('resolves local scope paths', () => {
      const result = resolveInstallPaths('claude', 'local', mockHomeDir);
      assert.deepStrictEqual(result, {
        commandsDir: '.claude/commands',
        configDir: '.claude'
      });
    });

    it('defaults to global scope when scope is null', () => {
      const result = resolveInstallPaths('claude', null, mockHomeDir);
      assert.deepStrictEqual(result, {
        commandsDir: '/home/testuser/.claude/commands',
        configDir: '/home/testuser/.claude'
      });
    });
  });

  describe('opencode runtime', () => {
    it('resolves global scope paths', () => {
      const result = resolveInstallPaths('opencode', 'global', mockHomeDir);
      assert.deepStrictEqual(result, {
        commandsDir: '/home/testuser/.opencode/commands',
        configDir: '/home/testuser/.opencode'
      });
    });

    it('resolves local scope paths', () => {
      const result = resolveInstallPaths('opencode', 'local', mockHomeDir);
      assert.deepStrictEqual(result, {
        commandsDir: '.opencode/commands',
        configDir: '.opencode'
      });
    });

    it('defaults to global scope when scope is null', () => {
      const result = resolveInstallPaths('opencode', null, mockHomeDir);
      assert.deepStrictEqual(result, {
        commandsDir: '/home/testuser/.opencode/commands',
        configDir: '/home/testuser/.opencode'
      });
    });
  });

  describe('gemini runtime', () => {
    it('resolves global scope paths', () => {
      const result = resolveInstallPaths('gemini', 'global', mockHomeDir);
      assert.deepStrictEqual(result, {
        commandsDir: '/home/testuser/.gemini/commands',
        configDir: '/home/testuser/.gemini'
      });
    });

    it('resolves local scope paths', () => {
      const result = resolveInstallPaths('gemini', 'local', mockHomeDir);
      assert.deepStrictEqual(result, {
        commandsDir: '.gemini/commands',
        configDir: '.gemini'
      });
    });

    it('defaults to global scope when scope is null', () => {
      const result = resolveInstallPaths('gemini', null, mockHomeDir);
      assert.deepStrictEqual(result, {
        commandsDir: '/home/testuser/.gemini/commands',
        configDir: '/home/testuser/.gemini'
      });
    });
  });

  describe('error handling', () => {
    it('throws error for invalid runtime', () => {
      assert.throws(
        () => resolveInstallPaths('invalid', 'global', mockHomeDir),
        /Invalid runtime/
      );
    });

    it('throws error for undefined runtime', () => {
      assert.throws(
        () => resolveInstallPaths(undefined, 'global', mockHomeDir),
        /Invalid runtime/
      );
    });
  });

  describe('uses os.homedir() by default', () => {
    it('resolves paths without explicit homeDir parameter', () => {
      // This test verifies the function works without mocking homeDir
      // Just verify it returns object with expected structure
      const result = resolveInstallPaths('claude', 'global');
      assert.ok(result.commandsDir);
      assert.ok(result.configDir);
      assert.ok(result.commandsDir.includes('.claude/commands'));
      assert.ok(result.configDir.includes('.claude'));
    });
  });
});
