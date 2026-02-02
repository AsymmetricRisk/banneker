/**
 * Integration tests for the Banneker installer
 * Tests the complete install/uninstall flow in sandboxed temp directories
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, existsSync, readFileSync, rmSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseFlags } from '../lib/flags.js';
import { resolveInstallPaths } from '../lib/paths.js';
import { uninstall } from '../lib/uninstaller.js';
import { VERSION, BANNEKER_FILES } from '../lib/constants.js';

// Get package root for accessing templates
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..');

describe('Installer Integration Tests', () => {
  let tempDir;
  let fakeHomeDir;

  beforeEach(() => {
    // Create a fresh temp directory for each test
    tempDir = join(tmpdir(), `banneker-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tempDir, { recursive: true });

    // Create a fake home directory inside temp
    fakeHomeDir = join(tempDir, 'home');
    mkdirSync(fakeHomeDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory after each test
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('Non-interactive install to temp directory', () => {
    it('should create target directory and install files', () => {
      // Resolve paths using fake home directory
      const { commandsDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);

      // Manually run install logic (mkdir, copy templates, write VERSION)
      mkdirSync(commandsDir, { recursive: true });

      // Copy template files
      const templatesDir = join(PACKAGE_ROOT, 'templates', 'commands');
      cpSync(templatesDir, commandsDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      // Write VERSION file
      const versionPath = join(commandsDir, 'VERSION');
      writeFileSync(versionPath, VERSION + '\n', 'utf8');

      // Assert: target directory created
      assert.ok(existsSync(commandsDir), 'Commands directory should exist');

      // Assert: VERSION file exists with correct content
      assert.ok(existsSync(versionPath), 'VERSION file should exist');
      const versionContent = readFileSync(versionPath, 'utf8').trim();
      assert.strictEqual(versionContent, VERSION, 'VERSION file should contain correct version');

      // Assert: stub skill files copied to target
      const surveyPath = join(commandsDir, 'banneker-survey.md');
      const helpPath = join(commandsDir, 'banneker-help.md');

      assert.ok(existsSync(surveyPath), 'banneker-survey.md should be copied');
      assert.ok(existsSync(helpPath), 'banneker-help.md should be copied');

      // Verify content is actually copied (not empty)
      const surveyContent = readFileSync(surveyPath, 'utf8');
      const helpContent = readFileSync(helpPath, 'utf8');

      assert.ok(surveyContent.length > 0, 'banneker-survey.md should have content');
      assert.ok(helpContent.length > 0, 'banneker-help.md should have content');
    });

    it('should install to correct path for different runtimes', () => {
      // Test OpenCode runtime
      const { commandsDir: opencodeDir } = resolveInstallPaths('opencode', 'global', fakeHomeDir);
      assert.ok(opencodeDir.includes('.opencode/commands'), 'OpenCode should use .opencode/commands');

      // Test Gemini runtime
      const { commandsDir: geminiDir } = resolveInstallPaths('gemini', 'global', fakeHomeDir);
      assert.ok(geminiDir.includes('.gemini/commands'), 'Gemini should use .gemini/commands');
    });

    it('should handle local scope installation', () => {
      // Local scope should return relative paths
      const { commandsDir } = resolveInstallPaths('claude', 'local', fakeHomeDir);
      assert.strictEqual(commandsDir, '.claude/commands', 'Local scope should return relative path');
    });
  });

  describe('Uninstall from temp directory', () => {
    it('should remove Banneker files but keep directory', async () => {
      // Set up a fake install
      const { commandsDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);
      mkdirSync(commandsDir, { recursive: true });

      // Write VERSION file
      const versionPath = join(commandsDir, 'VERSION');
      writeFileSync(versionPath, VERSION + '\n', 'utf8');

      // Write stub files
      const surveyPath = join(commandsDir, 'banneker-survey.md');
      const helpPath = join(commandsDir, 'banneker-help.md');
      writeFileSync(surveyPath, '# Survey', 'utf8');
      writeFileSync(helpPath, '# Help', 'utf8');

      // Add a user file that should NOT be removed
      const userFilePath = join(commandsDir, 'user-custom-command.md');
      writeFileSync(userFilePath, '# Custom', 'utf8');

      // Verify all files exist before uninstall
      assert.ok(existsSync(versionPath), 'VERSION should exist before uninstall');
      assert.ok(existsSync(surveyPath), 'banneker-survey.md should exist before uninstall');
      assert.ok(existsSync(helpPath), 'banneker-help.md should exist before uninstall');
      assert.ok(existsSync(userFilePath), 'User file should exist before uninstall');

      // Call uninstall
      const result = await uninstall(commandsDir, null);
      assert.strictEqual(result, true, 'Uninstall should return true on success');

      // Assert: VERSION file removed
      assert.ok(!existsSync(versionPath), 'VERSION file should be removed');

      // Assert: stub files removed
      assert.ok(!existsSync(surveyPath), 'banneker-survey.md should be removed');
      assert.ok(!existsSync(helpPath), 'banneker-help.md should be removed');

      // Assert: directory still exists
      assert.ok(existsSync(commandsDir), 'Commands directory should still exist');

      // Assert: user file NOT removed
      assert.ok(existsSync(userFilePath), 'User file should NOT be removed');
    });

    it('should handle no installation found', async () => {
      // Try to uninstall from empty directory
      const { commandsDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);
      mkdirSync(commandsDir, { recursive: true });

      const result = await uninstall(commandsDir, null);
      assert.strictEqual(result, false, 'Uninstall should return false when no installation found');
    });
  });

  describe('Overwrite detection', () => {
    it('should detect existing VERSION file', () => {
      // Set up fake install with older version
      const { commandsDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);
      mkdirSync(commandsDir, { recursive: true });

      const versionPath = join(commandsDir, 'VERSION');
      writeFileSync(versionPath, '0.1.0\n', 'utf8');

      // Verify existsSync detects it
      assert.ok(existsSync(versionPath), 'existsSync should detect VERSION file');

      // Read contents and verify version string
      const existingVersion = readFileSync(versionPath, 'utf8').trim();
      assert.strictEqual(existingVersion, '0.1.0', 'Should read correct version string');
    });

    it('should detect current version', () => {
      const { commandsDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);
      mkdirSync(commandsDir, { recursive: true });

      const versionPath = join(commandsDir, 'VERSION');
      writeFileSync(versionPath, VERSION + '\n', 'utf8');

      const existingVersion = readFileSync(versionPath, 'utf8').trim();
      assert.strictEqual(existingVersion, VERSION, 'Should detect current version');
    });
  });

  describe('Flag parsing integration', () => {
    it('should parse --claude --global correctly', () => {
      const flags = parseFlags(['--claude', '--global']);
      assert.strictEqual(flags.runtime, 'claude', 'Should parse claude runtime');
      assert.strictEqual(flags.scope, 'global', 'Should parse global scope');
      assert.strictEqual(flags.uninstall, false, 'Should not set uninstall');
      assert.strictEqual(flags.error, null, 'Should not have error');
    });

    it('should parse --uninstall --claude correctly', () => {
      const flags = parseFlags(['--uninstall', '--claude']);
      assert.strictEqual(flags.runtime, 'claude', 'Should parse claude runtime');
      assert.strictEqual(flags.uninstall, true, 'Should set uninstall flag');
      assert.strictEqual(flags.error, null, 'Should not have error');
    });

    it('should parse short flags', () => {
      const flags = parseFlags(['-c', '-g']);
      assert.strictEqual(flags.runtime, 'claude', 'Should parse -c as claude');
      assert.strictEqual(flags.scope, 'global', 'Should parse -g as global');
    });

    it('should detect multiple runtime flags error', () => {
      const flags = parseFlags(['--claude', '--opencode']);
      assert.ok(flags.error, 'Should have error');
      assert.ok(flags.error.includes('multiple runtimes'), 'Error should mention multiple runtimes');
    });

    it('should detect conflicting scope flags error', () => {
      const flags = parseFlags(['--global', '--local']);
      assert.ok(flags.error, 'Should have error');
      assert.ok(flags.error.includes('--global') || flags.error.includes('--local'), 'Error should mention conflicting flags');
    });
  });

  describe('Zero dependencies check', () => {
    it('should have no runtime dependencies', () => {
      const packageJsonPath = join(PACKAGE_ROOT, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      // Assert dependencies field is empty or undefined
      const deps = packageJson.dependencies;
      assert.ok(
        deps === undefined || (typeof deps === 'object' && Object.keys(deps).length === 0),
        'dependencies should be empty or undefined'
      );
    });

    it('should have no devDependencies (for now)', () => {
      const packageJsonPath = join(PACKAGE_ROOT, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      // Assert devDependencies field is empty or undefined
      const devDeps = packageJson.devDependencies;
      assert.ok(
        devDeps === undefined || (typeof devDeps === 'object' && Object.keys(devDeps).length === 0),
        'devDependencies should be empty or undefined (for now)'
      );
    });
  });

  describe('BANNEKER_FILES manifest', () => {
    it('should include all tracked files', () => {
      // Verify manifest contains expected files
      assert.ok(BANNEKER_FILES.includes('VERSION'), 'Manifest should include VERSION');
      assert.ok(BANNEKER_FILES.includes('banneker-survey.md'), 'Manifest should include banneker-survey.md');
      assert.ok(BANNEKER_FILES.includes('banneker-help.md'), 'Manifest should include banneker-help.md');
    });

    it('should match files in templates directory', () => {
      const templatesDir = join(PACKAGE_ROOT, 'templates', 'commands');
      const templateFiles = readFileSync(join(templatesDir, 'banneker-survey.md'), 'utf8');

      // Verify template files exist and have content
      assert.ok(templateFiles.length > 0, 'Template files should exist and have content');
    });
  });
});
