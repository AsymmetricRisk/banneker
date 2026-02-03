/**
 * Smoke tests for full Banneker installation lifecycle
 * Tests REQ-CICD-004 (end-to-end install verification)
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { mkdirSync, cpSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolveInstallPaths } from '../../lib/paths.js';
import { VERSION, BANNEKER_FILES } from '../../lib/constants.js';

// Get package root for accessing templates
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..', '..');

describe('Full Install Smoke Test', () => {
  let tempDir;

  afterEach(async () => {
    // Clean up temp directory after each test
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  });

  it('should complete full install lifecycle in clean temp directory', async () => {
    // Create temp directory to act as fake home
    tempDir = await mkdtemp(join(tmpdir(), 'banneker-smoke-'));

    // Resolve paths using fake home directory
    const { commandsDir, configDir } = resolveInstallPaths('claude', 'global', tempDir);

    // Simulate full install flow (what installer.run() does):
    // 1. Create target directory
    mkdirSync(commandsDir, { recursive: true });

    // 2. Copy command template files
    const templatesDir = join(PACKAGE_ROOT, 'templates', 'commands');
    cpSync(templatesDir, commandsDir, {
      recursive: true,
      force: true,
      filter: (src) => !src.endsWith('.gitkeep')
    });

    // 3. Copy agent template files (if agents directory exists)
    const agentsTemplatesDir = join(PACKAGE_ROOT, 'templates', 'agents');
    if (existsSync(agentsTemplatesDir)) {
      const agentsDir = join(configDir, 'agents');
      mkdirSync(agentsDir, { recursive: true });
      cpSync(agentsTemplatesDir, agentsDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });
    }

    // 3b. Copy config template files (if config directory exists)
    const configTemplatesDir = join(PACKAGE_ROOT, 'templates', 'config');
    if (existsSync(configTemplatesDir)) {
      const configTargetDir = join(configDir, 'config');
      mkdirSync(configTargetDir, { recursive: true });
      cpSync(configTemplatesDir, configTargetDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });
    }

    // 4. Write VERSION file
    const versionPath = join(commandsDir, 'VERSION');
    writeFileSync(versionPath, VERSION + '\n', 'utf8');

    // VERIFY: Commands directory exists
    assert.ok(existsSync(commandsDir), 'Commands directory should exist');

    // VERIFY: VERSION file exists with correct content
    assert.ok(existsSync(versionPath), 'VERSION file should exist');
    const versionContent = await readFile(versionPath, 'utf8');
    assert.strictEqual(versionContent.trim(), VERSION, 'VERSION should match current version');

    // VERIFY: At least one .md file exists in commands
    const files = await readdir(commandsDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    assert.ok(mdFiles.length > 0, 'Should have at least one .md skill file');

    // VERIFY: All tracked files from BANNEKER_FILES manifest exist
    for (const file of BANNEKER_FILES) {
      // Agent files (agents/*) and config files (config/*) are relative to configDir
      // Other files are relative to commandsDir
      const filePath = (file.startsWith('agents/') || file.startsWith('config/'))
        ? join(configDir, file)
        : join(commandsDir, file);
      assert.ok(existsSync(filePath), `Tracked file ${file} should exist`);
    }

    // VERIFY: Specific expected command files exist
    assert.ok(existsSync(join(commandsDir, 'banneker-survey.md')), 'banneker-survey.md should exist');
    assert.ok(existsSync(join(commandsDir, 'banneker-help.md')), 'banneker-help.md should exist');
    assert.ok(existsSync(join(commandsDir, 'banneker-architect.md')), 'banneker-architect.md command should exist');
    assert.ok(existsSync(join(commandsDir, 'banneker-roadmap.md')), 'banneker-roadmap.md command should exist');
    assert.ok(existsSync(join(commandsDir, 'banneker-appendix.md')), 'banneker-appendix.md command should exist');

    // VERIFY: Command files have content (not empty)
    const surveyContent = await readFile(join(commandsDir, 'banneker-survey.md'), 'utf8');
    assert.ok(surveyContent.length > 0, 'banneker-survey.md should have content');

    const helpContent = await readFile(join(commandsDir, 'banneker-help.md'), 'utf8');
    assert.ok(helpContent.length > 0, 'banneker-help.md should have content');

    // VERIFY: Agents directory exists
    const agentsDir = join(configDir, 'agents');
    assert.ok(existsSync(agentsDir), 'Agents directory should exist');

    // VERIFY: Specific expected agent files exist
    assert.ok(existsSync(join(agentsDir, 'banneker-surveyor.md')), 'banneker-surveyor.md should exist');
    assert.ok(existsSync(join(agentsDir, 'banneker-architect.md')), 'banneker-architect.md agent should exist');
    assert.ok(existsSync(join(agentsDir, 'banneker-writer.md')), 'banneker-writer.md agent should exist');
    assert.ok(existsSync(join(agentsDir, 'banneker-diagrammer.md')), 'banneker-diagrammer.md agent should exist');
    assert.ok(existsSync(join(agentsDir, 'banneker-publisher.md')), 'banneker-publisher.md agent should exist');

    // VERIFY: Agent file has valid frontmatter with name field
    const surveyorContent = await readFile(join(agentsDir, 'banneker-surveyor.md'), 'utf8');
    assert.ok(surveyorContent.length > 0, 'banneker-surveyor.md should have content');
    assert.ok(surveyorContent.startsWith('---\n'), 'banneker-surveyor.md should have frontmatter');

    // Extract frontmatter and verify name field exists
    const lines = surveyorContent.split('\n');
    const closingIndex = lines.findIndex((line, i) => i > 0 && line === '---');
    assert.ok(closingIndex > 0, 'banneker-surveyor.md should have closing frontmatter delimiter');

    const frontmatter = lines.slice(1, closingIndex).join('\n');
    assert.ok(/^name:\s*/.test(frontmatter), 'banneker-surveyor.md should have name field in frontmatter');

    // VERIFY: Config directory exists and has expected files
    const configTargetDir = join(configDir, 'config');
    assert.ok(existsSync(configTargetDir), 'Config directory should exist');
    assert.ok(existsSync(join(configTargetDir, 'document-catalog.md')), 'document-catalog.md should exist in config directory');

    // VERIFY: Config file has content (not empty)
    const catalogContent = await readFile(join(configTargetDir, 'document-catalog.md'), 'utf8');
    assert.ok(catalogContent.length > 0, 'document-catalog.md should have content');
    assert.ok(catalogContent.includes('TECHNICAL-SUMMARY'), 'document-catalog.md should reference TECHNICAL-SUMMARY');
  });

  it('should install to correct directory for different runtimes', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'banneker-smoke-'));

    // Test Claude runtime
    const claudePaths = resolveInstallPaths('claude', 'global', tempDir);
    assert.ok(claudePaths.commandsDir.includes('.claude/commands'), 'Claude should use .claude/commands');

    // Test OpenCode runtime
    const opencodePaths = resolveInstallPaths('opencode', 'global', tempDir);
    assert.ok(opencodePaths.commandsDir.includes('.opencode/commands'), 'OpenCode should use .opencode/commands');

    // Test Gemini runtime
    const geminiPaths = resolveInstallPaths('gemini', 'global', tempDir);
    assert.ok(geminiPaths.commandsDir.includes('.gemini/commands'), 'Gemini should use .gemini/commands');
  });

  it('should handle multiple successive installs (overwrite scenario)', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'banneker-smoke-'));

    const { commandsDir } = resolveInstallPaths('claude', 'global', tempDir);

    // First install
    mkdirSync(commandsDir, { recursive: true });
    const templatesDir = join(PACKAGE_ROOT, 'templates', 'commands');
    cpSync(templatesDir, commandsDir, {
      recursive: true,
      force: true,
      filter: (src) => !src.endsWith('.gitkeep')
    });
    const versionPath = join(commandsDir, 'VERSION');
    writeFileSync(versionPath, '0.1.0\n', 'utf8');

    // Verify first install
    let versionContent = await readFile(versionPath, 'utf8');
    assert.strictEqual(versionContent.trim(), '0.1.0', 'First install should have 0.1.0');

    // Second install (overwrite)
    cpSync(templatesDir, commandsDir, {
      recursive: true,
      force: true,
      filter: (src) => !src.endsWith('.gitkeep')
    });
    writeFileSync(versionPath, VERSION + '\n', 'utf8');

    // Verify overwrite
    versionContent = await readFile(versionPath, 'utf8');
    assert.strictEqual(versionContent.trim(), VERSION, 'Second install should have current VERSION');

    // Verify files still exist
    assert.ok(existsSync(join(commandsDir, 'banneker-survey.md')), 'banneker-survey.md should still exist');
    assert.ok(existsSync(join(commandsDir, 'banneker-help.md')), 'banneker-help.md should still exist');
  });
});
