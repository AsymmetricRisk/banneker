/**
 * Integration tests for skill file YAML frontmatter validation
 * Tests REQ-CICD-003 (YAML frontmatter validation for all skill files)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..', '..');

describe('Skill File YAML Frontmatter Validation', () => {
  it('should find skill template files', async () => {
    const templatesDir = join(PACKAGE_ROOT, 'templates', 'commands');
    const files = await readdir(templatesDir);

    // Filter for .md files (skip .gitkeep)
    const skillFiles = files.filter(f => f.endsWith('.md'));

    assert.ok(skillFiles.length > 0, 'Should have at least one skill template file');
  });

  it('should validate all skill files have YAML frontmatter with required fields', async () => {
    const templatesDir = join(PACKAGE_ROOT, 'templates', 'commands');
    const files = await readdir(templatesDir);

    // Filter for .md files
    const skillFiles = files.filter(f => f.endsWith('.md'));

    // Test each skill file
    for (const file of skillFiles) {
      const filePath = join(templatesDir, file);
      const content = await readFile(filePath, 'utf8');

      // Assert: file starts with frontmatter delimiter
      assert.ok(
        content.startsWith('---\n'),
        `${file} should start with YAML frontmatter delimiter (---)`
      );

      // Find the closing delimiter
      const lines = content.split('\n');
      let closingIndex = -1;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '---') {
          closingIndex = i;
          break;
        }
      }

      assert.ok(
        closingIndex > 0,
        `${file} should have closing frontmatter delimiter (---)`
      );

      // Extract frontmatter content (between delimiters)
      const frontmatterLines = lines.slice(1, closingIndex);
      const frontmatter = frontmatterLines.join('\n');

      // Assert: frontmatter has 'name' field
      assert.ok(
        /^name:\s*".+"$/m.test(frontmatter) || /^name:\s*'.+'$/m.test(frontmatter) || /^name:\s+\S+$/m.test(frontmatter),
        `${file} should have 'name' field in frontmatter`
      );

      // Assert: frontmatter has 'description' field
      assert.ok(
        /^description:\s*".+"$/m.test(frontmatter) || /^description:\s*'.+'$/m.test(frontmatter) || /^description:\s+\S+$/m.test(frontmatter),
        `${file} should have 'description' field in frontmatter`
      );
    }
  });

  it('should have valid YAML frontmatter structure in banneker-survey.md', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'commands', 'banneker-survey.md');
    const content = await readFile(filePath, 'utf8');

    // Verify structure
    assert.ok(content.startsWith('---\n'), 'Should start with ---');

    const lines = content.split('\n');
    assert.strictEqual(lines[0], '---', 'First line should be ---');

    // Find closing delimiter
    const closingIndex = lines.findIndex((line, i) => i > 0 && line === '---');
    assert.ok(closingIndex > 0, 'Should have closing ---');

    // Verify content after frontmatter exists
    const afterFrontmatter = lines.slice(closingIndex + 1).join('\n').trim();
    assert.ok(afterFrontmatter.length > 0, 'Should have content after frontmatter');
  });

  it('should have valid YAML frontmatter structure in banneker-help.md', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'commands', 'banneker-help.md');
    const content = await readFile(filePath, 'utf8');

    // Verify structure
    assert.ok(content.startsWith('---\n'), 'Should start with ---');

    const lines = content.split('\n');
    assert.strictEqual(lines[0], '---', 'First line should be ---');

    // Find closing delimiter
    const closingIndex = lines.findIndex((line, i) => i > 0 && line === '---');
    assert.ok(closingIndex > 0, 'Should have closing ---');

    // Verify content after frontmatter exists
    const afterFrontmatter = lines.slice(closingIndex + 1).join('\n').trim();
    assert.ok(afterFrontmatter.length > 0, 'Should have content after frontmatter');
  });

  it('should have agent template files', async () => {
    const agentsDir = join(PACKAGE_ROOT, 'templates', 'agents');
    const files = await readdir(agentsDir);
    const agentFiles = files.filter(f => f.endsWith('.md'));
    assert.ok(agentFiles.length > 0, 'Should have at least one agent template file');
  });

  it('should validate all agent files have YAML frontmatter with required fields', async () => {
    const agentsDir = join(PACKAGE_ROOT, 'templates', 'agents');
    const files = await readdir(agentsDir);
    const agentFiles = files.filter(f => f.endsWith('.md'));

    for (const file of agentFiles) {
      const filePath = join(agentsDir, file);
      const content = await readFile(filePath, 'utf8');

      // Assert: file starts with frontmatter delimiter
      assert.ok(
        content.startsWith('---\n'),
        `${file} should start with YAML frontmatter delimiter (---)`
      );

      // Find the closing delimiter
      const lines = content.split('\n');
      let closingIndex = -1;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '---') {
          closingIndex = i;
          break;
        }
      }

      assert.ok(
        closingIndex > 0,
        `${file} should have closing frontmatter delimiter (---)`
      );

      // Extract frontmatter content
      const frontmatterLines = lines.slice(1, closingIndex);
      const frontmatter = frontmatterLines.join('\n');

      // Assert: frontmatter has 'name' field
      assert.ok(
        /^name:\s*".+"$/m.test(frontmatter) || /^name:\s*'.+'$/m.test(frontmatter) || /^name:\s+\S+$/m.test(frontmatter),
        `${file} should have 'name' field in frontmatter`
      );

      // Assert: frontmatter has 'description' field
      const hasDescription = /^description:\s*".+"$/m.test(frontmatter) || /^description:\s*'.+'$/m.test(frontmatter) || /^description:\s+\S+$/m.test(frontmatter);
      assert.ok(hasDescription, `${file} should have 'description' field in frontmatter`);

      // Extract description value to check length
      const descMatch = frontmatter.match(/^description:\s*"([^"]+)"/m) ||
                        frontmatter.match(/^description:\s*'([^']+)'/m) ||
                        frontmatter.match(/^description:\s+(.+)$/m);
      if (descMatch) {
        const description = descMatch[1].trim();
        assert.ok(
          description.length > 20,
          `${file} description should be meaningful (>20 chars), got ${description.length} chars`
        );
      }
    }
  });

  it('should validate banneker-surveyor.md references all 6 phases', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'agents', 'banneker-surveyor.md');
    const content = await readFile(filePath, 'utf8');

    // Verify it mentions all 6 phases
    const phases = ['pitch', 'actors', 'walkthroughs', 'backend', 'gaps', 'decision'];
    for (const phase of phases) {
      assert.ok(
        content.toLowerCase().includes(phase),
        `banneker-surveyor.md should mention phase: ${phase}`
      );
    }

    // Verify it mentions state management
    assert.ok(
      content.includes('survey-state.md'),
      'banneker-surveyor.md should mention survey-state.md for state management'
    );

    // Verify it mentions output files
    assert.ok(
      content.includes('survey.json'),
      'banneker-surveyor.md should mention survey.json output'
    );
    assert.ok(
      content.includes('architecture-decisions.json'),
      'banneker-surveyor.md should mention architecture-decisions.json output'
    );
  });

  it('should validate banneker-survey.md is no longer a stub and references surveyor', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'commands', 'banneker-survey.md');
    const content = await readFile(filePath, 'utf8');

    // Verify it's not a stub
    const lowercaseContent = content.toLowerCase();
    assert.ok(
      !lowercaseContent.includes('placeholder') && !lowercaseContent.includes('stub'),
      'banneker-survey.md should not contain placeholder or stub references'
    );

    // Verify it mentions the surveyor agent
    assert.ok(
      content.includes('banneker-surveyor'),
      'banneker-survey.md should reference banneker-surveyor agent'
    );

    // Verify it mentions resume detection
    assert.ok(
      content.includes('survey-state.md'),
      'banneker-survey.md should mention survey-state.md for resume detection'
    );
  });

  it('should validate banneker-architect agent has valid frontmatter', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'agents', 'banneker-architect.md');
    const content = await readFile(filePath, 'utf8');

    // Verify frontmatter structure
    assert.ok(content.startsWith('---\n'), 'banneker-architect.md should start with frontmatter');

    const lines = content.split('\n');
    const closingIndex = lines.findIndex((line, i) => i > 0 && line === '---');
    assert.ok(closingIndex > 0, 'banneker-architect.md should have closing frontmatter delimiter');

    const frontmatter = lines.slice(1, closingIndex).join('\n');

    // Verify name field matches expected value
    assert.ok(/^name:\s*banneker-architect$/m.test(frontmatter), 'banneker-architect.md should have name: banneker-architect');

    // Verify description field exists and is meaningful
    const hasDescription = /^description:\s*".+"$/m.test(frontmatter);
    assert.ok(hasDescription, 'banneker-architect.md should have description field');
  });

  it('should validate banneker-writer agent has valid frontmatter', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'agents', 'banneker-writer.md');
    const content = await readFile(filePath, 'utf8');

    // Verify frontmatter structure
    assert.ok(content.startsWith('---\n'), 'banneker-writer.md should start with frontmatter');

    const lines = content.split('\n');
    const closingIndex = lines.findIndex((line, i) => i > 0 && line === '---');
    assert.ok(closingIndex > 0, 'banneker-writer.md should have closing frontmatter delimiter');

    const frontmatter = lines.slice(1, closingIndex).join('\n');

    // Verify name field matches expected value
    assert.ok(/^name:\s*banneker-writer$/m.test(frontmatter), 'banneker-writer.md should have name: banneker-writer');

    // Verify description field exists and is meaningful
    const hasDescription = /^description:\s*".+"$/m.test(frontmatter);
    assert.ok(hasDescription, 'banneker-writer.md should have description field');
  });

  it('should validate banneker-architect command has valid frontmatter', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'commands', 'banneker-architect.md');
    const content = await readFile(filePath, 'utf8');

    // Verify frontmatter structure
    assert.ok(content.startsWith('---\n'), 'banneker-architect command should start with frontmatter');

    const lines = content.split('\n');
    const closingIndex = lines.findIndex((line, i) => i > 0 && line === '---');
    assert.ok(closingIndex > 0, 'banneker-architect command should have closing frontmatter delimiter');

    const frontmatter = lines.slice(1, closingIndex).join('\n');

    // Verify name field matches expected value
    assert.ok(/^name:\s*banneker-architect$/m.test(frontmatter), 'banneker-architect command should have name: banneker-architect');

    // Verify description field exists and is meaningful
    const hasDescription = /^description:\s*".+"$/m.test(frontmatter);
    assert.ok(hasDescription, 'banneker-architect command should have description field');
  });

  it('should validate document-catalog.md config file exists and has expected content', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'config', 'document-catalog.md');
    const content = await readFile(filePath, 'utf8');

    // Config files do NOT have frontmatter (unlike agent and command files)
    assert.ok(!content.startsWith('---\n'), 'document-catalog.md should NOT start with frontmatter (it is a config file)');

    // Verify it contains expected section headers
    assert.ok(content.includes('# Document Catalog'), 'document-catalog.md should have Document Catalog heading');

    // Verify it mentions TECHNICAL-SUMMARY (a key always-generated document)
    assert.ok(content.includes('TECHNICAL-SUMMARY'), 'document-catalog.md should reference TECHNICAL-SUMMARY document');

    // Verify it has document structure guidance
    assert.ok(content.includes('Section Structure') || content.includes('Structure'), 'document-catalog.md should have section structure information');
  });

  it('should validate banneker-roadmap command has valid frontmatter', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'commands', 'banneker-roadmap.md');
    const content = await readFile(filePath, 'utf8');

    // Verify frontmatter structure
    assert.ok(content.startsWith('---\n'), 'banneker-roadmap command should start with frontmatter');

    const lines = content.split('\n');
    const closingIndex = lines.findIndex((line, i) => i > 0 && line === '---');
    assert.ok(closingIndex > 0, 'banneker-roadmap command should have closing frontmatter delimiter');

    const frontmatter = lines.slice(1, closingIndex).join('\n');

    // Verify name field matches expected value
    assert.ok(/^name:\s*banneker-roadmap$/m.test(frontmatter), 'banneker-roadmap command should have name: banneker-roadmap');

    // Verify description field exists and is meaningful
    const hasDescription = /^description:\s*".+"$/m.test(frontmatter);
    assert.ok(hasDescription, 'banneker-roadmap command should have description field');
  });

  it('should validate banneker-diagrammer agent has valid frontmatter', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'agents', 'banneker-diagrammer.md');
    const content = await readFile(filePath, 'utf8');

    // Verify frontmatter structure
    assert.ok(content.startsWith('---\n'), 'banneker-diagrammer agent should start with frontmatter');

    const lines = content.split('\n');
    const closingIndex = lines.findIndex((line, i) => i > 0 && line === '---');
    assert.ok(closingIndex > 0, 'banneker-diagrammer agent should have closing frontmatter delimiter');

    const frontmatter = lines.slice(1, closingIndex).join('\n');

    // Verify name field matches expected value
    assert.ok(/^name:\s*banneker-diagrammer$/m.test(frontmatter), 'banneker-diagrammer agent should have name: banneker-diagrammer');

    // Verify description field exists and is meaningful
    const hasDescription = /^description:\s*".+"$/m.test(frontmatter);
    assert.ok(hasDescription, 'banneker-diagrammer agent should have description field');
  });

  it('should validate banneker-appendix command has valid frontmatter', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'commands', 'banneker-appendix.md');
    const content = await readFile(filePath, 'utf8');

    // Verify frontmatter structure
    assert.ok(content.startsWith('---\n'), 'banneker-appendix command should start with frontmatter');

    const lines = content.split('\n');
    const closingIndex = lines.findIndex((line, i) => i > 0 && line === '---');
    assert.ok(closingIndex > 0, 'banneker-appendix command should have closing frontmatter delimiter');

    const frontmatter = lines.slice(1, closingIndex).join('\n');

    // Verify name field matches expected value
    assert.ok(/^name:\s*banneker-appendix$/m.test(frontmatter), 'banneker-appendix command should have name: banneker-appendix');

    // Verify description field exists and is meaningful
    const hasDescription = /^description:\s*".+"$/m.test(frontmatter);
    assert.ok(hasDescription, 'banneker-appendix command should have description field');
  });

  it('should validate banneker-publisher agent has valid frontmatter', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'agents', 'banneker-publisher.md');
    const content = await readFile(filePath, 'utf8');

    // Verify frontmatter structure
    assert.ok(content.startsWith('---\n'), 'banneker-publisher agent should start with frontmatter');

    const lines = content.split('\n');
    const closingIndex = lines.findIndex((line, i) => i > 0 && line === '---');
    assert.ok(closingIndex > 0, 'banneker-publisher agent should have closing frontmatter delimiter');

    const frontmatter = lines.slice(1, closingIndex).join('\n');

    // Verify name field matches expected value
    assert.ok(/^name:\s*banneker-publisher$/m.test(frontmatter), 'banneker-publisher agent should have name: banneker-publisher');

    // Verify description field exists and is meaningful
    const hasDescription = /^description:\s*".+"$/m.test(frontmatter);
    assert.ok(hasDescription, 'banneker-publisher agent should have description field');
  });

  it('should validate banneker-feed command has valid frontmatter', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'commands', 'banneker-feed.md');
    const content = await readFile(filePath, 'utf8');

    // Verify frontmatter structure
    assert.ok(content.startsWith('---\n'), 'banneker-feed command should start with frontmatter');

    const lines = content.split('\n');
    const closingIndex = lines.findIndex((line, i) => i > 0 && line === '---');
    assert.ok(closingIndex > 0, 'banneker-feed command should have closing frontmatter delimiter');

    const frontmatter = lines.slice(1, closingIndex).join('\n');

    // Verify name field matches expected value
    assert.ok(/^name:\s*banneker-feed$/m.test(frontmatter), 'banneker-feed command should have name: banneker-feed');

    // Verify description field exists and is meaningful
    const hasDescription = /^description:\s*".+"$/m.test(frontmatter);
    assert.ok(hasDescription, 'banneker-feed command should have description field');
  });

  it('should validate banneker-exporter agent has valid frontmatter', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'agents', 'banneker-exporter.md');
    const content = await readFile(filePath, 'utf8');

    // Verify frontmatter structure
    assert.ok(content.startsWith('---\n'), 'banneker-exporter agent should start with frontmatter');

    const lines = content.split('\n');
    const closingIndex = lines.findIndex((line, i) => i > 0 && line === '---');
    assert.ok(closingIndex > 0, 'banneker-exporter agent should have closing frontmatter delimiter');

    const frontmatter = lines.slice(1, closingIndex).join('\n');

    // Verify name field matches expected value
    assert.ok(/^name:\s*banneker-exporter$/m.test(frontmatter), 'banneker-exporter agent should have name: banneker-exporter');

    // Verify description field exists and is meaningful
    const hasDescription = /^description:\s*".+"$/m.test(frontmatter);
    assert.ok(hasDescription, 'banneker-exporter agent should have description field');
  });

  it('should validate framework-adapters.md config file exists and has expected content', async () => {
    const filePath = join(PACKAGE_ROOT, 'templates', 'config', 'framework-adapters.md');
    const content = await readFile(filePath, 'utf8');

    // Config files do NOT have frontmatter (unlike agent and command files)
    assert.ok(!content.startsWith('---\n'), 'framework-adapters.md should NOT start with frontmatter (it is a config file)');

    // Verify it contains expected section headers
    assert.ok(content.includes('# Framework Adapters'), 'framework-adapters.md should have Framework Adapters heading');

    // Verify it has adapter configurations
    assert.ok(content.includes('GSD Adapter') || content.includes('GSD'), 'framework-adapters.md should reference GSD adapter');

    // Verify non-empty
    assert.ok(content.trim().length > 0, 'framework-adapters.md should have content');
  });
});
