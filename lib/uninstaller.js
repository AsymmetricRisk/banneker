/**
 * Safe uninstaller for Banneker files
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { BANNEKER_FILES } from './constants.js';

/**
 * Safely uninstall Banneker files from target directory
 * @param {string} commandsDir - Commands directory path
 * @param {string} configDir - Config directory path (currently unused but for future expansion)
 * @returns {Promise<boolean>} true if uninstall succeeded, false if no installation found
 */
export async function uninstall(commandsDir, configDir) {
  const versionPath = join(commandsDir, 'VERSION');

  // Check if Banneker is installed
  if (!existsSync(versionPath)) {
    console.log(`No Banneker installation found at ${commandsDir}`);
    return false;
  }

  try {
    let removedCount = 0;

    // Remove each tracked Banneker file
    for (const filename of BANNEKER_FILES) {
      // Agent files (agents/*) and config files (config/*) are relative to configDir
      // Other files are relative to commandsDir
      // Skip agent/config files if configDir is not provided (backwards compatibility)
      if (filename.startsWith('agents/') || filename.startsWith('config/')) {
        if (!configDir) {
          continue; // Skip agent/config files if no configDir provided
        }
        const filePath = join(configDir, filename);
        if (existsSync(filePath)) {
          try {
            rmSync(filePath, { force: true });
            removedCount++;
          } catch (err) {
            // Handle permission errors
            if (err.code === 'EACCES' || err.code === 'EPERM') {
              console.error(`Permission denied: Cannot remove ${filePath}`);
              console.error('Try running with appropriate permissions (e.g., sudo)');
              process.exitCode = 1;
              return false;
            }
            throw err;
          }
        }
      } else {
        const filePath = join(commandsDir, filename);
        if (existsSync(filePath)) {
          try {
            rmSync(filePath, { force: true });
            removedCount++;
          } catch (err) {
            // Handle permission errors
            if (err.code === 'EACCES' || err.code === 'EPERM') {
              console.error(`Permission denied: Cannot remove ${filePath}`);
              console.error('Try running with appropriate permissions (e.g., sudo)');
              process.exitCode = 1;
              return false;
            }
            throw err;
          }
        }
      }
    }

    // Try to remove empty agents and config directories (only if configDir provided)
    if (configDir) {
      const agentsDir = join(configDir, 'agents');
      if (existsSync(agentsDir)) {
        try {
          rmSync(agentsDir, { recursive: true, force: true });
        } catch (err) {
          // Ignore errors - directory may not be empty or may have permission issues
        }
      }

      const configTargetDir = join(configDir, 'config');
      if (existsSync(configTargetDir)) {
        try {
          rmSync(configTargetDir, { recursive: true, force: true });
        } catch (err) {
          // Ignore errors - directory may not be empty or may have permission issues
        }
      }
    }

    console.log(`Removed ${removedCount} Banneker file${removedCount === 1 ? '' : 's'} from ${commandsDir}`);
    return true;

  } catch (err) {
    console.error('Error during uninstall:', err.message);
    process.exitCode = 1;
    return false;
  }
}
