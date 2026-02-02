#!/usr/bin/env node

/**
 * Run tests with strict coverage thresholds
 * Enforces 100% coverage on installer code paths (lib/installer.js, lib/paths.js, lib/flags.js)
 */

import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { pipeline } from 'node:stream/promises';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// Get script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..');

/**
 * Recursively discover all .test.js files in given directories
 */
function discoverTestFiles(directories) {
  const testFiles = [];

  for (const dir of directories) {
    const fullPath = join(PACKAGE_ROOT, dir);
    const files = readdirSync(fullPath);

    for (const file of files) {
      const filePath = join(fullPath, file);
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        // Recurse into subdirectories
        const subFiles = discoverTestFiles([join(dir, file)]);
        testFiles.push(...subFiles);
      } else if (file.endsWith('.test.js')) {
        testFiles.push(filePath);
      }
    }
  }

  return testFiles;
}

// Discover test files in unit, integration, and smoke directories
const testFiles = discoverTestFiles(['test/unit', 'test/integration', 'test/smoke']);

// Run tests with coverage enforcement
const stream = run({
  files: testFiles,
  coverage: true,
  lineCoverage: 100,
  branchCoverage: 100,
  functionCoverage: 100,
  coverageIncludeGlobs: [
    'lib/installer.js',
    'lib/paths.js',
    'lib/flags.js'
  ],
  coverageExcludeGlobs: [
    'test/**/*',
    'scripts/**/*',
    'bin/**/*'
  ],
  concurrency: 1
});

// Pipe to spec reporter and stdout
await pipeline(stream, new spec(), process.stdout);
