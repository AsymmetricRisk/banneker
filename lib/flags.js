/**
 * CLI flag parsing using Node.js built-in util.parseArgs
 */

import { parseArgs } from 'node:util';

/**
 * Parse command line flags
 * @param {string[]} argv - Array of command line arguments (without node and script path)
 * @returns {{ runtime: string|null, scope: string|null, uninstall: boolean, help: boolean, error: string|null }}
 */
export function parseFlags(argv) {
  const options = {
    claude: {
      type: 'boolean',
      short: 'c',
      default: false
    },
    opencode: {
      type: 'boolean',
      short: 'o',
      default: false
    },
    gemini: {
      type: 'boolean',
      short: 'G',
      default: false
    },
    global: {
      type: 'boolean',
      short: 'g',
      default: false
    },
    local: {
      type: 'boolean',
      short: 'l',
      default: false
    },
    uninstall: {
      type: 'boolean',
      short: 'u',
      default: false
    },
    help: {
      type: 'boolean',
      short: 'h',
      default: false
    }
  };

  // Initialize result
  const result = {
    runtime: null,
    scope: null,
    uninstall: false,
    help: false,
    error: null
  };

  // Try to parse arguments
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options,
      strict: true,
      allowPositionals: false
    });
  } catch (err) {
    result.error = err.message;
    return result;
  }

  const { values } = parsed;

  // Check for help flag
  if (values.help) {
    result.help = true;
    return result;
  }

  // Determine runtime (check for multiple runtime flags)
  const runtimeFlags = ['claude', 'opencode', 'gemini'].filter(r => values[r]);

  if (runtimeFlags.length > 1) {
    result.error = 'Cannot specify multiple runtimes';
    return result;
  }

  if (runtimeFlags.length === 1) {
    result.runtime = runtimeFlags[0];
  }

  // Determine scope (check for conflicting scope flags)
  if (values.global && values.local) {
    result.error = 'Cannot specify both --global and --local';
    return result;
  }

  if (values.global) {
    result.scope = 'global';
  } else if (values.local) {
    result.scope = 'local';
  }

  // Set uninstall flag
  result.uninstall = values.uninstall;

  return result;
}
