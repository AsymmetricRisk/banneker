/**
 * Install path resolution for different runtimes and scopes
 */

import os from 'node:os';
import path from 'node:path';
import { RUNTIMES } from './constants.js';

/**
 * Resolve installation paths for a given runtime and scope
 * @param {string} runtime - Runtime name (claude, opencode, gemini)
 * @param {string|null} scope - Install scope ('global', 'local', or null for default global)
 * @param {string} [homeDir] - Home directory (defaults to os.homedir(), optional for testing)
 * @returns {{ commandsDir: string, configDir: string }}
 * @throws {Error} If runtime is invalid
 */
export function resolveInstallPaths(runtime, scope, homeDir = os.homedir()) {
  // Validate runtime
  if (!runtime || !RUNTIMES[runtime]) {
    throw new Error(`Invalid runtime: ${runtime}`);
  }

  // Default scope to global if null
  const effectiveScope = scope || 'global';

  // Get runtime configuration
  const runtimeConfig = RUNTIMES[runtime];

  // Resolve paths based on scope
  if (effectiveScope === 'local') {
    // Local scope: relative to current working directory
    return {
      commandsDir: runtimeConfig.commands,
      configDir: runtimeConfig.config
    };
  } else {
    // Global scope: absolute paths under home directory
    return {
      commandsDir: path.join(homeDir, runtimeConfig.commands),
      configDir: path.join(homeDir, runtimeConfig.config)
    };
  }
}
