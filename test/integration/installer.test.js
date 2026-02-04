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
import { parseFlags } from '../../lib/flags.js';
import { resolveInstallPaths } from '../../lib/paths.js';
import { uninstall } from '../../lib/uninstaller.js';
import { VERSION, BANNEKER_FILES } from '../../lib/constants.js';

// Get package root for accessing templates
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..', '..');

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

    it('should allow build-time devDependencies only', () => {
      const packageJsonPath = join(PACKAGE_ROOT, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      // devDependencies are OK for build-time tooling (e.g., auto-changelog)
      // but runtime dependencies should be zero
      const devDeps = packageJson.devDependencies;

      // If devDependencies exist, verify they're build-time only (not shipped to users)
      if (devDeps && typeof devDeps === 'object') {
        // Allow known build-time dependencies
        const allowedDevDeps = ['auto-changelog'];
        const actualDevDeps = Object.keys(devDeps);

        for (const dep of actualDevDeps) {
          assert.ok(
            allowedDevDeps.includes(dep),
            `devDependency ${dep} should be in allowed list (build-time only)`
          );
        }
      }
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

  describe('Engineer command installation', () => {
    it('should copy banneker-engineer.md to commands directory', () => {
      // Resolve paths using fake home directory
      const { commandsDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);

      // Manually run install logic (mkdir, copy templates)
      mkdirSync(commandsDir, { recursive: true });

      // Copy template files
      const templatesDir = join(PACKAGE_ROOT, 'templates', 'commands');
      cpSync(templatesDir, commandsDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      // Assert: banneker-engineer.md copied to target
      const targetPath = join(commandsDir, 'banneker-engineer.md');
      assert.ok(existsSync(targetPath), 'banneker-engineer.md should be copied to commands directory');
    });

    it('banneker-engineer.md should contain expected sections', () => {
      // Resolve paths using fake home directory
      const { commandsDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);

      // Manually run install logic
      mkdirSync(commandsDir, { recursive: true });

      const templatesDir = join(PACKAGE_ROOT, 'templates', 'commands');
      cpSync(templatesDir, commandsDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      // Read and verify content
      const targetPath = join(commandsDir, 'banneker-engineer.md');
      const content = readFileSync(targetPath, 'utf8');

      // Verify key content sections
      assert.ok(content.includes('banneker-engineer'), 'Should contain banneker-engineer command name');
      assert.ok(content.includes('survey.json'), 'Should reference survey.json');
      assert.ok(content.includes('DIAGNOSIS.md'), 'Should reference DIAGNOSIS.md');
      assert.ok(content.includes('RECOMMENDATION.md'), 'Should reference RECOMMENDATION.md');
      assert.ok(content.includes('ENGINEERING-PROPOSAL.md'), 'Should reference ENGINEERING-PROPOSAL.md');
    });
  });

  describe('Engineer agent installation', () => {
    it('should copy banneker-engineer.md to agents directory', () => {
      // Resolve paths using fake home directory
      const { configDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);
      const agentsDir = join(configDir, 'agents');

      // Manually run install logic
      mkdirSync(agentsDir, { recursive: true });

      const agentsTemplatesDir = join(PACKAGE_ROOT, 'templates', 'agents');
      cpSync(agentsTemplatesDir, agentsDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      // Assert: banneker-engineer.md copied to agents directory
      const targetPath = join(agentsDir, 'banneker-engineer.md');
      assert.ok(existsSync(targetPath), 'banneker-engineer.md should be copied to agents directory');
    });

    it('banneker-engineer.md agent should contain expected sections', () => {
      // Resolve paths using fake home directory
      const { configDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);
      const agentsDir = join(configDir, 'agents');

      // Manually run install logic
      mkdirSync(agentsDir, { recursive: true });

      const agentsTemplatesDir = join(PACKAGE_ROOT, 'templates', 'agents');
      cpSync(agentsTemplatesDir, agentsDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      // Read and verify content
      const targetPath = join(agentsDir, 'banneker-engineer.md');
      const content = readFileSync(targetPath, 'utf8');

      // Verify key content sections
      assert.ok(content.includes('Banneker Engineer'), 'Should contain Banneker Engineer title');
      assert.ok(content.includes('survey.json'), 'Should reference survey.json');
      assert.ok(content.includes('engineer-state.md'), 'Should reference engineer-state.md');
      assert.ok(content.includes('confidence'), 'Should reference confidence system');
    });
  });

  describe('Engineering catalog installation', () => {
    it('should copy engineering-catalog.md to config directory', () => {
      // Resolve paths using fake home directory
      const { configDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);
      const configTargetDir = join(configDir, 'config');

      // Manually run install logic
      mkdirSync(configTargetDir, { recursive: true });

      const configTemplatesDir = join(PACKAGE_ROOT, 'templates', 'config');
      cpSync(configTemplatesDir, configTargetDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      // Assert: engineering-catalog.md copied to config directory
      const targetPath = join(configTargetDir, 'engineering-catalog.md');
      assert.ok(existsSync(targetPath), 'engineering-catalog.md should be copied to config directory');
    });

    it('engineering-catalog.md should define three documents', () => {
      // Resolve paths using fake home directory
      const { configDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);
      const configTargetDir = join(configDir, 'config');

      // Manually run install logic
      mkdirSync(configTargetDir, { recursive: true });

      const configTemplatesDir = join(PACKAGE_ROOT, 'templates', 'config');
      cpSync(configTemplatesDir, configTargetDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      // Read and verify content
      const targetPath = join(configTargetDir, 'engineering-catalog.md');
      const content = readFileSync(targetPath, 'utf8');

      // Verify three document definitions
      assert.ok(content.includes('DIAGNOSIS.md'), 'Should define DIAGNOSIS.md');
      assert.ok(content.includes('RECOMMENDATION.md'), 'Should define RECOMMENDATION.md');
      assert.ok(content.includes('ENGINEERING-PROPOSAL.md'), 'Should define ENGINEERING-PROPOSAL.md');

      // Verify confidence levels mentioned
      assert.ok(
        content.match(/HIGH.*MEDIUM.*LOW|confidence/i),
        'Should reference confidence levels (HIGH/MEDIUM/LOW)'
      );
    });
  });

  describe('Approve command installation', () => {
    it('should copy banneker-approve.md to commands directory', () => {
      // Resolve paths using fake home directory
      const { commandsDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);

      // Manually run install logic (mkdir, copy templates)
      mkdirSync(commandsDir, { recursive: true });

      // Copy template files
      const templatesDir = join(PACKAGE_ROOT, 'templates', 'commands');
      cpSync(templatesDir, commandsDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      // Assert: banneker-approve.md copied to target
      const approveFile = join(commandsDir, 'banneker-approve.md');
      assert.ok(existsSync(approveFile), 'banneker-approve.md should exist');
    });

    it('should contain valid YAML frontmatter', () => {
      // Resolve paths using fake home directory
      const { commandsDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);

      // Manually run install logic
      mkdirSync(commandsDir, { recursive: true });

      const templatesDir = join(PACKAGE_ROOT, 'templates', 'commands');
      cpSync(templatesDir, commandsDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      // Read and verify content
      const approveFile = join(commandsDir, 'banneker-approve.md');
      const content = readFileSync(approveFile, 'utf8');

      // Check frontmatter structure
      assert.ok(content.startsWith('---'), 'Should start with YAML frontmatter');
      assert.ok(content.includes('name: banneker-approve'), 'Should have correct name');
      assert.ok(content.includes('description:'), 'Should have description');
    });
  });

  describe('Surveyor agent installation (Phase 14)', () => {
    it('should copy banneker-surveyor.md to agents directory', () => {
      // Resolve paths using fake home directory
      const { configDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);
      const agentsDir = join(configDir, 'agents');

      // Manually run install logic
      mkdirSync(agentsDir, { recursive: true });

      const agentsTemplatesDir = join(PACKAGE_ROOT, 'templates', 'agents');
      cpSync(agentsTemplatesDir, agentsDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      // Assert: banneker-surveyor.md copied to agents directory
      const targetPath = join(agentsDir, 'banneker-surveyor.md');
      assert.ok(existsSync(targetPath), 'banneker-surveyor.md should be copied to agents directory');
    });

    it('should install surveyor agent with cliff detection protocol', () => {
      // Resolve paths using fake home directory
      const { configDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);
      const agentsDir = join(configDir, 'agents');

      // Manually run install logic
      mkdirSync(agentsDir, { recursive: true });

      const agentsTemplatesDir = join(PACKAGE_ROOT, 'templates', 'agents');
      cpSync(agentsTemplatesDir, agentsDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      const surveyorPath = join(agentsDir, 'banneker-surveyor.md');
      const content = readFileSync(surveyorPath, 'utf8');

      // Verify cliff detection protocol sections exist
      assert.ok(content.includes('## Cliff Detection Protocol'),
        'Surveyor should have Cliff Detection Protocol section');
      assert.ok(content.includes('## Cliff Tracking State Management'),
        'Surveyor should have Cliff Tracking State Management section');
      assert.ok(content.includes('## Mode Switch Execution Protocol'),
        'Surveyor should have Mode Switch Execution Protocol section');
    });

    it('should include cliff tracking state fields in surveyor', () => {
      // Resolve paths using fake home directory
      const { configDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);
      const agentsDir = join(configDir, 'agents');

      // Manually run install logic
      mkdirSync(agentsDir, { recursive: true });

      const agentsTemplatesDir = join(PACKAGE_ROOT, 'templates', 'agents');
      cpSync(agentsTemplatesDir, agentsDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      const surveyorPath = join(agentsDir, 'banneker-surveyor.md');
      const content = readFileSync(surveyorPath, 'utf8');

      // Verify state fields documented
      assert.ok(content.includes('pendingOffer'),
        'Surveyor should document pendingOffer state field');
      assert.ok(content.includes('declinedOffers'),
        'Surveyor should document declinedOffers state field');
      assert.ok(content.includes('cliffSignals'),
        'Surveyor should document cliffSignals state field');
      assert.ok(content.includes('deferredQuestions'),
        'Surveyor should document deferredQuestions state field');
    });

    it('should include phase boundary cliff checks in surveyor', () => {
      // Resolve paths using fake home directory
      const { configDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);
      const agentsDir = join(configDir, 'agents');

      // Manually run install logic
      mkdirSync(agentsDir, { recursive: true });

      const agentsTemplatesDir = join(PACKAGE_ROOT, 'templates', 'agents');
      cpSync(agentsTemplatesDir, agentsDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      const surveyorPath = join(agentsDir, 'banneker-surveyor.md');
      const content = readFileSync(surveyorPath, 'utf8');

      // Verify cliff detection checks at phase boundaries
      const cliffCheckCount = (content.match(/Cliff detection check:/g) || []).length;
      assert.ok(cliffCheckCount >= 5,
        `Surveyor should have cliff detection checks for phases 1-5, found ${cliffCheckCount}`);
    });

    it('should include surveyor-context.md documentation', () => {
      // Resolve paths using fake home directory
      const { configDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);
      const agentsDir = join(configDir, 'agents');

      // Manually run install logic
      mkdirSync(agentsDir, { recursive: true });

      const agentsTemplatesDir = join(PACKAGE_ROOT, 'templates', 'agents');
      cpSync(agentsTemplatesDir, agentsDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      const surveyorPath = join(agentsDir, 'banneker-surveyor.md');
      const content = readFileSync(surveyorPath, 'utf8');

      // Verify context handoff file documentation
      assert.ok(content.includes('surveyor-context.md'),
        'Surveyor should document surveyor-context.md handoff file');
      assert.ok(content.includes('User Preferences Observed'),
        'Surveyor should document preference extraction in context handoff');
    });
  });

  describe('Cliff detection config installation', () => {
    it('copies cliff-detection-signals.md to config directory', () => {
      // Resolve paths using fake home directory
      const { configDir } = resolveInstallPaths('claude', 'global', fakeHomeDir);
      const configTargetDir = join(configDir, 'config');

      // Manually run install logic
      mkdirSync(configTargetDir, { recursive: true });

      const configTemplatesDir = join(PACKAGE_ROOT, 'templates', 'config');
      cpSync(configTemplatesDir, configTargetDir, {
        recursive: true,
        force: true,
        filter: (src) => !src.endsWith('.gitkeep')
      });

      // Assert: cliff-detection-signals.md copied to config directory
      const targetFile = join(configTargetDir, 'cliff-detection-signals.md');
      assert.ok(existsSync(targetFile), 'cliff-detection-signals.md should be copied');
    });

    it('cliff-detection-signals.md contains explicit signal list', () => {
      const sourceFile = join(PACKAGE_ROOT, 'templates', 'config', 'cliff-detection-signals.md');
      const content = readFileSync(sourceFile, 'utf8');

      assert.ok(content.includes('EXPLICIT_CLIFF_SIGNALS'), 'Should contain signal list constant');
      assert.ok(content.includes("i don't know"), 'Should contain "i don\'t know" signal');
      assert.ok(content.includes("whatever you think"), 'Should contain "whatever you think" signal');
      assert.ok(content.includes("you decide"), 'Should contain "you decide" signal');
    });

    it('cliff-detection-signals.md has valid frontmatter', () => {
      const sourceFile = join(PACKAGE_ROOT, 'templates', 'config', 'cliff-detection-signals.md');
      const content = readFileSync(sourceFile, 'utf8');

      assert.ok(content.startsWith('---'), 'Should start with frontmatter delimiter');
      assert.ok(content.includes('name: cliff-detection-signals'), 'Should have name in frontmatter');
      assert.ok(content.includes('version:'), 'Should have version in frontmatter');
    });
  });
});
