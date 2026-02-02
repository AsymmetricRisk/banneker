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
});
