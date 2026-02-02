/**
 * Main installer orchestration
 */

import { existsSync, mkdirSync, cpSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFlags } from './flags.js';
import { resolveInstallPaths } from './paths.js';
import { promptForRuntime, promptForOverwrite } from './prompts.js';
import { uninstall } from './uninstaller.js';
import { VERSION } from './constants.js';

// Get the package root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = join(__dirname, '..');

/**
 * Display help text
 */
function showHelp() {
  console.log(`Banneker - Project planning pipeline for AI coding assistants

Usage: npx banneker [options]

Options:
  -c, --claude      Install for Claude Code
  -o, --opencode    Install for OpenCode
  -G, --gemini      Install for Gemini
  -g, --global      Install to home directory (default)
  -l, --local       Install to current directory
  -u, --uninstall   Remove Banneker files
  -h, --help        Show this help message

Examples:
  npx banneker                    Interactive installation
  npx banneker --claude --global  Non-interactive Claude Code install
  npx banneker --uninstall -c     Remove Claude Code installation
`);
}

/**
 * Main installer entry point
 */
export async function run() {
  // Parse command line flags
  const flags = parseFlags(process.argv.slice(2));

  // Handle parsing errors
  if (flags.error) {
    console.error(`Error: ${flags.error}`);
    console.log('\nRun with --help for usage information.');
    process.exitCode = 1;
    return;
  }

  // Handle help flag
  if (flags.help) {
    showHelp();
    return;
  }

  // Determine runtime (prompt if not provided)
  let runtime = flags.runtime;
  if (!runtime) {
    runtime = await promptForRuntime();
    if (!runtime) {
      // User cancelled or too many invalid attempts
      return;
    }
  }

  // Determine scope (default to global per REQ-INST-006)
  const scope = flags.scope || 'global';

  // Resolve installation paths
  let commandsDir, configDir;
  try {
    ({ commandsDir, configDir } = resolveInstallPaths(runtime, scope));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  // Handle uninstall flag
  if (flags.uninstall) {
    await uninstall(commandsDir, configDir);
    return;
  }

  // Check for existing installation
  const versionPath = join(commandsDir, 'VERSION');
  if (existsSync(versionPath)) {
    try {
      const existingVersion = readFileSync(versionPath, 'utf8').trim();
      const shouldOverwrite = await promptForOverwrite(existingVersion);

      if (!shouldOverwrite) {
        console.log('Installation cancelled.');
        return;
      }
    } catch (err) {
      // If we can't read VERSION file, proceed anyway
      console.warn('Warning: Could not read existing VERSION file');
    }
  }

  // Create target directory
  try {
    mkdirSync(commandsDir, { recursive: true });
  } catch (err) {
    if (err.code === 'EACCES' || err.code === 'EPERM') {
      console.error(`Permission denied: Cannot create ${commandsDir}`);
      console.error('Try running with appropriate permissions or use --local for current directory');
      process.exitCode = 1;
      return;
    }
    throw err;
  }

  // Copy template files
  const templatesDir = join(PACKAGE_ROOT, 'templates', 'commands');
  try {
    cpSync(templatesDir, commandsDir, {
      recursive: true,
      force: true,
      filter: (src) => {
        // Skip .gitkeep files
        return !src.endsWith('.gitkeep');
      }
    });
  } catch (err) {
    console.error(`Error copying templates: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  // Write VERSION file
  try {
    writeFileSync(versionPath, VERSION + '\n', 'utf8');
  } catch (err) {
    if (err.code === 'EACCES' || err.code === 'EPERM') {
      console.error(`Permission denied: Cannot write to ${versionPath}`);
      process.exitCode = 1;
      return;
    }
    throw err;
  }

  // Success!
  console.log(`\nBanneker v${VERSION} installed to ${commandsDir}`);
}
